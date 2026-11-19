'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ProductGrid } from '@/components/product'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { SkeletonProductCard } from '@/components/ui/Skeleton'
import { DoodleScatter, DoodleSparkle } from '@/components/decorative'
import { FOCUS_VISIBLE_INK } from '@/components/ui/shared'
import { Truck, Shield, Sparkles, Package, LayoutGrid } from 'lucide-react'
import { getCategoryIcon } from '@/lib/category-icons'
import { Select } from '@/components/ui'
import { ProductSearchBox } from '@/components/product/ProductSearchBox'
import { motion, AnimatePresence } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

const sortOptions = [
  { value: 'featured', label: 'Featured', sortBy: 'sortOrder', sortOrder: 'asc' },
  { value: 'newest', label: 'Newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'price-asc', label: 'Price: Low to High', sortBy: 'basePrice', sortOrder: 'asc' },
  { value: 'price-desc', label: 'Price: High to Low', sortBy: 'basePrice', sortOrder: 'desc' },
  { value: 'name-asc', label: 'Name: A-Z', sortBy: 'name', sortOrder: 'asc' },
  { value: 'name-desc', label: 'Name: Z-A', sortBy: 'name', sortOrder: 'desc' },
] as const

type Category = { id: string; name: string; slug: string; image?: string | null; icon?: string | null }

interface PrismaProduct {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: { toNumber(): number } | number
  compareAtPrice: { toNumber(): number } | number | null
  images: string[]
  categoryId: string
  category: { name: string } | null
  allowedDimensions: Array<{
    id: string
    width: number
    height: number
    label: string
    priceMultiplier: { toNumber(): number } | number
    isDefault: boolean
    sortOrder: number
  }>
  allowedQuantities: Array<{
    id: string
    minQty: number
    maxQty: number | null
    pricePerUnit: { toNumber(): number } | number
    label: string
    sortOrder: number
  }>
  customizationOptions: unknown
  taxPercent: { toNumber(): number } | number
  additionalCharge: { toNumber(): number } | number
  isTaxInclusive: boolean
  trackInventory: boolean
  stock: number
  lowStockThreshold: number
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  metaTitle: string | null
  metaDescription: string | null
  createdAt: Date
  updatedAt: Date
  reviews?: Array<{
    id: string
    rating: number
    title: string | null
    content: string
    userId: string
    user: { name: string | null; email: string }
    createdAt: Date
  }>
  _count?: {
    reviews: number
    orderItems: number
  }
}

function normalize(p: PrismaProduct): Product {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    taxPercent: Number(p.taxPercent ?? 0),
    additionalCharge: Number(p.additionalCharge ?? 0),
  } as Product
}

const selectOptions = sortOptions.map(opt => ({ value: opt.value, label: opt.label }))

/**
 * CTA anchor treatment — mirrors the `Button` Paper + Pop classes. `Button`
 * has no `href`/`asChild`, and an anchor wrapping a `<button>` nests two
 * interactives (contract §6), so CTAs are real anchors. Kept in sync with
 * `@/components/ui/Button`.
 */
const CTA_LINK_CLASSES = [
  'inline-flex min-h-[56px] items-center justify-center gap-2 rounded-pill border-[3px] border-[var(--ink)]',
  'px-8 py-4 font-display text-xl tracking-wide',
  'shadow-ink-2 transition-[transform,box-shadow] duration-fast ease-spring',
  'hover:-translate-y-1 hover:shadow-ink-3',
  'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
  FOCUS_VISIBLE_INK,
].join(' ')

