import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError, handleRouteError, requireUser, ok } from '@/lib/api-utils'
import { addressSchema } from '@/lib/validations/order'

export const dynamic = 'force-dynamic'

async function getOwnedAddress(id: string, userId: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } })
  if (!address) throw new AppError(404, 'Address not found', 'NOT_FOUND')
  return address
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const address = await getOwnedAddress(params.id, user.id)
    return ok({ address })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const validated = addressSchema.partial().parse(body)
    await getOwnedAddress(params.id, user.id)

    const address = await prisma.$transaction(async (tx) => {
      if (validated.isDefault) {
        await tx.address.updateMany({ where: { userId: user.id, isDefault: true, id: { not: params.id } }, data: { isDefault: false } })
      }
      return tx.address.update({ where: { id: params.id }, data: validated })
    })
    return ok({ address })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    await getOwnedAddress(params.id, user.id)

    const orderCount = await prisma.order.count({ where: { addressId: params.id } })
    if (orderCount > 0) {
      throw new AppError(409, 'Address is used by existing orders and cannot be deleted', 'IN_USE')
    }
    await prisma.address.delete({ where: { id: params.id } })
    return ok({ message: 'Address deleted' })
  } catch (error) {
    return handleRouteError(error)
  }
}
