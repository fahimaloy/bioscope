import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { importProductsFromCsv } from '@/lib/actions/product'

export const dynamic = 'force-dynamic'

/** Import a product CSV. Rows are matched to existing products by slug. */
export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const csv = typeof body?.csv === 'string' ? body.csv : ''
    if (!csv.trim()) {
      return handleRouteError(new Error('EMPTY_CSV'))
    }
    const result = await importProductsFromCsv(csv)
    return ok({ data: result })
  } catch (error) {
    return handleRouteError(error)
  }
}
