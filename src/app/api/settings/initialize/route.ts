import { handleRouteError, ok } from '@/lib/api-utils'
import { initializeDefaultSettings } from '@/lib/actions/settings'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await initializeDefaultSettings()
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
