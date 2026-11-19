import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { deleteWebhookEndpoint, updateWebhookEndpoint } from '@/lib/server/webhooks'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await request.json()
    const endpoint = await updateWebhookEndpoint(params.id, body)
    return ok({ data: endpoint })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await deleteWebhookEndpoint(params.id)
    return ok({ data: { id: params.id, deleted: true } })
  } catch (error) {
    return handleRouteError(error)
  }
}
