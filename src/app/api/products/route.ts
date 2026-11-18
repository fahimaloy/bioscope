import { auth } from '@/lib/auth'
import { handleRouteError, ok, created, parsePagination } from '@/lib/api-utils'
import { getProducts, createProduct, type ProductFilters } from '@/lib/actions/product'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sp = url.searchParams
    const session = await auth()
    const isAdmin = session?.user?.role === 'ADMIN'
    const { page, limit, sortOrder } = parsePagination(url, { limit: 12, sortOrder: 'asc' })

    const filters: ProductFilters = {
      categoryId: sp.get('categoryId') || sp.get('category') || undefined,
      isActive: sp.get('isActive') !== null ? sp.get('isActive') === 'true' : isAdmin ? undefined : true,
      isFeatured: sp.get('isFeatured') !== null ? sp.get('isFeatured') === 'true' : undefined,
      search: sp.get('search') || undefined,
      minPrice: sp.get('minPrice') ? Number(sp.get('minPrice')) : undefined,
      maxPrice: sp.get('maxPrice') ? Number(sp.get('maxPrice')) : undefined,
      sortBy: (sp.get('sortBy') || 'sortOrder') as ProductFilters['sortBy'],
      sortOrder,
      page,
      limit,
    }
    const result = await getProducts(filters)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await createProduct(body)
    return created(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
