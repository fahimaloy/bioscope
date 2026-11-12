import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductBySlug, getRelatedProducts } from '@/lib/actions/product'
import { ProductDetail } from '@/components/product/ProductDetail'
import { ProductCard } from '@/components/product/ProductCard'
import { ReviewList } from '@/components/product/ReviewList'
import { Card } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

function serializeProduct(p: any) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    taxPercent: Number(p.taxPercent ?? 0),
    additionalCharge: Number(p.additionalCharge ?? 0),
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
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-[var(--text-subtle)] mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary">Shop</Link>
          <span>/</span>
          <span className="text-[var(--ink)]">{product.name}</span>
        </nav>

        <ProductDetail product={serializeProduct(product) as any} />

        <section className="mt-16">
          <h2 className="font-display text-2xl text-primary mb-6">Reviews ({totalReviews})</h2>
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
              <h2 className="font-display text-2xl text-primary">Related Products</h2>
              <Link
                href={`/shop?category=${product.category?.slug}`}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View All
                <span>→</span>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x" role="list">
              {related.map((p) => (
                <div key={p.id} className="flex-shrink-0 snap-center w-64" role="listitem">
                  <ProductCard product={serializeProduct(p) as any} variant="compact" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}