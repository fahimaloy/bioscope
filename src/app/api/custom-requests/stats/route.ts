import { handleRouteError, ok } from '@/lib/api-utils'
import { getCustomRequestStats } from '@/lib/actions/customRequest'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getCustomRequestStats()
    return ok(stats)
  } catch (error) {
    return handleRouteError(error)
  }
}
