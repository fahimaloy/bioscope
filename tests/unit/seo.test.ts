// E6 — SEO must-haves: site-url helper, product metadata + JSON-LD builders,
// dynamic sitemap (public routes + DB products/categories, no private routes),
// robots (disallow private), web manifest.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ productFindMany: vi.fn(), categoryFindMany: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { product: { findMany: mocks.productFindMany }, category: { findMany: mocks.categoryFindMany } } }))

import { getSiteUrl } from '@/lib/site-url'
import { buildProductMetadata, buildProductJsonLd, type SeoProduct } from '@/lib/seo'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import manifest from '@/app/manifest'

const product: SeoProduct = {
  id: 'p1', name: 'Holographic Sparkle Stickers', slug: 'holographic-sparkle-stickers',
  description: 'Shiny vinyl stickers for laptops and journals.', images: ['https://cdn/img.png'],
  basePrice: 200, stock: 10, trackInventory: true, metaTitle: null, metaDescription: null,
}

const OLD_ENV = { ...process.env }
beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_APP_URL = 'https://bioscope.example'
  mocks.productFindMany.mockResolvedValue([{ slug: 'holographic-sparkle-stickers', updatedAt: new Date('2026-11-20') }])
  mocks.categoryFindMany.mockResolvedValue([{ id: 'c1', updatedAt: new Date('2026-11-20') }])
})
afterEach(() => { process.env = { ...OLD_ENV } })

describe('getSiteUrl', () => {
  it('strips nested quotes and trailing slashes', () => {
    process.env.NEXT_PUBLIC_APP_URL = '"https://bioscope.example/"'
    expect(getSiteUrl()).toBe('https://bioscope.example')
  })
  it('falls back to localhost when unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.NEXTAUTH_URL
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })
})

describe('buildProductMetadata', () => {
  it('uses name + description fallback, canonical, and OG image', () => {
    const md = buildProductMetadata(product)
    expect(md.title).toBe('Holographic Sparkle Stickers')
    expect(md.alternates?.canonical).toBe('https://bioscope.example/shop/holographic-sparkle-stickers')
    expect((md.openGraph?.images as { url: string }[])[0].url).toBe('https://cdn/img.png')
  })
  it('prefers metaTitle/metaDescription when set', () => {
    const md = buildProductMetadata({ ...product, metaTitle: 'Custom SEO Title', metaDescription: 'Custom SEO description' })
    expect(md.title).toBe('Custom SEO Title')
    expect(md.description).toBe('Custom SEO description')
  })
})

describe('buildProductJsonLd', () => {
  it('emits Product + Offer with real price and InStock', () => {
    const ld = buildProductJsonLd(product, { averageRating: 4.5, totalReviews: 8 })
    expect(ld['@type']).toBe('Product')
    const offers = ld.offers as Record<string, unknown>
    expect(offers.price).toBe(200)
    expect(offers.priceCurrency).toBe('BDT')
    expect(offers.availability).toBe('https://schema.org/InStock')
    expect((ld.aggregateRating as Record<string, unknown>).reviewCount).toBe(8)
  })
  it('OutOfStock when tracked inventory is zero', () => {
    const ld = buildProductJsonLd({ ...product, stock: 0 }, { averageRating: 0, totalReviews: 0 })
    expect((ld.offers as Record<string, unknown>).availability).toBe('https://schema.org/OutOfStock')
    expect(ld.aggregateRating).toBeUndefined()
  })
  it('InStock when inventory is not tracked', () => {
    const ld = buildProductJsonLd({ ...product, trackInventory: false, stock: 0 }, { averageRating: 0, totalReviews: 0 })
    expect((ld.offers as Record<string, unknown>).availability).toBe('https://schema.org/InStock')
  })
})

describe('sitemap', () => {
  it('includes static public routes + DB products/categories, no private routes', async () => {
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    expect(urls).toContain('https://bioscope.example')
    expect(urls).toContain('https://bioscope.example/shop')
    expect(urls).toContain('https://bioscope.example/shop/holographic-sparkle-stickers')
    expect(urls.some((u) => u.includes('categoryId=c1'))).toBe(true)
    expect(urls.some((u) => /\/(admin|checkout|api|orders|profile|login)/.test(u))).toBe(false)
  })
  it('still serves static routes when the DB fails', async () => {
    mocks.productFindMany.mockRejectedValue(new Error('db down'))
    const entries = await sitemap()
    expect(entries.map((e) => e.url)).toContain('https://bioscope.example/shop')
  })
})

describe('robots', () => {
  it('disallows private routes and points at the sitemap', () => {
    const r = robots()
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules
    expect(rule.disallow).toEqual(expect.arrayContaining(['/admin', '/checkout', '/api', '/orders', '/profile']))
    expect(r.sitemap).toBe('https://bioscope.example/sitemap.xml')
  })
})

describe('manifest', () => {
  it('has brand name, colors, and icons', () => {
    const m = manifest()
    expect(m.short_name).toBe('BIOSCOPE')
    expect(m.theme_color).toBe('#241B12')
    expect(m.icons?.length).toBeGreaterThanOrEqual(1)
  })
})
