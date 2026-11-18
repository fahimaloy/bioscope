import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { createOrderFromCustomRequest } from '@/lib/actions/customRequest'

export const dynamic = 'force-dynamic'

/** Turn a priced custom request into an order (admin). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await request.json()
    const result = await createOrderFromCustomRequest(params.id, body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
