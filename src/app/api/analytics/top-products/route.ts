import { prisma } from '@/lib/prisma'
import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { parseLimit, parseRange, EXCLUDE_PAID } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { range, since } = parseRange(request.url)
    const limit = parseLimit(request.url, 10)

    const grouped = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: since }, ...EXCLUDE_PAID } },
      _sum: { totalPrice: true, quantity: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: limit,
    })

    const products = await prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
      select: { id: true, name: true },
    })
    const nameById = new Map(products.map((p) => [p.id, p.name]))

    return ok({
      range,
      items: grouped.map((g) => ({
        productId: g.productId,
        name: nameById.get(g.productId) ?? 'Unknown',
        sales: g._sum?.quantity ?? 0,
        revenue: Number(g._sum?.totalPrice ?? 0),
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
