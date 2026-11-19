import { handleRouteError, ok, requireUser } from '@/lib/api-utils'
import { resubmitCustomRequest } from '@/lib/actions/customRequest'

export const dynamic = 'force-dynamic'

/** Re-submit a request the admin sent back for revision (customer owner only). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser()
    const body = await request.json()
    const result = await resubmitCustomRequest(params.id, body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
