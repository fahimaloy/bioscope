import { handleRouteError, requireAdmin } from '@/lib/api-utils'
import { buildCustomerWhere } from '@/lib/customers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// Admin-only customer CSV export (honours the same filters as the list)
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const where = await buildCustomerWhere(url)

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        spendTier: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: { select: { total: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    const header = ['id', 'name', 'email', 'phone', 'spendTier', 'orderCount', 'totalSpent', 'createdAt']
    const lines = [header.join(',')]
    for (const u of users) {
      const totalSpent = u.orders.reduce((s, o) => s + Number(o.total), 0)
      lines.push(
        [u.id, u.name, u.email, u.phone, u.spendTier, u._count.orders, totalSpent.toFixed(2), u.createdAt.toISOString()]
          .map(csvEscape)
          .join(',')
      )
    }

    return new Response('﻿' + lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="customers.csv"',
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
