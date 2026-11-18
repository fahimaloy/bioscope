import { prisma } from '@/lib/prisma'
import { handleRouteError, requireUser, ok } from '@/lib/api-utils'
import { updateProfileSchema } from '@/lib/validations/profile'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sessionUser = await requireUser()
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true, email: true, name: true, role: true, phone: true, avatar: true,
        emailVerified: true, createdAt: true,
        addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
        _count: { select: { orders: true, customRequests: true, reviews: true } },
      },
    })
    if (!user) return handleRouteError(new (await import('@/lib/api-utils')).AppError(404, 'User not found', 'NOT_FOUND'))
    return ok({ user })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireUser()
    const body = await request.json()
    const validated = updateProfileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
        ...(validated.avatar !== undefined && { avatar: validated.avatar }),
      },
      select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, updatedAt: true },
    })
    return ok({ user })
  } catch (error) {
    return handleRouteError(error)
  }
}
