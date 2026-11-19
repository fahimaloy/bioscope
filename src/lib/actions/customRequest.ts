'use server'

import { Prisma, type CustomRequestStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { submitCustomRequestSchema, priceCustomRequestSchema, updateCustomRequestStatusSchema } from '@/lib/validations/custom-request'
import { AppError, requireUser, requireAdmin, buildPagination } from '@/lib/api-utils'
import { emitCustomRequestSubmitted, emitCustomRequestPriced, emitNotificationNew, emitNewOrder } from '@/lib/server/socket-emit'
import { dispatchWebhook } from '@/lib/server/webhooks'
import { generateOrderNumber } from '@/lib/utils'
import { computeOrderTotals, priceLine } from '@/lib/pricing'
import { getPricingSettings } from './settings'
import { createOrderFromRequestSchema } from '@/lib/validations/custom-request'

const CR_SORT_FIELDS = ['createdAt', 'status', 'quantity', 'quotedPrice'] as const

export async function submitCustomRequest(data: unknown) {
  const sessionUser = await requireUser()

  const validated = submitCustomRequestSchema.parse(data)

  // Enforce public custom-request settings (enabled, min qty, max dimension)
  const publicSettings = await prisma.setting.findMany({ where: { isPublic: true } })
  const kv: Record<string, string | number | boolean> = {}
  for (const s of publicSettings) {
    if (s.type === 'NUMBER') kv[s.key] = parseFloat(s.value)
    else if (s.type === 'BOOLEAN') kv[s.key] = s.value === 'true'
    else kv[s.key] = s.value
  }
  if (kv['custom_request_enabled'] === false) {
    throw new AppError(403, 'Custom sticker requests are currently disabled', 'DISABLED')
  }
  const minQty = Number(kv['custom_request_min_quantity'] ?? 10)
  if (validated.quantity < minQty) {
    throw new AppError(400, `Minimum quantity for custom requests is ${minQty}`, 'MIN_QUANTITY')
  }
  const maxDim = Number(kv['custom_request_max_dimension_cm'] ?? 30)
  if (validated.width > maxDim || validated.height > maxDim) {
    throw new AppError(400, `Maximum dimension is ${maxDim} cm`, 'MAX_DIMENSION')
  }

  const customRequest = await prisma.customRequest.create({
    data: {
      userId: sessionUser.id,
      imageUrl: validated.imageUrl,
      originalName: validated.originalName,
      width: validated.width,
      height: validated.height,
      quantity: validated.quantity,
      material: validated.material,
      finish: validated.finish,
      cutType: validated.cutType,
      notes: validated.notes,
      status: 'PENDING',
    },
  })

  // Emit real-time event
  await emitCustomRequestSubmitted(customRequest)
  await dispatchWebhook('custom_request.submitted', customRequest)

  // Create notification for admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  const notifications = await Promise.all(admins.map((admin) =>
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'CUSTOM_REQUEST',
        title: 'New Custom Sticker Request',
        message: `${sessionUser.name || 'A customer'} submitted a custom sticker request`,
        data: { requestId: customRequest.id, url: `/admin/custom-requests/${customRequest.id}` },
      },
    })
  ))
  await Promise.all(notifications.map((n) => emitNotificationNew(n)))

  revalidatePath('/admin/custom-requests')
  revalidatePath('/custom-sticker')

  return { success: true, customRequest }
}

/** Statuses an admin can send back to the customer for another pass. */
const REVISION_ALLOWED_FROM: CustomRequestStatus[] = ['PENDING', 'APPROVED', 'PRICED']

