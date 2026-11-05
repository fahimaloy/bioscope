import { handleRouteError, ok } from '@/lib/api-utils'
import { updateCustomRequestStatus } from '@/lib/actions/customRequest'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const result = await updateCustomRequestStatus(params.id, body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
