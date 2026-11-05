import { handleRouteError, ok } from '@/lib/api-utils'
import { getSettings, updateSettings } from '@/lib/actions/settings'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const settings = await getSettings(url.searchParams.get('category') || undefined)
    return ok({ settings })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const result = await updateSettings(body?.settings ?? body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
