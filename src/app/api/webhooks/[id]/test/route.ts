import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { sendTestWebhook } from '@/lib/server/webhooks'
import { webhookTestSchema } from '@/lib/validations/webhook'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await request.json().catch(() => ({}))
    const { event } = webhookTestSchema.parse(body ?? {})
    return ok({ data: await sendTestWebhook(params.id, event) })
  } catch (error) {
    return handleRouteError(error)
  }
}
