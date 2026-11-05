import { handleRouteError, ok } from '@/lib/api-utils'
import { getOrderStats } from '@/lib/actions/order'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getOrderStats()
    return ok(stats)
  } catch (error) {
    return handleRouteError(error)
  }
}
