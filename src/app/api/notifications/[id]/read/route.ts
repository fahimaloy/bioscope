import { prisma } from '@/lib/prisma'
import { AppError, handleRouteError, requireUser, ok } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const notification = await prisma.notification.findFirst({ where: { id: params.id, userId: user.id } })
    if (!notification) throw new AppError(404, 'Notification not found', 'NOT_FOUND')
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true, readAt: new Date() },
    })
    return ok({ notification: updated })
  } catch (error) {
    return handleRouteError(error)
  }
}
