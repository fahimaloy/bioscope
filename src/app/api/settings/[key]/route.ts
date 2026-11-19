import { handleRouteError, ok } from '@/lib/api-utils'
import { getSetting, updateSetting, deleteSetting } from '@/lib/actions/settings'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { key: string } }) {
  try {
    const setting = await getSetting(decodeURIComponent(params.key))
    return ok({ setting })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(request: Request, { params }: { params: { key: string } }) {
  try {
    const body = await request.json()
    const result = await updateSetting({
      key: decodeURIComponent(params.key),
      value: String(body.value ?? ''),
      type: body.type ?? 'STRING',
      category: body.category ?? 'GENERAL',
      description: body.description,
      isPublic: body.isPublic,
    })
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { key: string } }) {
  try {
    const result = await deleteSetting(decodeURIComponent(params.key))
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
