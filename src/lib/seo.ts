import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site-url'

/** Minimal product shape needed for SEO (real DB fields, Decimals coerced). */
export interface SeoProduct {
  id: string
  name: string
  slug: string
  description: string | null
  images: string[]
  basePrice: number
  stock: number
  trackInventory: boolean
  metaTitle: string | null
  metaDescription: string | null
}

/** E6 — per-product metadata: metaTitle/metaDescription when set, else
 *  name/description; canonical URL + OG/Twitter cards from real data. */
export function buildProductMetadata(product: SeoProduct): Metadata {
  const title = product.metaTitle || product.name
  const description =
    product.metaDescription ||
    (product.description ? product.description.slice(0, 160) : `Buy ${product.name} at BIOSCOPE.`)
  const url = `${getSiteUrl()}/shop/${product.slug}`
  const image = product.images?.[0]
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url, ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
  }
}

/** E6 — JSON-LD Product structured data from real price/stock/review data. */
export function buildProductJsonLd(
  product: SeoProduct,
  opts: { averageRating: number; totalReviews: number }
): Record<string, unknown> {
  const inStock = !product.trackInventory || product.stock > 0
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images ?? [],
    description: product.description ?? undefined,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'BIOSCOPE' },
    offers: {
      '@type': 'Offer',
      url: `${getSiteUrl()}/shop/${product.slug}`,
      priceCurrency: 'BDT',
      price: product.basePrice,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  }
  if (opts.totalReviews > 0 && opts.averageRating > 0) {
    jsonLd.aggregateRating = { '@type': 'AggregateRating', ratingValue: opts.averageRating, reviewCount: opts.totalReviews }
  }
  return jsonLd
}
