import { z } from 'zod'
import { Prisma, type DimensionConfig, type QuantityConfig } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { AppError, handleRouteError, requireUser, ok, created } from '@/lib/api-utils'
import { cartItemSchema } from '@/lib/validations/order'
import { priceLine } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      items: { include: { product: { include: { allowedDimensions: true, allowedQuantities: true } } } },
    },
  })
}

async function pricingSettings() {
  const rows = await prisma.setting.findMany({ where: { isPublic: true } })
  const kv: Record<string, unknown> = {}
  for (const s of rows) {
    if (s.type === 'NUMBER') kv[s.key] = parseFloat(s.value)
    else if (s.type === 'BOOLEAN') kv[s.key] = s.value === 'true'
    else kv[s.key] = s.value
  }
  const num = (k: string, d: number) => (Number.isFinite(Number(kv[k])) ? Number(kv[k]) : d)
  return {
    globalTaxPercent: num('global_tax_percent', 5),
    taxInclusivePricing: kv['tax_inclusive_pricing'] === true,
    insideDhakaCharge: num('delivery_inside_dhaka_charge', 60),
    outsideDhakaCharge: num('delivery_outside_dhaka_charge', 120),
    freeDeliveryThreshold: num('free_delivery_threshold', 2000),
  }
}

function toPriceable(product: Prisma.ProductGetPayload<{ include: { allowedDimensions: true; allowedQuantities: true } }>) {
  return {
    basePrice: Number(product.basePrice),
    taxPercent: Number(product.taxPercent),
    additionalCharge: Number(product.additionalCharge),
    allowedDimensions: product.allowedDimensions.map((d: DimensionConfig) => ({
      width: d.width, height: d.height, priceMultiplier: Number(d.priceMultiplier),
    })),
    allowedQuantities: product.allowedQuantities.map((q: QuantityConfig) => ({
      minQty: q.minQty, maxQty: q.maxQty, pricePerUnit: Number(q.pricePerUnit),
    })),
  }
}

export async function GET() {
  try {
    const user = await requireUser()
    const cart = await getOrCreateCart(user.id)
    const settings = await pricingSettings()

    const items = cart.items.map((item) => {
      const priced = priceLine(
        { product: toPriceable(item.product), width: item.width, height: item.height, quantity: item.quantity },
        settings.globalTaxPercent
      )
      return {
        ...item,
        product: { ...item.product, basePrice: Number(item.product.basePrice), taxPercent: Number(item.product.taxPercent), additionalCharge: Number(item.product.additionalCharge) },
        unitPrice: priced.unitPrice,
        lineTotal: priced.lineTotal,
        taxAmount: priced.taxAmount,
        dimensionValid: priced.dimensionMatched,
        inStock: !item.product.trackInventory || item.product.stock >= item.quantity,
      }
    })

    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0)
    const taxAmount = items.reduce((s, i) => s + i.taxAmount, 0)

    return ok({ cart: { ...cart, items }, totals: { subtotal, taxAmount, itemCount: items.length } })
  } catch (error) {
    return handleRouteError(error)
  }
}

const addSchema = cartItemSchema.extend({
  mode: z.enum(['add', 'set']).default('add'),
})

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const validated = addSchema.parse(body)

    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      include: { allowedDimensions: true, allowedQuantities: true },
    })
    if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
    if (!product.isActive) throw new AppError(400, 'This product is no longer available', 'PRODUCT_INACTIVE')
    if (!product.allowedDimensions.some((d) => d.width === validated.width && d.height === validated.height)) {
      throw new AppError(400, 'Selected size is not available for this product', 'INVALID_DIMENSION')
    }
    if (product.trackInventory && product.stock < validated.quantity) {
      throw new AppError(409, `Only ${product.stock} left in stock`, 'OUT_OF_STOCK')
    }

    const cart = await getOrCreateCart(user.id)
    const item = await prisma.cartItem.upsert({
      where: { cartId_productId_width_height: { cartId: cart.id, productId: product.id, width: validated.width, height: validated.height } },
      create: {
        cartId: cart.id,
        productId: product.id,
        width: validated.width,
        height: validated.height,
        quantity: validated.quantity,
        customization: validated.customization ?? undefined,
      },
      update: {
        quantity: validated.mode === 'add' ? { increment: validated.quantity } : validated.quantity,
        customization: validated.customization ?? undefined,
      },
    })

    return created({ item })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE() {
  try {
    const user = await requireUser()
    const cart = await prisma.cart.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    return ok({ message: 'Cart cleared' })
  } catch (error) {
    return handleRouteError(error)
  }
}