export async function updateCustomRequestStatus(id: string, data: unknown) {
  await requireAdmin()

  const validated = updateCustomRequestStatusSchema.parse(data)

  const customRequest = await prisma.customRequest.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!customRequest) throw new AppError(404, 'Custom request not found', 'NOT_FOUND')

  if (
    validated.status === 'REVISION_REQUESTED' &&
    !REVISION_ALLOWED_FROM.includes(customRequest.status as CustomRequestStatus)
  ) {
    throw new AppError(
      409,
      `Only a pending, approved or priced request can be sent for revision (currently ${customRequest.status})`,
      'INVALID_TRANSITION'
    )
  }

  const updateData: Prisma.CustomRequestUpdateInput = {
    status: validated.status,
    adminNotes: validated.adminNotes,
  }

  if (validated.status === 'PRICED' && validated.quotedPrice) {
    updateData.quotedPrice = validated.quotedPrice
    updateData.quotedAt = new Date()
  }

  const updatedRequest = await prisma.customRequest.update({
    where: { id },
    data: updateData,
    include: { user: true },
  })

  // Emit real-time event if priced
  if (validated.status === 'PRICED' && validated.quotedPrice) {
    await emitCustomRequestPriced(updatedRequest)
    await dispatchWebhook('custom_request.priced', updatedRequest)

    // Notify customer
    const notification = await prisma.notification.create({
      data: {
        userId: customRequest.userId,
        type: 'CUSTOM_REQUEST_PRICED',
        title: 'Custom Request Priced',
        message: `Your custom sticker request has been priced at ${validated.quotedPrice} BDT`,
        data: { requestId: id, quotedPrice: validated.quotedPrice, url: `/custom-sticker` },
      },
    })
    await emitNotificationNew(notification)
  } else {
    await dispatchWebhook('custom_request.updated', updatedRequest)
  }

  revalidatePath('/admin/custom-requests')
  revalidatePath(`/custom-sticker`)

  return { success: true, customRequest: updatedRequest }
}

export async function priceCustomRequest(id: string, data: unknown) {
  await requireAdmin()

  const validated = priceCustomRequestSchema.parse(data)

  const customRequest = await prisma.customRequest.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!customRequest) throw new AppError(404, 'Custom request not found', 'NOT_FOUND')

  const updatedRequest = await prisma.customRequest.update({
    where: { id },
    data: {
      status: 'PRICED',
      quotedPrice: validated.quotedPrice,
      adminNotes: validated.adminNotes,
      quotedAt: new Date(),
    },
    include: { user: true },
  })

  // Emit real-time event
  await emitCustomRequestPriced(updatedRequest)
  await dispatchWebhook('custom_request.priced', updatedRequest)

  // Notify customer
  const notification = await prisma.notification.create({
    data: {
      userId: customRequest.userId,
      type: 'CUSTOM_REQUEST_PRICED',
      title: 'Custom Request Priced',
      message: `Your custom sticker request has been priced at ${validated.quotedPrice} BDT`,
      data: { requestId: id, quotedPrice: validated.quotedPrice, url: `/custom-sticker` },
    },
  })
  await emitNotificationNew(notification)

  revalidatePath('/admin/custom-requests')
  revalidatePath('/custom-sticker')

  return { success: true, customRequest: updatedRequest }
}

/**
 * Turn a priced custom request into a real order.
 *
 * The admin picks the product the request is produced as, the customer's
 * shipping address and the size/quantity. Prices are recomputed server-side
 * from the product's own config — the client's numbers are never trusted.
 */
