'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { checkoutSchema, orderStatusUpdateSchema, cartItemSchema } from '@/lib/validations/order'
import { generateOrderNumber } from '@/lib/utils'
import { computeOrderTotals, computeDiscount, priceLine, type PricedLine, type PricingSettings } from '@/lib/pricing'
import { canTransition, CUSTOMER_CANCELLABLE, ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/order-status'
import { AppError, requireUser, requireAdmin, buildPagination } from '@/lib/api-utils'
import { emitNewOrder, emitOrderStatusChange, emitNotificationNew } from '@/lib/server/socket-emit'
import { getPricingSettings } from './settings'

// Allow the client to send its cart explicitly (client-side cart is the source
// of truth in the UI); falls back to the persisted server cart.
const checkoutWithItemsSchema = checkoutSchema.extend({
  items: z.array(cartItemSchema).min(1, 'Cart is empty').max(50).optional(),
})

const ORDER_SORT_FIELDS = ['createdAt', 'total', 'status', 'orderNumber'] as const

async function notifyAdmins(title: string, message: string, data: Record<string, unknown>) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
  const notifications = await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: { userId: admin.id, type: 'NEW_ORDER', title, message, data: JSON.parse(JSON.stringify(data ?? {})) as Prisma.InputJsonValue },
      })
    )
  )
  await Promise.all(notifications.map((n) => emitNotificationNew(n)))
}

// ---- request payload types (validated downstream by zod schemas) ----
export type CreateOrderPayload = z.infer<typeof checkoutSchema> & {
  items: { productId: string; width: number; height: number; quantity: number; customization?: Prisma.InputJsonValue }[]
}
export type OrderStatusPayload = { status: string; notes?: string; trackingNumber?: string }
export type OrderUpdatePayload = Record<string, unknown>
export type BulkOrderPayload = { ids: string[]; status: string }
type OrderFilters = {
  status?: string
  userId?: string
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
  minAmount?: string | number
  maxAmount?: string | number
  paymentStatus?: string
}

