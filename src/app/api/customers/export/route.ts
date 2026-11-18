import { handleRouteError, requireAdmin } from '@/lib/api-utils'
import { buildCustomerWhere, lifetimeSpendByCustomer } from '@/lib/customers'
import { escapeCsvCell } from '@/lib/csv'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Admin-only customer CSV export (honours the same filters as the list).
// Cells use the shared escapeCsvCell: customer-supplied name/phone can start
// with = + - @ and must not execute as a spreadsheet formula.
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const where = await buildCustomerWhere(url)

    // Spend is aggregated in the database — one grouped row per customer,
    // not every order row loaded into memory.
    const [users, spend] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          spendTier: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      }),
      lifetimeSpendByCustomer(),
    ])

    const header = ['id', 'name', 'email', 'phone', 'spendTier', 'orderCount', 'totalSpent', 'createdAt']
    const lines = [header.join(',')]
    for (const u of users) {
      const totalSpent = spend.get(u.id) ?? 0
      lines.push(
        [u.id, u.name, u.email, u.phone, u.spendTier, u._count.orders, totalSpent.toFixed(2), u.createdAt.toISOString()]
          .map(escapeCsvCell)
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
