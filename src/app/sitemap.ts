import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

/** Public content routes only — no admin/checkout/api/auth/private routes. */
const STATIC_PATHS = [
  '', '/shop', '/about', '/contact', '/faq', '/shipping', '/returns',
  '/privacy', '/terms', '/accessibility', '/blog', '/careers', '/press',
  '/affiliates', '/track-order',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  let productRoutes: MetadataRoute.Sitemap = []
  let categoryRoutes: MetadataRoute.Sitemap = []
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })
    productRoutes = products.map((p) => ({
      url: `${base}/shop/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    })
    categoryRoutes = categories.map((c) => ({
      url: `${base}/shop?categoryId=${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))
  } catch {
    // DB unavailable — still serve the static routes rather than 500.
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}