export async function createOrderFromCustomRequest(requestId: string, data: unknown) {
  await requireAdmin()
  const validated = createOrderFromRequestSchema.parse(data)

  const request = await prisma.customRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  })
  if (!request) throw new AppError(404, 'Custom request not found', 'NOT_FOUND')
  if (request.orderId) throw new AppError(409, 'This request already has an order', 'ALREADY_ORDERED')
  if (request.status !== 'PRICED' && request.status !== 'APPROVED') {
    throw new AppError(409, 'Only a priced request can be turned into an order', 'NOT_PRICED')
  }

  const product = await prisma.product.findUnique({
    where: { id: validated.productId },
    include: { allowedDimensions: true, allowedQuantities: true },
  })
  if (!product || !product.isActive) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  if (!product.allowedDimensions.some((d) => d.width === validated.width && d.height === validated.height)) {
    throw new AppError(400, 'That size is not available for the selected product', 'INVALID_DIMENSION')
  }

  const address = await prisma.address.findFirst({
    where: { id: validated.addressId, userId: request.userId },
  })
  if (!address) throw new AppError(404, 'That address does not belong to this customer', 'ADDRESS_NOT_FOUND')

  if (product.trackInventory && product.stock < validated.quantity) {
    throw new AppError(409, `Only ${product.stock} left in stock`, 'OUT_OF_STOCK')
  }

  const settings = await getPricingSettings()
  const priced = priceLine(
    {
      product: {
        basePrice: Number(product.basePrice),
        taxPercent: Number(product.taxPercent),
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
      width: validated.width,
      height: validated.height,
      quantity: validated.quantity,
    },
    settings.globalTaxPercent
  )
  const totals = computeOrderTotals([priced], address.deliveryZone, settings)

  const order = await prisma.$transaction(async (tx) => {
    if (product.trackInventory) {
      const res = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: validated.quantity } },
        data: { stock: { decrement: validated.quantity } },
      })
      if (res.count === 0) throw new AppError(409, `Insufficient stock for "${product.name}"`, 'OUT_OF_STOCK')
    }

    let orderNumber = generateOrderNumber()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await tx.order.create({
          data: {
            orderNumber,
            userId: request.userId,
            status: 'PENDING',
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            deliveryCharge: totals.deliveryCharge,
            discountAmount: totals.discountAmount,
            total: totals.total,
            currency: 'BDT',
            shippingName: address.name,
            shippingPhone: address.phone,
            shippingAddress: `${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}`,
            shippingCity: address.city,
            shippingDistrict: address.district,
            shippingDivision: address.division,
            shippingPostalCode: address.postalCode,
            deliveryZone: address.deliveryZone,
            paymentMethod: validated.paymentMethod,
            paymentStatus: 'PENDING',
            notes: validated.notes ?? null,
            addressId: address.id,
            customRequestId: request.id,
            items: {
              create: [
                {
                  productId: product.id,
                  productName: product.name,
                  productSlug: product.slug,
                  productImage: product.images[0] || '',
                  width: validated.width,
                  height: validated.height,
                  quantity: validated.quantity,
                  unitPrice: priced.unitPrice,
                  totalPrice: priced.lineTotal,
                  taxPercent: priced.taxPercent,
                  taxAmount: priced.taxAmount,
                  customization: {
                    customRequestId: request.id,
                    material: request.material,
                    finish: request.finish,
                    cutType: request.cutType,
                    originalName: request.originalName,
                  },
                },
              ],
            },
          },
          include: { items: true },
        })
        return created
      } catch (error) {
        if ((error as { code?: string })?.code === 'P2002') {
          orderNumber = generateOrderNumber()
          continue
        }
        throw error
      }
    }
    throw new AppError(500, 'Could not create the order, please try again', 'ORDER_CREATE_FAILED')
  })

  await prisma.customRequest.update({
    where: { id: request.id },
    data: { status: 'ORDERED', orderId: order.id, orderedAt: new Date() },
  })

  await emitNewOrder(order)
  await dispatchWebhook('order.created', order)

  const notification = await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'CUSTOM_REQUEST_ORDERED',
      title: 'Your custom sticker order is confirmed',
      message: `Order ${order.orderNumber} has been created from your custom request.`,
      data: { orderId: order.id, orderNumber: order.orderNumber, url: `/orders/${order.id}` },
    },
  })
  await emitNotificationNew(notification)

  revalidatePath('/admin/custom-requests')
  revalidatePath('/admin/orders')
  revalidatePath(`/orders/${order.id}`)

  return { success: true, order, customRequest: { id: request.id, status: 'ORDERED' } }
}

/**
 * Customer re-submits a request that was sent back for revision.
 * Only the owner of the request can do this, and only while it is in
 * REVISION_REQUESTED — the previous quote is cleared so it gets repriced.
 */
