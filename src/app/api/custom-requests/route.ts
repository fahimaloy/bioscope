import { handleRouteError, ok, created, parsePagination } from '@/lib/api-utils'
import { getCustomRequests, submitCustomRequest } from '@/lib/actions/customRequest'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sp = url.searchParams
    const { page, limit, sortOrder } = parsePagination(url)
    const result = await getCustomRequests({
      status: sp.get('status') || undefined,
      userId: sp.get('userId') || undefined,
      search: sp.get('search') || undefined,
      startDate: sp.get('startDate') || undefined,
      endDate: sp.get('endDate') || undefined,
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
    const result = await submitCustomRequest(body)
    return created(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
