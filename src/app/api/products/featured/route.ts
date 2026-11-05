import { handleRouteError, ok } from '@/lib/api-utils'
import { getFeaturedProducts } from '@/lib/actions/product'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 8))
    const products = await getFeaturedProducts(limit)
    return ok({ data: products })
  } catch (error) {
    return handleRouteError(error)
  }
}
