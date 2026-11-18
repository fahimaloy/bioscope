import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { customerFiltersSchema, type CustomerFilters } from '@/lib/validations/customer'
import { resolveSpendTier } from '@/lib/spend-tiers'

/** Search term plus the optional tier / order-count / join-date filters. */
export type CustomerListQuery = CustomerFilters & { search?: string }

const optionalParam = (value: string | null): string | undefined =>
  value && value.trim() !== '' ? value.trim() : undefined

/** Parse the admin customer list/export query string. */
export function parseCustomerListQuery(url: URL): CustomerListQuery {
  const sp = url.searchParams
  return {
    search: optionalParam(sp.get('search')),
    ...customerFiltersSchema.parse({
      spendTier: optionalParam(sp.get('spendTier')),
      minOrders: optionalParam(sp.get('minOrders')),
      dateFrom: optionalParam(sp.get('dateFrom')),
    }),
  }
}

/**
 * Build the Prisma filter for the admin customer list and CSV export.
 *
 * Tier and order-count are derived from order rows, so they are resolved into
 * an explicit id list before the page query runs.
 */
export async function buildCustomerWhere(url: URL): Promise<Prisma.UserWhereInput> {
  const { search, spendTier, minOrders, dateFrom } = parseCustomerListQuery(url)

  const where: Prisma.UserWhereInput = { role: 'CUSTOMER' }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (dateFrom) where.createdAt = { gte: dateFrom }

  let idFilter: string[] | undefined

  if (spendTier) {
    // Lifetime spend is an aggregate over orders; resolve the displayed tier
    // for every customer, then keep the ones in the requested band.
    const holders = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, spendTier: true, orders: { select: { total: true } } },
    })
    idFilter = holders
      .filter(
        (u) =>
          resolveSpendTier(u.orders.reduce((sum, o) => sum + Number(o.total), 0), u.spendTier) ===
          spendTier
      )
      .map((u) => u.id)
  }

  if (minOrders && minOrders > 0) {
    const grouped = await prisma.order.groupBy({
      by: ['userId'],
      orderBy: { userId: 'asc' },
      having: { userId: { _count: { gte: minOrders } } },
    })
    const ids = grouped.map((g) => g.userId)
    idFilter = idFilter ? idFilter.filter((id) => ids.includes(id)) : ids
  }

  if (idFilter) where.id = { in: idFilter }

  return where
}
