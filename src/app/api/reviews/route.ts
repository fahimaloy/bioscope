import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError, handleRouteError, requireUser, ok, created, parsePagination, buildPagination } from '@/lib/api-utils'
import { createReviewSchema } from '@/lib/validations/review'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')
    const { page, limit } = parsePagination(url)

    const where: any = { isApproved: true }
    if (productId) where.productId = productId

    const [reviews, total, agg] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
      productId
        ? prisma.review.aggregate({ where: { productId, isApproved: true }, _avg: { rating: true }, _count: true })
        : Promise.resolve(null),
    ])

    return ok({
      data: reviews,
      pagination: buildPagination(page, limit, total),
      ...(agg ? { averageRating: agg._avg.rating, reviewCount: agg._count } : {}),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const validated = createReviewSchema.parse(body)

    const product = await prisma.product.findUnique({ where: { id: validated.productId }, select: { id: true, isActive: true } })
    if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND')

    // Verified purchase: a delivered order containing this product.
    const purchase = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'DELIVERED',
        items: { some: { productId: validated.productId } },
      },
      select: { id: true },
    })

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: validated.productId,
        rating: validated.rating,
        title: validated.title,
        comment: validated.comment,
        images: validated.images,
        isVerifiedPurchase: !!purchase,
        isApproved: true,
      },
    })

    return created({ review })
  } catch (error) {
    return handleRouteError(error)
  }
}
