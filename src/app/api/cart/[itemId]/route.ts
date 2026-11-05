import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AppError, handleRouteError, requireUser, ok } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive').max(10000),
})

async function getOwnedItem(itemId: string, userId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: { select: { userId: true } }, product: true },
  })
  if (!item || item.cart.userId !== userId) throw new AppError(404, 'Cart item not found', 'NOT_FOUND')
  return item
}

export async function PATCH(request: Request, { params }: { params: { itemId: string } }) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const { quantity } = updateSchema.parse(body)

    const item = await getOwnedItem(params.itemId, user.id)
    if (item.product.trackInventory && item.product.stock < quantity) {
      throw new AppError(409, `Only ${item.product.stock} left in stock`, 'OUT_OF_STOCK')
    }

    const updated = await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
    return ok({ item: updated })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { itemId: string } }) {
  try {
    const user = await requireUser()
    const item = await getOwnedItem(params.itemId, user.id)
    await prisma.cartItem.delete({ where: { id: item.id } })
    return ok({ message: 'Item removed' })
  } catch (error) {
    return handleRouteError(error)
  }
}
