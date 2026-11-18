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
 * Lifetime spend per customer, aggregated by the database.
 *
 * One grouped row per customer instead of every order row in memory — the
 * tier filter and the CSV export both resolve spend from this map, so a
 * growing order history cannot blow up the admin list page.
 */
export async function lifetimeSpendByCustomer(): Promise<Map<string, number>> {
  const grouped = await prisma.order.groupBy({
    by: ['userId'],
    _sum: { total: true },
  })
  return new Map(grouped.map((g) => [g.userId, Number(g._sum.total ?? 0)]))
}

/**
 * Build the Prisma filter for the admin customer list and CSV export.
 *
 * Tier and order-count are derived from order rows, so they are resolved into
 * an explicit id list before the page query runs. Spend is aggregated in the
 * database (see lifetimeSpendByCustomer); only ids and tier overrides are
 * held in memory.
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
    // Resolve the displayed tier (override wins, else the spend band) for
    // every customer from the aggregated totals, then keep the requested band.
    // Customers with no orders spend 0 and land in `New` unless overridden.
    const [holders, spend] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: { id: true, spendTier: true },
      }),
      lifetimeSpendByCustomer(),
    ])
    idFilter = holders
      .filter((u) => resolveSpendTier(spend.get(u.id) ?? 0, u.spendTier) === spendTier)
      .map((u) => u.id)
  }

  if (minOrders && minOrders > 0) {
    const grouped = await prisma.order.groupBy({
      by: ['userId'],
      having: { userId: { _count: { gte: minOrders } } },
    })
    const ids = new Set(grouped.map((g) => g.userId))
    idFilter = idFilter ? idFilter.filter((id) => ids.has(id)) : [...ids]
  }

  if (idFilter) where.id = { in: idFilter }

  return where
}
