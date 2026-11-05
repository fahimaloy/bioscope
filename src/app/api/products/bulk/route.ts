import { z } from 'zod'
import { handleRouteError, ok } from '@/lib/api-utils'
import { bulkUpdateProducts } from '@/lib/actions/product'

export const dynamic = 'force-dynamic'

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  updates: z.record(z.any()),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ids, updates } = bulkSchema.parse(body)
    const result = await bulkUpdateProducts(ids, updates)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
