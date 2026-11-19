import { handleRouteError, ok, created, requireAdmin } from '@/lib/api-utils'
import { createWebhookEndpoint, listWebhookEndpoints } from '@/lib/server/webhooks'

export const dynamic = 'force-dynamic'

// Admin-only webhook endpoints
export async function GET() {
  try {
    await requireAdmin()
    return ok({ data: await listWebhookEndpoints() })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()
    const endpoint = await createWebhookEndpoint(body, admin.id)
    return created({ data: endpoint })
  } catch (error) {
    return handleRouteError(error)
  }
}
