import { AppError, handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const order = await prisma.order.findUnique({ where: { id: params.id }, select: { id: true } })
    if (!order) throw new AppError(404, 'Order not found', 'ORDER_NOT_FOUND')

    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return ok({ history })
  } catch (error) {
    return handleRouteError(error)
  }
}
