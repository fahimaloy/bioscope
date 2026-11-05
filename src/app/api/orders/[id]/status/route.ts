import { handleRouteError, ok } from '@/lib/api-utils'
import { updateOrderStatus } from '@/lib/actions/order'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const result = await updateOrderStatus(params.id, body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
