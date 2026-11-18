import { handleRouteError, ok, requireAdmin, AppError } from '@/lib/api-utils'
import { importProductsFromCsv } from '@/lib/actions/product'

export const dynamic = 'force-dynamic'

/** Import a product CSV. Rows are matched to existing products by slug. */
export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const csv = typeof body?.csv === 'string' ? body.csv : ''
    if (!csv.trim()) {
      throw new AppError(400, 'The CSV is empty', 'EMPTY_CSV')
    }
    // Bound the work: a huge upload must not be parsed into memory unbounded.
    if (csv.length > 1_000_000) {
      throw new AppError(413, 'The CSV is too large (max 1 MB)', 'CSV_TOO_LARGE')
    }
    const result = await importProductsFromCsv(csv)
    return ok({ data: result })
  } catch (error) {
    return handleRouteError(error)
  }
}
