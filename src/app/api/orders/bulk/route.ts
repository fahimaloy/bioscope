import { handleRouteError, ok } from '@/lib/api-utils'
import { bulkUpdateOrders } from '@/lib/actions/order'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await bulkUpdateOrders(body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
