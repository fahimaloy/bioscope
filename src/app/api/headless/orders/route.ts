import { handleRouteError, ok, parsePagination } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { requireApiKey } from '@/lib/server/api-keys'

export const dynamic = 'force-dynamic'

/**
 * Headless orders feed — the reference consumer that justifies API keys.
 * Call with `Authorization: Bearer <key>` and a key holding `orders:read`.
 */
export async function GET(request: Request) {
  try {
    await requireApiKey(['orders:read'], request)

    const url = new URL(request.url)
    const { page, limit } = parsePagination(url, { limit: 20, sortOrder: 'desc' })
    const status = url.searchParams.get('status') ?? undefined

    const where = status ? { status: status as never } : {}
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          currency: true,
          paymentMethod: true,
          paymentStatus: true,
          createdAt: true,
          shippingName: true,
          shippingCity: true,
          user: { select: { email: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return ok({
      data: orders.map((order) => ({
        ...order,
        total: Number(order.total),
      })),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}