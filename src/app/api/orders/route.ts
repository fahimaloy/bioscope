import { handleRouteError, ok, created, parsePagination } from '@/lib/api-utils'
import { getOrders, createOrder } from '@/lib/actions/order'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sp = url.searchParams
    const { page, limit, sortOrder } = parsePagination(url)
    const result = await getOrders({
      status: sp.get('status') || undefined,
      userId: sp.get('userId') || undefined,
      search: sp.get('search') || undefined,
      startDate: sp.get('startDate') || undefined,
      endDate: sp.get('endDate') || undefined,
      minAmount: sp.get('minAmount') ? Number(sp.get('minAmount')) : undefined,
      maxAmount: sp.get('maxAmount') ? Number(sp.get('maxAmount')) : undefined,
      sortBy: sp.get('sortBy') || 'createdAt',
      sortOrder,
      page,
      limit,
    })
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await createOrder(body)
    return created(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
