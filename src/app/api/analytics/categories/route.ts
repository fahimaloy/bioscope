import { prisma } from '@/lib/prisma'
import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { parseRange, EXCLUDE_PAID } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { range, since } = parseRange(request.url)

    const byProduct = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: since }, ...EXCLUDE_PAID } },
      _sum: { totalPrice: true, quantity: true },
    })

    const products = await prisma.product.findMany({
      where: { id: { in: byProduct.map((g) => g.productId) } },
      select: { id: true, category: { select: { name: true } } },
    })
    const categoryByProduct = new Map(products.map((p) => [p.id, p.category?.name ?? 'Uncategorised']))

    const totals = new Map<string, { name: string; sales: number; revenue: number }>()
    for (const g of byProduct) {
      const name = categoryByProduct.get(g.productId) ?? 'Uncategorised'
      const cur = totals.get(name) ?? { name, sales: 0, revenue: 0 }
      cur.sales += g._sum?.quantity ?? 0
      cur.revenue += Number(g._sum?.totalPrice ?? 0)
      totals.set(name, cur)
    }

    const items = [...totals.values()].sort((a, b) => b.revenue - a.revenue)
    return ok({ range, items })
  } catch (error) {
    return handleRouteError(error)
  }
}