export default function ShopPage() {
  const variants = useMotionVariants()
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesError, setCategoriesError] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('featured')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [pager, setPager] = useState({ total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const loadCategories = useCallback(() => {
    setCategoriesError(false)
    fetch('/api/categories?limit=100')
      .then((r) => r.json())
      .then((j) => { if (j.success) setCategories(j.data.data) })
      .catch(() => setCategoriesError(true))
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1) }, 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const opt = sortOptions.find((o) => o.value === sortBy) ?? sortOptions[0]
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        sortBy: opt.sortBy,
        sortOrder: opt.sortOrder,
      })
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
      if (search) params.set('search', search)
      const res = await fetch(`/api/products?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setProducts(json.data.data.map(normalize))
        setPager(json.data.pagination)
      }
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, selectedCategory, search])

  useEffect(() => {
    load()
  }, [load])

  const categoryPills: Category[] = [
    { id: 'all', name: 'All Products', slug: 'all', image: null },
    ...categories,
  ]

  return (
    <div className="pt-24">
      {/* Hero — one decor accent: a single DoodleScatter (contract §3). */}
      <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <DoodleScatter count={6} seed="shop-hero" />
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="font-display text-6xl md:text-8xl text-[var(--text)] mb-6">Our Stickers</h1>
          <p className="font-hand text-2xl md:text-3xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">
            Discover unique, high-quality stickers for every occasion
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="primary" size="lg"><Truck className="w-5 h-5 mr-2" aria-hidden="true" />Free Delivery over 2000 BDT</Badge>
            <Badge variant="secondary" size="lg"><Shield className="w-5 h-5 mr-2" aria-hidden="true" />Weatherproof Materials</Badge>
            <Badge variant="accent" size="lg"><Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />Custom Designs Welcome</Badge>
          </div>
        </div>
      </section>

      {/* Filters & Toolbar */}
      <div className="bg-[var(--surface-raised)] border-b border-[color-mix(in_srgb,var(--ink)_15%,transparent)] px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Row 1 — search + sort */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <ProductSearchBox
              value={searchInput}
              onChange={setSearchInput}
              className="flex-1 min-w-0"
            />
            <div className="flex items-center gap-2">
              <label htmlFor="shop-sort" className="text-sm font-medium text-[var(--text-subtle)] whitespace-nowrap">
                Sort by:
              </label>
              <Select
                id="shop-sort"
                options={selectOptions}
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
                className="w-auto min-w-[180px]"
              />
            </div>
          </div>

          {/* Row 2 — category grid */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--text-subtle)]">Categories:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" role="group" aria-label="Product categories">
              {categoryPills.map((cat) => {
                const selected = selectedCategory === cat.id
                const Fallback = cat.id === 'all' ? LayoutGrid : getCategoryIcon(cat.icon) ?? Package
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => { setSelectedCategory(cat.id); setPage(1) }}
                    className={cn(
                      'border-2 rounded-[var(--radius-md)] bg-[var(--surface-raised)] p-3 text-center transition-colors hover:bg-[var(--paper-deep)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                      selected
                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]'
                        : 'border-[var(--ink)]',
                    )}
                  >
                    {cat.image ? (
                      // Category images are Cloudinary-hosted (whitelisted in next.config); plain img keeps object-contain simple.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.image} alt="" loading="lazy" className="w-12 h-12 mx-auto mb-2 object-contain" />
                    ) : (
                      <Fallback className="w-12 h-12 mx-auto mb-2 text-[var(--ink)]" strokeWidth={1.5} aria-hidden="true" />
                    )}
                    <span className="block text-sm font-medium text-[var(--text)] leading-tight">{cat.name}</span>
                  </button>
                )
              })}
            </div>
            {categoriesError && (
              <p role="alert" className="text-sm text-[var(--error)] flex items-center gap-2">
                Couldn&apos;t load categories.
                <button type="button" onClick={loadCategories} className="underline font-medium hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded">
                  Retry
                </button>
              </p>
            )}
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Showing <span className="font-medium">{products.length}</span> of{' '}
            <span className="font-medium">{pager.total}</span> products
          </p>
        </div>
      </div>

      {/* Product Grid — uniform 1:1 (spec §13), no list view. */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
              variants={variants.staggerContainer}
              initial="initial"
              animate="animate"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div key={i} variants={variants.staggerItem}>
                  <SkeletonProductCard />
                </motion.div>
              ))}
            </motion.div>
          ) : products.length > 0 ? (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${selectedCategory}-${sortBy}`}
                variants={variants.staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-100px' }}
                exit="exit"
              >
                <ProductGrid products={(products as PrismaProduct[]).map(normalize)} variant="default" />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="py-16 text-center">
              <DoodleSparkle size={64} color="gold" animation="float" className="mx-auto mb-6" />
              <h2 className="font-display text-2xl text-[var(--text)] mb-2">No products found</h2>
              <p className="text-[var(--text-muted)] mb-6">Try adjusting your filters or browse all categories</p>
              <Button variant="primary" size="lg" onClick={() => { setSelectedCategory('all'); setSearchInput(''); setPage(1) }}>
                Clear Filters
              </Button>
            </div>
          )}

          {pager.totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <Pagination currentPage={page} totalPages={pager.totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </section>

      {/* CTA Section — ink band; `--paper-deep` on `--ink` measures 13.8:1. */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--ink)] text-[var(--paper)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl text-[var(--paper)] mb-6">
            Can&apos;t Find What You&apos;re Looking For?
          </h2>
          <p className="text-lg text-[var(--paper-deep)] mb-8 max-w-xl mx-auto">
            Create your own custom stickers with our easy-to-use design tool. Upload your artwork, customize dimensions, and choose from premium materials.
          </p>
          <Link
            href="/custom-sticker"
            className={cn(CTA_LINK_CLASSES, 'bg-[var(--pink-strong)] text-[var(--on-pink-strong)]')}
          >
            Design Custom Stickers
          </Link>
        </div>
      </section>
    </div>
  )
}
