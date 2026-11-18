import { prisma } from '@/lib/prisma'
import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { parseRange, EXCLUDE_PAID } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { range, since } = parseRange(request.url)
    const where = { createdAt: { gte: since }, ...EXCLUDE_PAID }

    // Monthly buckets always span the last 12 calendar months (chart contract).
    const now = new Date()
    const bucketStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const months: { date: string; revenue: number; orders: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ date: d.toLocaleString('en', { month: 'short', year: '2-digit' }), revenue: 0, orders: 0 })
    }

    const [agg, paidCount, recent] = await Promise.all([
      prisma.order.aggregate({ where, _sum: { total: true } }),
      prisma.order.count({ where }),
      prisma.order.findMany({
        where: { createdAt: { gte: bucketStart }, ...EXCLUDE_PAID },
        select: { createdAt: true, total: true },
      }),
    ])

    const keyOf = (d: Date) => d.toLocaleString('en', { month: 'short', year: '2-digit' })
    for (const o of recent) {
      const key = keyOf(new Date(o.createdAt))
      const target = months.find((m) => m.date === key)
      if (target) {
        target.revenue += Number(o.total)
        target.orders += 1
      }
    }

    const totalRevenue = Number(agg._sum.total ?? 0)
    return ok({
      range,
      since,
      totalRevenue,
      paidOrders: paidCount,
      averageOrderValue: paidCount ? Math.round(totalRevenue / paidCount) : 0,
      monthly: months,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
