import { z } from 'zod'
import { AppError, handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const adjustSchema = z.object({
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  reason: z.string().trim().min(1).max(100).default('MANUAL_ADJUSTMENT'),
  note: z.string().trim().max(500).optional(),
})

// Stock adjustment history for a product (admin)
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const adjustments = await prisma.stockAdjustment.findMany({
      where: { productId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return ok({ adjustments })
  } catch (error) {
    return handleRouteError(error)
  }
}

// Set absolute stock level with an audited adjustment row (admin)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin()
    const body = adjustSchema.parse(await request.json())

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, stock: true, name: true },
    })
    if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND')

    const previousStock = product.stock
    if (previousStock === body.stock) {
      return ok({ product, adjustment: null, unchanged: true })
    }

    const [updated, adjustment] = await prisma.$transaction([
      prisma.product.update({ where: { id: params.id }, data: { stock: body.stock } }),
      prisma.stockAdjustment.create({
        data: {
          productId: params.id,
          change: body.stock - previousStock,
          previousStock,
          newStock: body.stock,
          reason: body.reason,
          note: body.note ?? null,
          createdBy: admin.id as string,
        },
      }),
    ])

    return ok({ product: updated, adjustment })
  } catch (error) {
    return handleRouteError(error)
  }
}
