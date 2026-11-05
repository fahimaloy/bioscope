import { prisma } from '@/lib/prisma'
import { AppError, handleRouteError, ok } from '@/lib/api-utils'
import { getRelatedProducts } from '@/lib/actions/product'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url)
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit')) || 4))
    const product = await prisma.product.findUnique({ where: { id: params.id }, select: { categoryId: true } })
    if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND')
    const products = await getRelatedProducts(params.id, product.categoryId, limit)
    return ok({ data: products })
  } catch (error) {
    return handleRouteError(error)
  }
}
