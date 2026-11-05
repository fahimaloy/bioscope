import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError, handleRouteError, requireUser, ok } from '@/lib/api-utils'
import { updateReviewSchema } from '@/lib/validations/review'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const validated = updateReviewSchema.parse(body)

    const review = await prisma.review.findUnique({ where: { id: params.id } })
    if (!review) throw new AppError(404, 'Review not found', 'NOT_FOUND')

    // Owners can edit their own review content; only admins can approve/hide.
    const isAdmin = user.role === 'ADMIN'
    const isOwner = review.userId === user.id
    if (!isAdmin && !isOwner) throw new AppError(403, 'Not allowed', 'FORBIDDEN')
    if (!isAdmin && validated.isApproved !== undefined) throw new AppError(403, 'Not allowed', 'FORBIDDEN')

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(isOwner
          ? {
              ...(validated.rating !== undefined && { rating: validated.rating }),
              ...(validated.title !== undefined && { title: validated.title }),
              ...(validated.comment !== undefined && { comment: validated.comment }),
              ...(validated.images !== undefined && { images: validated.images }),
            }
          : {}),
        ...(isAdmin && validated.isApproved !== undefined && { isApproved: validated.isApproved }),
      },
    })
    return ok({ review: updated })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const review = await prisma.review.findUnique({ where: { id: params.id } })
    if (!review) throw new AppError(404, 'Review not found', 'NOT_FOUND')
    if (user.role !== 'ADMIN' && review.userId !== user.id) {
      throw new AppError(403, 'Not allowed', 'FORBIDDEN')
    }
    await prisma.review.delete({ where: { id: params.id } })
    return ok({ message: 'Review deleted' })
  } catch (error) {
    return handleRouteError(error)
  }
}
