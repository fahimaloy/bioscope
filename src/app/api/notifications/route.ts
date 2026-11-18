import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { handleRouteError, requireUser, ok, parsePagination, buildPagination } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const url = new URL(request.url)
    const { page, limit } = parsePagination(url, { limit: 20 })
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'

    const where: Prisma.NotificationWhereInput = { userId: user.id }
    if (unreadOnly) where.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ])
    return ok({ data: notifications, pagination: buildPagination(page, limit, total), unreadCount })
  } catch (error) {
    return handleRouteError(error)
  }
}
