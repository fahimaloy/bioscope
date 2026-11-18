import { prisma } from '@/lib/prisma'
import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { parseRange } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

const PENDING_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING']

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { range, since } = parseRange(request.url)
    const where = { createdAt: { gte: since } }

    const grouped = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    })

    const distribution: Record<string, number> = {}
    let total = 0
    let pending = 0
    for (const g of grouped) {
      distribution[g.status] = g._count._all
      total += g._count._all
      if (PENDING_STATUSES.includes(g.status)) pending += g._count._all
    }

    return ok({ range, since, total, pending, distribution })
  } catch (error) {
    return handleRouteError(error)
  }
}
