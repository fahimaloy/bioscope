import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductBySlug, getRelatedProducts } from '@/lib/actions/product'
import { ProductDetail } from '@/components/product/ProductDetail'
import { ProductGrid } from '@/components/product/ProductCard'
import { ReviewList } from '@/components/product/ReviewList'

export const dynamic = 'force-dynamic'

function serializeProduct(p: any) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    taxPercent: Number(p.taxPercent ?? 0),
    additionalCharge: Number(p.additionalCharge ?? 0),
    // `priceMultiplier` is a Prisma Decimal on each dimension. Left uncoerced it
    // reaches ProductDetail as a string (or a Decimal object), so `!== 1` was
    // always true — the default size rendered a spurious "0%" — and
    // `(m - 1) * 100` printed `+19.999999999999996%` for a 1.2x size.
    allowedDimensions: p.allowedDimensions?.map((d: any) => ({
      ...d,
      priceMultiplier: Number(d.priceMultiplier),
    })),
    reviews: undefined,
    _count: undefined,
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug)
  if (!product || !product.isActive) notFound()

  const related = await getRelatedProducts(product.id, product.categoryId, 8)

  const reviews = (product.reviews ?? []).map((r: any) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }))
  const totalReviews = (product as any)._count?.reviews ?? reviews.length
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of reviews) ratingDistribution[r.rating] = (ratingDistribution[r.rating] ?? 0) + 1

  return (
    <div className="min-h-screen bg-[var(--paper)] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-[var(--text-subtle)] mb-6">
          <Link href="/" className="text-[var(--brand)] hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="text-[var(--brand)] hover:underline">
            Shop
          </Link>
          <span>/</span>
          <span className="text-[var(--text)]">{product.name}</span>
        </nav>

        <ProductDetail product={serializeProduct(product) as any} />

        <section className="mt-16">
          <h2 className="font-display text-2xl text-[var(--brand)] mb-6">Reviews ({totalReviews})</h2>
          <ReviewList
            reviews={reviews as any}
            productId={product.id}
            averageRating={averageRating}
            totalReviews={totalReviews}
            ratingDistribution={ratingDistribution}
            canReview={false}
          />
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-[var(--brand)]">Related Products</h2>
              <Link
                href={`/shop?category=${product.category?.slug}`}
                className="text-sm font-medium text-[var(--brand)] hover:underline flex items-center gap-1"
              >
                View All
                <span>→</span>
              </Link>
            </div>
            {/* Task 2.2's grid owns the column map; `featured` is 1/2/3 columns
                (the plan's "4-column grid" would need a ProductGrid change). */}
            <ProductGrid products={related.map((p) => serializeProduct(p) as any)} variant="featured" />
          </section>
        )}
      </div>
    </div>
  )
}
