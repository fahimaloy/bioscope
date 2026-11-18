import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { cloneProduct } from '@/lib/actions/product'

export const dynamic = 'force-dynamic'

/** Duplicate a product (dimensions, quantities and images included). */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const result = await cloneProduct(params.id)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
