import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError, handleRouteError, requireAdmin, ok } from '@/lib/api-utils'
import { updateCategorySchema } from '@/lib/validations/category'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: { _count: { select: { products: true } } },
    })
    if (!category) throw new AppError(404, 'Category not found', 'NOT_FOUND')
    return ok({ category })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await request.json()
    const validated = updateCategorySchema.parse(body)
    const category = await prisma.category.update({ where: { id: params.id }, data: validated })
    return ok({ category })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: { _count: { select: { products: true } } },
    })
    if (!category) throw new AppError(404, 'Category not found', 'NOT_FOUND')
    if (category._count.products > 0) {
      throw new AppError(409, 'Category has products — reassign or deactivate them first', 'HAS_PRODUCTS')
    }
    await prisma.category.delete({ where: { id: params.id } })
    return ok({ message: 'Category deleted' })
  } catch (error) {
    return handleRouteError(error)
  }
}
