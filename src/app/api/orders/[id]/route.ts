import { handleRouteError, ok } from '@/lib/api-utils'
import { getOrderById, updateOrder } from '@/lib/actions/order'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const order = await getOrderById(params.id)
    return ok({ order })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const result = await updateOrder(params.id, body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
