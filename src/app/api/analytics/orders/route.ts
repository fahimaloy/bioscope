import { prisma } from '@/lib/prisma'
import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { parseRange, startOfToday, EXCLUDE_PAID } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

const PENDING_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING']

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { range, since } = parseRange(request.url)
    const where = { createdAt: { gte: since } }
    const todayStart = startOfToday()

    const [grouped, todayCount, todayPaid] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      // Every order created today, regardless of status.
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      // Today's revenue uses the same paid definition as the revenue route.
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, ...EXCLUDE_PAID },
        _sum: { total: true },
      }),
    ])

    const distribution: Record<string, number> = {}
    let total = 0
    let pending = 0
    for (const g of grouped) {
      distribution[g.status] = g._count._all
      total += g._count._all
      if (PENDING_STATUSES.includes(g.status)) pending += g._count._all
    }

    return ok({
      range,
      since,
      total,
      pending,
      distribution,
      today: { orders: todayCount, revenue: Number(todayPaid._sum.total ?? 0) },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
