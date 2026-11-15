import { prisma } from '@/lib/prisma'
import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { parseLimit, parseRange, EXCLUDE_PAID } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { range, since } = parseRange(request.url)
    const limit = parseLimit(request.url, 10)
    const where = { createdAt: { gte: since }, ...EXCLUDE_PAID }

    const grouped = await prisma.order.groupBy({
      by: ['userId'],
      where,
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    })

    const users = await prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, name: true, email: true },
    })
    const userById = new Map(users.map((u) => [u.id, u]))

    return ok({
      range,
      items: grouped.map((g, i) => {
        const user = userById.get(g.userId)
        return {
          id: g.userId ?? `cust-${i}`,
          name: user?.name ?? 'Customer',
          email: user?.email ?? '',
          totalSpent: Number(g._sum?.total ?? 0),
          orderCount: g._count._all,
        }
      }),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
