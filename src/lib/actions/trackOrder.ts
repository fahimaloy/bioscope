import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/api-utils'
import { trackOrderSchema, type TrackedOrder } from '@/lib/validations/track-order'

/**
 * C4 / rebuild task 2.13 — the ONE granted exception to the frozen logic
 * layer: a read-only public order lookup. No session, no writes.
 *
 * Anti-enumeration: the order number must match AND the email (account) or
 * phone (shipping) must match the same order; any miss throws the same
 * generic 404 — the response never reveals whether the number alone exists.
 * The route rate-limits by IP (track-order bucket). The returned shape is
 * narrow and PII-free (no name, address, email, phone, notes): only what a
 * customer tracking their own parcel needs. Decimals are coerced to numbers
 * at this boundary (decimal-boundary audit: serialized Decimals are strings).
 */
export async function trackOrder(input: unknown): Promise<TrackedOrder> {
  const { orderNumber, email, phone } = trackOrderSchema.parse(input)

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      OR: [
        ...(email ? [{ user: { email } }] : []),
        ...(phone ? [{ shippingPhone: phone }] : []),
      ],
    },
    select: {
      orderNumber: true,
      status: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
      trackingNumber: true,
      total: true,
      currency: true,
      items: {
        select: {
          productName: true,
          quantity: true,
          width: true,
          height: true,
          totalPrice: true,
        },
      },
    },
  })

  if (!order) {
    throw new AppError(
      404,
      'No order found with those details. Check the order number and the email or phone used at checkout.',
      'ORDER_NOT_FOUND'
    )
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.createdAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    trackingNumber: order.trackingNumber,
    total: Number(order.total),
    currency: order.currency,
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      width: item.width,
      height: item.height,
      totalPrice: Number(item.totalPrice),
    })),
  }
}
