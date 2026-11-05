import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleRouteError, requireUser, ok, created, buildPagination, parsePagination } from '@/lib/api-utils'
import { addressSchema } from '@/lib/validations/order'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const url = new URL(request.url)
    const { page, limit } = parsePagination(url, { limit: 50, sortOrder: 'desc' })

    const where = { userId: user.id }
    const [addresses, total] = await Promise.all([
      prisma.address.findMany({ where, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }], skip: (page - 1) * limit, take: limit }),
      prisma.address.count({ where }),
    ])
    return ok({ data: addresses, pagination: buildPagination(page, limit, total) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const validated = addressSchema.parse(body)

    const address = await prisma.$transaction(async (tx) => {
      if (validated.isDefault) {
        await tx.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } })
      }
      return tx.address.create({
        data: { ...validated, userId: user.id },
      })
    })

    return created({ address })
  } catch (error) {
    return handleRouteError(error)
  }
}
