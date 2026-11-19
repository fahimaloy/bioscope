import { handleRouteError, ok, requireAdmin, parsePagination } from '@/lib/api-utils'
import { listWebhookDeliveries } from '@/lib/server/webhooks'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const { limit } = parsePagination(url, { limit: 50, sortOrder: 'desc' })
    return ok({ data: await listWebhookDeliveries(params.id, limit) })
  } catch (error) {
    return handleRouteError(error)
  }
}
