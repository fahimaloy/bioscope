import { handleRouteError, ok } from '@/lib/api-utils'
import { getPublicSettings } from '@/lib/actions/settings'

export const dynamic = 'force-dynamic'

// No auth required: only isPublic settings are returned.
export async function GET() {
  try {
    const settings = await getPublicSettings()
    return ok(settings)
  } catch (error) {
    return handleRouteError(error)
  }
}
