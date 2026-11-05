import { handleRouteError, ok } from '@/lib/api-utils'
import { updateSettings } from '@/lib/actions/settings'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await updateSettings(body?.settings ?? body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