export async function resubmitCustomRequest(id: string, data: unknown) {
  const sessionUser = await requireUser()

  const customRequest = await prisma.customRequest.findUnique({ where: { id } })
  if (!customRequest || customRequest.userId !== sessionUser.id) {
    throw new AppError(404, 'Custom request not found', 'NOT_FOUND')
  }
  if (customRequest.status !== 'REVISION_REQUESTED') {
    throw new AppError(409, 'This request is not waiting for a revision', 'NOT_AWAITING_REVISION')
  }

  const validated = submitCustomRequestSchema.parse(data)

  const updated = await prisma.customRequest.update({
    where: { id },
    data: {
      imageUrl: validated.imageUrl,
      originalName: validated.originalName,
      width: validated.width,
      height: validated.height,
      quantity: validated.quantity,
      material: validated.material,
      finish: validated.finish,
      cutType: validated.cutType,
      notes: validated.notes,
      status: 'PENDING',
      quotedPrice: null,
      quotedAt: null,
    },
    include: { user: true },
  })

  await emitCustomRequestSubmitted(updated)
  await dispatchWebhook('custom_request.submitted', updated)

  revalidatePath('/custom-sticker')
  revalidatePath('/admin/custom-requests')

  return { success: true, customRequest: updated }
}

export interface CustomRequestFilters {
  userId?: string
  status?: CustomRequestStatus
  startDate?: string
  endDate?: string
  search?: string
  page?: number | string
  limit?: number | string
  sortBy?: (typeof CR_SORT_FIELDS)[number]
  sortOrder?: 'asc' | 'desc'
}

export async function getCustomRequests(filters: CustomRequestFilters = {}) {
  const sessionUser = await requireUser()

  const where: Prisma.CustomRequestWhereInput = {}

  if (sessionUser.role !== 'ADMIN') {
    where.userId = sessionUser.id
  } else if (filters.userId) {
    where.userId = filters.userId
  }

  if (filters.status) where.status = filters.status
  const dateFilter: Prisma.DateTimeFilter = {}
  if (filters.startDate) dateFilter.gte = new Date(filters.startDate)
  if (filters.endDate) dateFilter.lte = new Date(filters.endDate)
  if (filters.startDate || filters.endDate) where.createdAt = dateFilter
  if (filters.search) {
    where.OR = [
      { originalName: { contains: filters.search, mode: 'insensitive' } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20))
  const sortBy = (CR_SORT_FIELDS as readonly string[]).includes(filters.sortBy ?? '')
    ? (filters.sortBy as (typeof CR_SORT_FIELDS)[number])
    : 'createdAt'
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc'

  const [requests, total] = await Promise.all([
    prisma.customRequest.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        order: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customRequest.count({ where }),
  ])

  return { data: requests, pagination: buildPagination(page, limit, total) }
}

export async function getCustomRequestById(id: string) {
  const sessionUser = await requireUser()

  const where: Prisma.CustomRequestWhereUniqueInput = { id }
  if (sessionUser.role !== 'ADMIN') where.userId = sessionUser.id

  const request = await prisma.customRequest.findUnique({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
      order: true,
    },
  })
  if (!request) throw new AppError(404, 'Custom request not found', 'NOT_FOUND')
  return request
}

export async function getCustomRequestStats() {
  await requireAdmin()

  const [total, pending, priced, completed] = await Promise.all([
    prisma.customRequest.count(),
    prisma.customRequest.count({ where: { status: 'PENDING' } }),
    prisma.customRequest.count({ where: { status: 'PRICED' } }),
    prisma.customRequest.count({ where: { status: 'ORDERED' } }),
  ])

  return { total, pending, priced, completed }
}

export async function deleteCustomRequest(id: string) {
  await requireAdmin()

  await prisma.customRequest.delete({ where: { id } })
  revalidatePath('/admin/custom-requests')
  return { success: true }
}