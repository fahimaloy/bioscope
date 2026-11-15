import { handleRouteError, ok, requireAdmin, parsePagination, buildPagination } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Admin-only customer list with order stats
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const sp = url.searchParams
    const { page, limit } = parsePagination(url, { limit: 20, sortOrder: 'desc' })
    const search = sp.get('search') || undefined
    const sortBy = ['createdAt', 'name', 'email'].includes(sp.get('sortBy') || '') ? (sp.get('sortBy') as string) : 'createdAt'
    const sortOrder = sp.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const where: any = { role: 'CUSTOMER' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          spendTier: true,
          createdAt: true,
          _count: { select: { orders: true } },
          orders: { select: { total: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar,
      spendTier: u.spendTier,
      createdAt: u.createdAt,
      orderCount: u._count.orders,
      totalSpent: u.orders.reduce((s, o) => s + Number(o.total), 0),
    }))

    return ok({ data, pagination: buildPagination(page, limit, total) })
  } catch (error) {
    return handleRouteError(error)
  }
}
