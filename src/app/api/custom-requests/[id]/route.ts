import { handleRouteError, ok } from '@/lib/api-utils'
import { getCustomRequestById, deleteCustomRequest } from '@/lib/actions/customRequest'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const request_ = await getCustomRequestById(params.id)
    return ok({ customRequest: request_ })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await deleteCustomRequest(params.id)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
