import { handleRouteError, ok } from '@/lib/api-utils'
import { priceCustomRequest } from '@/lib/actions/customRequest'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const result = await priceCustomRequest(params.id, body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