export async function createOrder(data: CreateOrderPayload) {
  const sessionUser = await requireUser()
  const validated = checkoutWithItemsSchema.parse(data)

  const address = await prisma.address.findFirst({
    where: { id: validated.addressId, userId: sessionUser.id },
  })
  if (!address) throw new AppError(404, 'Address not found', 'ADDRESS_NOT_FOUND')

  // Resolve cart lines: explicit payload wins, otherwise the persisted server cart.
  let lines: { productId: string; width: number; height: number; quantity: number; customization?: Prisma.InputJsonValue }[]
  if (validated.items && validated.items.length > 0) {
    lines = validated.items
  } else {
    const cart = await prisma.cart.findUnique({
      where: { userId: sessionUser.id },
      include: { items: true },
    })
    if (!cart || cart.items.length === 0) throw new AppError(400, 'Cart is empty', 'CART_EMPTY')
    lines = cart.items.map((i) => ({
      productId: i.productId,
      width: i.width,
      height: i.height,
      quantity: i.quantity,
      customization: i.customization as Prisma.InputJsonValue,
    }))
  }

  // Load products with pricing config
  const productIds = [...new Set(lines.map((l) => l.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { allowedDimensions: true, allowedQuantities: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  const settings: PricingSettings = await getPricingSettings()

  // Validate + price every line server-side (never trust client prices)
  const pricedLines: (PricedLine & { productId: string; product: Prisma.ProductGetPayload<Record<string, never>>; line: (typeof lines)[number] })[] = []
  for (const line of lines) {
    const product = productMap.get(line.productId)
    if (!product) throw new AppError(400, `Product not found: ${line.productId}`, 'PRODUCT_NOT_FOUND')
    if (!product.isActive) throw new AppError(400, `"${product.name}" is no longer available`, 'PRODUCT_INACTIVE')
    if (!product.allowedDimensions.some((d) => d.width === line.width && d.height === line.height)) {
      throw new AppError(400, `Selected size is not available for "${product.name}"`, 'INVALID_DIMENSION')
    }
    if (product.trackInventory && product.stock < line.quantity) {
      throw new AppError(409, `Insufficient stock for "${product.name}" (available: ${product.stock})`, 'OUT_OF_STOCK')
    }
    const priced = priceLine(
      {
        product: {
          basePrice: Number(product.basePrice),
          taxPercent: Number(product.taxPercent) || settings.globalTaxPercent,
          additionalCharge: Number(product.additionalCharge),
          allowedDimensions: product.allowedDimensions.map((d) => ({
            width: d.width,
            height: d.height,
            priceMultiplier: Number(d.priceMultiplier),
          })),
          allowedQuantities: product.allowedQuantities.map((q) => ({
            minQty: q.minQty,
            maxQty: q.maxQty,
            pricePerUnit: Number(q.pricePerUnit),
          })),
        },
        width: line.width,
        height: line.height,
        quantity: line.quantity,
      },
      settings.globalTaxPercent
    )
    pricedLines.push({ ...priced, productId: product.id, product, line })
  }

  // Promo code: settings key `promo_<CODE>` with JSON value { type: 'percent'|'fixed', value }
  let discountAmount = 0
  if (validated.promoCode) {
    const promo = await prisma.setting.findUnique({ where: { key: `promo_${validated.promoCode.toUpperCase()}` } })
    if (!promo) throw new AppError(400, 'Invalid promo code', 'INVALID_PROMO')
    try {
      const parsed = JSON.parse(promo.value) as { type: 'percent' | 'fixed'; value: number }
      const subtotalPreview = pricedLines.reduce((s, l) => s + l.lineTotal, 0)
      discountAmount = computeDiscount(parsed, subtotalPreview)
    } catch {
      throw new AppError(400, 'Invalid promo code', 'INVALID_PROMO')
    }
  }

  const totals = computeOrderTotals(pricedLines, address.deliveryZone, settings, discountAmount)

  const order = await prisma.$transaction(async (tx) => {
    // Conditional stock decrement (guards against races)
    for (const { product, line } of pricedLines) {
      if (product.trackInventory) {
        const res = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        })
        if (res.count === 0) throw new AppError(409, `Insufficient stock for "${product.name}"`, 'OUT_OF_STOCK')
      }
    }

    let orderNumber = generateOrderNumber()
    let attempts = 0
    let created!: Prisma.OrderGetPayload<{ include: { items: true } }>
    while (attempts < 5) {
      try {
        created = await tx.order.create({
          data: {
            orderNumber,
            userId: sessionUser.id,
            status: 'PENDING',
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            deliveryCharge: totals.deliveryCharge,
            discountAmount: totals.discountAmount,
            total: totals.total,
            currency: 'BDT',
            shippingName: address.name,
            shippingPhone: address.phone,
            shippingAddress: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}`,
            shippingCity: address.city,
            shippingDistrict: address.district,
            shippingDivision: address.division,
            shippingPostalCode: address.postalCode,
            deliveryZone: address.deliveryZone,
            paymentMethod: validated.paymentMethod,
            paymentStatus: 'PENDING',
            notes: validated.notes || null,
            addressId: address.id,
            items: {
              create: pricedLines.map(({ product, line, ...priced }): Prisma.OrderItemUncheckedCreateWithoutOrderInput => ({
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                productImage: product.images[0] || '',
                width: line.width,
                height: line.height,
                quantity: line.quantity,
                unitPrice: priced.unitPrice,
                totalPrice: priced.lineTotal,
                taxPercent: priced.taxPercent,
                taxAmount: priced.taxAmount,
                customization: line.customization ?? undefined,
              })),
            },
          },
          include: { items: true },
        })
        break
      } catch (err) {
        if ((err as { code?: string })?.code === 'P2002') {
          orderNumber = generateOrderNumber()
          attempts++
          continue
        }
        throw err
      }
    }
    if (!created) throw new AppError(500, 'Could not create order, please try again', 'ORDER_CREATE_FAILED')

    // Clear the persisted cart if it exists
    const cart = await tx.cart.findUnique({ where: { userId: sessionUser.id }, select: { id: true } })
    if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

    return created
  })

  await emitNewOrder(order)
  await notifyAdmins(
    `New Order: ${order.orderNumber}`,
    `New order from ${address.name} for ${Number(order.total).toLocaleString()} BDT`,
    { orderId: order.id, orderNumber: order.orderNumber, url: `/admin/orders/${order.id}` }
  )

  revalidatePath('/orders')
  revalidatePath('/admin/orders')
  revalidatePath('/shop')

  return { success: true, order }
}

export async function updateOrderStatus(id: string, data: OrderStatusPayload) {
  const admin = await requireAdmin()
  const validated = orderStatusUpdateSchema.parse(data)
  const newStatus = validated.status as OrderStatus

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND')

  if (order.status === newStatus) return { success: true, order }
  if (!canTransition(order.status as OrderStatus, newStatus)) {
    throw new AppError(409, `Cannot move order from ${ORDER_STATUS_LABELS[order.status as OrderStatus]} to ${ORDER_STATUS_LABELS[newStatus]}`, 'INVALID_TRANSITION')
  }

  const [updatedOrder] = await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
        adminNotes: validated.notes ?? order.adminNotes,
        trackingNumber: validated.trackingNumber ?? order.trackingNumber,
        shippedAt: newStatus === 'SHIPPED' ? new Date() : order.shippedAt,
        deliveredAt: newStatus === 'DELIVERED' ? new Date() : order.deliveredAt,
        paymentStatus: newStatus === 'DELIVERED' && order.paymentMethod === 'COD' ? 'PAID' : order.paymentStatus,
      },
      include: { user: true, items: true },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status as OrderStatus,
        toStatus: newStatus,
        changedBy: admin.id as string,
        note: validated.notes ?? null,
      },
    }),
  ])

  await emitOrderStatusChange(updatedOrder, order.status, newStatus)

  const notification = await prisma.notification.create({
    data: {
      userId: order.userId,
      type: 'ORDER_STATUS_CHANGED',
      title: `Order ${order.orderNumber} is now ${ORDER_STATUS_LABELS[newStatus]}`,
      message: `Your order status changed from ${ORDER_STATUS_LABELS[order.status as OrderStatus]} to ${ORDER_STATUS_LABELS[newStatus]}${validated.trackingNumber ? `. Tracking: ${validated.trackingNumber}` : ''}`,
      data: { orderId: order.id, orderNumber: order.orderNumber, oldStatus: order.status, newStatus, url: `/orders/${order.id}` },
    },
  })
  await emitNotificationNew(notification)

  revalidatePath('/admin/orders')
  revalidatePath(`/orders/${id}`)
  revalidatePath('/orders')

  return { success: true, order: updatedOrder }
}

const updateOrderSchema = z.object({
  trackingNumber: z.string().max(100).nullish(),
  notes: z.string().max(1000).nullish(),
  adminNotes: z.string().max(1000).nullish(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
})

export async function updateOrder(id: string, data: OrderUpdatePayload) {
  await requireAdmin()
  const validated = updateOrderSchema.parse(data)

  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND')

  const updated = await prisma.order.update({
    where: { id },
    data: {
      ...(validated.trackingNumber !== undefined && { trackingNumber: validated.trackingNumber }),
      ...(validated.notes !== undefined && { notes: validated.notes }),
      ...(validated.adminNotes !== undefined && { adminNotes: validated.adminNotes }),
      ...(validated.paymentStatus && { paymentStatus: validated.paymentStatus }),
    },
    include: { user: true, items: true },
  })

  revalidatePath('/admin/orders')
  revalidatePath(`/orders/${id}`)
  return { success: true, order: updated }
}

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Select at least one order').max(100),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'PRINTING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  trackingNumber: z.string().max(100).optional(),
  adminNotes: z.string().max(1000).optional(),
})

export async function bulkUpdateOrders(data: BulkOrderPayload) {
  await requireAdmin()
  const validated = bulkUpdateSchema.parse(data)

  const orders = await prisma.order.findMany({ where: { id: { in: validated.ids } } })
  if (orders.length === 0) throw new AppError(404, 'No orders found', 'ORDERS_NOT_FOUND')

  const results: { updated: number; skipped: string[] } = { updated: 0, skipped: [] }

  for (const order of orders) {
    if (validated.status && order.status !== validated.status) {
      if (!canTransition(order.status as OrderStatus, validated.status as OrderStatus)) {
        results.skipped.push(order.orderNumber)
        continue
      }
    }
    await prisma.order.update({
      where: { id: order.id },
      data: {
        ...(validated.status && { status: validated.status }),
        ...(validated.trackingNumber !== undefined && { trackingNumber: validated.trackingNumber }),
        ...(validated.adminNotes !== undefined && { adminNotes: validated.adminNotes }),
        ...(validated.status === 'SHIPPED' && { shippedAt: new Date() }),
        ...(validated.status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
    })
    results.updated++
  }

  revalidatePath('/admin/orders')
  return { success: true, ...results }
}

export async function cancelOrder(id: string, reason?: string) {
  const sessionUser = await requireUser()

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND')

  const isAdmin = sessionUser.role === 'ADMIN'
  if (!isAdmin && order.userId !== sessionUser.id) throw new AppError(403, 'Not allowed', 'FORBIDDEN')

  if (!isAdmin && !CUSTOMER_CANCELLABLE.includes(order.status as OrderStatus)) {
    throw new AppError(409, 'This order can no longer be cancelled', 'NOT_CANCELLABLE')
  }
  if (order.status === 'CANCELLED') return { success: true, order }
  if (order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.status === 'REFUNDED') {
    throw new AppError(409, 'Cannot cancel shipped, delivered, or refunded orders', 'NOT_CANCELLABLE')
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Restock items
    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId }, select: { trackInventory: true } })
      if (product?.trackInventory) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
      }
    }
    return tx.order.update({
      where: { id },
      data: { status: 'CANCELLED', adminNotes: reason ?? (isAdmin ? order.adminNotes : order.adminNotes) },
      include: { user: true, items: true },
    })
  })

  await emitOrderStatusChange(updated, order.status, 'CANCELLED')

  if (isAdmin && order.userId !== sessionUser.id) {
    const notification = await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER_STATUS_CHANGED',
        title: `Order ${order.orderNumber} Cancelled`,
        message: `Your order has been cancelled${reason ? `. Reason: ${reason}` : ''}`,
        data: { orderId: order.id, orderNumber: order.orderNumber, url: `/orders/${order.id}` },
      },
    })
    await emitNotificationNew(notification)
  }

  revalidatePath('/admin/orders')
  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)

  return { success: true, order: updated }
}

export async function getOrders(filters: OrderFilters = {}) {
  const sessionUser = await requireUser()

  const where: Prisma.OrderWhereInput = {}
  if (sessionUser.role !== 'ADMIN') {
    where.userId = sessionUser.id
  } else if (filters.userId) {
    where.userId = filters.userId
  }
  if (filters.status) where.status = filters.status as OrderStatus
  const dateFilter: Prisma.DateTimeFilter = {}
  if (filters.startDate) dateFilter.gte = new Date(filters.startDate)
  const totalFilter: Prisma.DecimalFilter = {}
  if (filters.endDate) dateFilter.lte = new Date(filters.endDate)
  if (filters.startDate || filters.endDate) where.createdAt = dateFilter
  if (filters.minAmount) totalFilter.gte = new Prisma.Decimal(Number(filters.minAmount))
  if (filters.maxAmount) totalFilter.lte = new Prisma.Decimal(Number(filters.maxAmount))
  if (filters.minAmount || filters.maxAmount) where.total = totalFilter
  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { shippingName: { contains: filters.search, mode: 'insensitive' } },
      { shippingPhone: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20))
  const sortBy = (ORDER_SORT_FIELDS as readonly string[]).includes(filters.sortBy ?? '') ? (filters.sortBy as 'orderNumber' | 'status' | 'total' | 'createdAt') : 'createdAt'
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc'

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: true,
        address: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return { data: orders, pagination: buildPagination(page, limit, total) }
}

export async function getOrderById(id: string) {
  const sessionUser = await requireUser()
  const where = { id } as { id: string; userId?: string }
  if (sessionUser.role !== 'ADMIN') where.userId = sessionUser.id

  const order = await prisma.order.findUnique({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      address: true,
      customRequest: true,
    },
  })
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND')
  return order
}

export async function getOrderByNumber(orderNumber: string) {
  const sessionUser = await requireUser()
  const where = { orderNumber } as { orderNumber: string; userId?: string }
  if (sessionUser.role !== 'ADMIN') where.userId = sessionUser.id

  const order = await prisma.order.findUnique({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      address: true,
    },
  })
  if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND')
  return order
}

export async function getOrderStats() {
  await requireAdmin()

  const activeStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PRINTING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED']
  const [totalOrders, pendingOrders, revenue, statusCounts] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: activeStatuses as OrderStatus[] } },
    }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
  ])

  return {
    totalOrders,
    pendingOrders,
    totalRevenue: Number(revenue._sum.total || 0),
    statusCounts: statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>),
  }
}
