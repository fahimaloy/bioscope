import { handleRouteError, ok } from '@/lib/api-utils'
import { cancelOrder } from '@/lib/actions/order'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    let reason: string | undefined
    try {
      const body = await request.json()
      reason = typeof body?.reason === 'string' ? body.reason.slice(0, 500) : undefined
    } catch {
      // empty body is fine
    }
    const result = await cancelOrder(params.id, reason)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
