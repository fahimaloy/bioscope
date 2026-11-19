import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getProductBySlug, getRelatedProducts } from '@/lib/actions/product'
import { buildProductMetadata, buildProductJsonLd, type SeoProduct } from '@/lib/seo'
import { ProductDetail } from '@/components/product/ProductDetail'
import { ProductGrid } from '@/components/product/ProductCard'
import { ReviewList } from '@/components/product/ReviewList'
import { ReviewForm } from '@/components/product/ReviewForm'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true
    allowedDimensions: true
    allowedQuantities: true
    reviews: {
      include: { user: { select: { name: true; avatar: true } } }
      orderBy: { createdAt: 'desc' }
      take: 10
    }
    _count: { select: { reviews: true } }
  }
}>

function serializeProduct(p: ProductWithRelations) {
  const customizationOptions = p.customizationOptions
    ? (typeof p.customizationOptions === 'string'
        ? JSON.parse(p.customizationOptions)
        : p.customizationOptions)
    : null;

  return {
    ...p,
    basePrice: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    taxPercent: Number(p.taxPercent ?? 0),
    additionalCharge: Number(p.additionalCharge ?? 0),
    customizationOptions,
    // `priceMultiplier` is a Prisma Decimal on each dimension. Left uncoerced it
    // reaches ProductDetail as a string (or a Decimal object), so `!== 1` was
    // always true — the default size rendered a spurious "0%" — and
    // `(m - 1) * 100` printed `+19.999999999999996%` for a 1.2x size.
    allowedDimensions: p.allowedDimensions?.map((d) => ({
      ...d,
      priceMultiplier: Number(d.priceMultiplier),
    })),
    allowedQuantities: p.allowedQuantities?.map((q) => ({
      ...q,
      pricePerUnit: Number(q.pricePerUnit),
    })),
    category: p.category ?? { id: '', name: '', slug: '', description: null, isActive: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(), image: null, icon: null },
    reviews: p.reviews ?? [],
    _count: { reviews: p._count?.reviews ?? 0, orderItems: 0 },
  }
}

/** E6 — per-product SEO metadata (uses the product's metaTitle/metaDescription
 *  when set, else name/description), canonical URL, and OG/Twitter cards. */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
  if (!product || !product.isActive) return {}
  return buildProductMetadata(toSeoProduct(product))
}

function toSeoProduct(p: { id: string; name: string; slug: string; description: string | null; images: string[]; basePrice: unknown; stock: number; trackInventory: boolean; metaTitle: string | null; metaDescription: string | null }): SeoProduct {
  return {
    id: p.id, name: p.name, slug: p.slug, description: p.description, images: p.images,
    basePrice: Number(p.basePrice), stock: p.stock, trackInventory: p.trackInventory,
    metaTitle: p.metaTitle, metaDescription: p.metaDescription,
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug)
  if (!product || !product.isActive) notFound()

  const related = await getRelatedProducts(product.id, product.categoryId, 8)

  const reviews = (product.reviews ?? []).map((r) => ({
    id: r.id,
    userId: r.userId,
    user: r.user ? { id: r.userId, email: '', name: r.user.name ?? '', role: 'CUSTOMER' as const, phone: null, avatar: r.user.avatar ?? null, emailVerified: null, createdAt: new Date(), updatedAt: new Date() } : undefined,
    productId: product.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    images: r.images ?? [],
    isVerifiedPurchase: r.isVerifiedPurchase ?? false,
    isApproved: r.isApproved ?? true,
    helpfulCount: (r as { helpfulCount?: number }).helpfulCount ?? 0,
    createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt),
  }))
  const totalReviews = product._count?.reviews ?? reviews.length
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((s: number, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of reviews) ratingDistribution[r.rating] = (ratingDistribution[r.rating] ?? 0) + 1

  // E6 — JSON-LD Product structured data from real product/price/stock/review data.
  const jsonLd = buildProductJsonLd(toSeoProduct(product), { averageRating, totalReviews })

  return (
  <div className="min-h-screen pt-24 pb-12 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

        <ProductDetail product={serializeProduct(product)} />

        <section className="mt-16">
          <h2 className="font-display text-2xl text-[var(--brand)] mb-6">Reviews ({totalReviews})</h2>
          <ReviewList
            reviews={reviews}
            productId={product.id}
            averageRating={averageRating}
            totalReviews={totalReviews}
            ratingDistribution={ratingDistribution}
            canReview={false}
          />
          {/* E3 — review submission (client component; guests get a sign-in CTA). */}
          <div className="mt-8">
            <ReviewForm productId={product.id} />
          </div>
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
            <ProductGrid products={related.map((p) => serializeProduct(p as unknown as ProductWithRelations))} variant="featured" />
          </section>
        )}
      </div>
    </div>
  )
}
