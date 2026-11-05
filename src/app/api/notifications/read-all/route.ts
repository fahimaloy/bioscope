import { prisma } from '@/lib/prisma'
import { handleRouteError, requireUser, ok } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const user = await requireUser()
    const result = await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    return ok({ updated: result.count })
  } catch (error) {
    return handleRouteError(error)
  }
}
