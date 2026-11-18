import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { deleteApiKey, revokeApiKey } from '@/lib/server/api-keys'

export const dynamic = 'force-dynamic'

/** Revoke a key: it stops working immediately but the record is kept for audit. */
export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await revokeApiKey(params.id)
    return ok({ data: { id: params.id, revoked: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await deleteApiKey(params.id)
    return ok({ data: { id: params.id, deleted: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}