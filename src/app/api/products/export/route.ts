import { handleRouteError, requireAdmin } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { productsToCsv } from '@/lib/product-csv'

export const dynamic = 'force-dynamic'

/** Download the product catalog as CSV (dimensions/quantities as JSON). */
export async function GET() {
  try {
    await requireAdmin()
    const products = await prisma.product.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        category: { select: { slug: true } },
        allowedDimensions: { orderBy: { sortOrder: 'asc' } },
        allowedQuantities: { orderBy: { sortOrder: 'asc' } },
      },
    })

    const csv = productsToCsv(
      products.map((product) => ({
        name: product.name,
        slug: product.slug,
        description: product.description ?? '',
        basePrice: product.basePrice.toString(),
        compareAtPrice: product.compareAtPrice?.toString() ?? '',
        categorySlug: product.category.slug,
        images: product.images.join(';'),
        dimensions: JSON.stringify(
          product.allowedDimensions.map((d) => ({
            width: d.width,
            height: d.height,
            label: d.label,
            priceMultiplier: Number(d.priceMultiplier),
            isDefault: d.isDefault,
            sortOrder: d.sortOrder,
          }))
        ),
        quantities: JSON.stringify(
          product.allowedQuantities.map((q) => ({
            minQty: q.minQty,
            maxQty: q.maxQty ?? undefined,
            pricePerUnit: Number(q.pricePerUnit),
            label: q.label,
            sortOrder: q.sortOrder,
          }))
        ),
        taxPercent: product.taxPercent.toString(),
        additionalCharge: product.additionalCharge.toString(),
        isTaxInclusive: String(product.isTaxInclusive),
        trackInventory: String(product.trackInventory),
        stock: String(product.stock),
        lowStockThreshold: String(product.lowStockThreshold),
        isActive: String(product.isActive),
        isFeatured: String(product.isFeatured),
        sortOrder: String(product.sortOrder),
        metaTitle: product.metaTitle ?? '',
        metaDescription: product.metaDescription ?? '',
      }))
    )

    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="products.csv"',
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
