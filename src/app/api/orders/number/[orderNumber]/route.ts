import { handleRouteError, ok } from '@/lib/api-utils'
import { getOrderByNumber } from '@/lib/actions/order'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    const order = await getOrderByNumber(decodeURIComponent(params.orderNumber))
    return ok({ order })
  } catch (error) {
    return handleRouteError(error)
  }
}
