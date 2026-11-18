import { z } from 'zod'
import { AppError, handleRouteError, ok, requireAdmin, parsePagination, buildPagination } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  spendTier: z.string().trim().max(40).nullable().optional(),
})

// Admin-only customer detail: profile + addresses + spend stats + paginated orders
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const { page, limit } = parsePagination(url, { limit: 5 })

    const user = await prisma.user.findFirst({
      where: { id: params.id, role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        spendTier: true,
        createdAt: true,
        addresses: { orderBy: { isDefault: 'desc' } },
        _count: { select: { orders: true } },
        orders: { select: { total: true, status: true } },
      },
    })
    if (!user) throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND')

    const [orders, orderTotal] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          items: { select: { id: true } },
        },
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ])

    const { orders: allOrders, addresses, _count, ...profile } = user
    const totalSpent = allOrders.reduce((s, o) => s + Number(o.total), 0)
    const stats = {
      orderCount: _count.orders,
      totalSpent,
      averageOrderValue: _count.orders > 0 ? totalSpent / _count.orders : 0,
    }

    return ok({
      user: profile,
      addresses,
      stats,
      orders,
      ordersPagination: buildPagination(page, limit, orderTotal),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

// Admin edits customer profile fields (name / phone / spend tier override)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = patchSchema.parse(await request.json())

    const existing = await prisma.user.findFirst({ where: { id: params.id, role: 'CUSTOMER' }, select: { id: true } })
    if (!existing) throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND')

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.spendTier !== undefined ? { spendTier: body.spendTier } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, spendTier: true },
    })

    return ok({ user })
  } catch (error) {
    return handleRouteError(error)
  }
}
