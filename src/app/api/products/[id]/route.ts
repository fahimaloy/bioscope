import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { AppError, handleRouteError, ok, created } from '@/lib/api-utils'
import { updateProduct, deleteProduct } from '@/lib/actions/product'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const isAdmin = session?.user?.role === 'ADMIN'
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        allowedDimensions: { orderBy: { sortOrder: 'asc' } },
        allowedQuantities: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true, orderItems: true } },
      },
    })
    if (!product || (!product.isActive && !isAdmin)) {
      throw new AppError(404, 'Product not found', 'NOT_FOUND')
    }
    return ok({ product })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const result = await updateProduct(params.id, body)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await deleteProduct(params.id)
    return ok(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
