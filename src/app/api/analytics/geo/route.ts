import { prisma } from '@/lib/prisma'
import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { parseLimit, parseRange, EXCLUDE_PAID } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { range, since } = parseRange(request.url)
    const limit = parseLimit(request.url, 10)

    const grouped = await prisma.order.groupBy({
      by: ['shippingDistrict'],
      where: { createdAt: { gte: since }, ...EXCLUDE_PAID },
      _count: { _all: true },
      _sum: { total: true },
    })

    const items = grouped
      .map((g) => ({ district: g.shippingDistrict, orders: g._count._all, revenue: Number(g._sum?.total ?? 0) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)

    return ok({ range, items })
  } catch (error) {
    return handleRouteError(error)
  }
}
