'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ProductGrid } from '@/components/product'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { SkeletonProductCard } from '@/components/ui/Skeleton'
import { Grid, List } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { DoodleShape } from '@/components/decorative/DoodleElements'
import { motion, AnimatePresence } from 'framer-motion'
import { motionVariants } from '@/lib/motion'

const sortOptions = [
  { value: 'featured', label: 'Featured', sortBy: 'sortOrder', sortOrder: 'asc' },
  { value: 'newest', label: 'Newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'price-asc', label: 'Price: Low to High', sortBy: 'basePrice', sortOrder: 'asc' },
  { value: 'price-desc', label: 'Price: High to Low', sortBy: 'basePrice', sortOrder: 'desc' },
  { value: 'name-asc', label: 'Name: A-Z', sortBy: 'name', sortOrder: 'asc' },
  { value: 'name-desc', label: 'Name: Z-A', sortBy: 'name', sortOrder: 'desc' },
] as const

type Category = { id: string; name: string; slug: string }

function normalize(p: any) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    taxPercent: Number(p.taxPercent ?? 0),
    additionalCharge: Number(p.additionalCharge ?? 0),
  }
}

const selectOptions = sortOptions.map(opt => ({ value: opt.value, label: opt.label }))

export default function ShopPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [products, setProducts] = useState<any[]>([])
  const [pager, setPager] = useState({ total: 0, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories?limit=100')
      .then((r) => r.json())
      .then((j) => { if (j.success) setCategories(j.data.data) })
      .catch(() => {})
  }, [])

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
      const res = await fetch(`/api/products?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setProducts(json.data.data.map(normalize))
        setPager(json.data.pagination)
      }
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, selectedCategory])

  useEffect(() => {
    load()
  }, [load])

  const categoryPills = [
    { id: 'all', name: 'All Products' },
    ...categories,
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <DoodleBackground shapeCount={3} className="absolute top-0 left-0 w-full h-full" />
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="staggered-title text-6xl md:text-8xl mb-6">Our Stickers</h1>
          <p className="subtitle text-2xl md:text-3xl mb-8 max-w-2xl mx-auto">
            Discover unique, high-quality stickers for every occasion
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="primary" size="lg">Free Delivery over 2000 BDT</Badge>
            <Badge variant="secondary" size="lg">Weatherproof Materials</Badge>
            <Badge variant="accent" size="lg">Custom Designs Welcome</Badge>
          </div>
        </div>
      </section>

      {/* Filters & Toolbar */}
      <div className="bg-white border-b border-[var(--light)] px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-muted)]">Categories:</span>
              <AnimatePresence mode="popLayout">
                <div key={selectedCategory} className="flex flex-wrap items-center gap-2" role="group" aria-label="Product categories">
                  {categoryPills.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'doodle' : 'doodle-outline'}
                      size="sm"
                      onClick={() => { setSelectedCategory(cat.id); setPage(1) }}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">Sort by:</label>
                <Select
                  options={selectOptions}
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
                  className="min-w-[200px]"
                />
              </div>

              <div className="flex items-center gap-1 bg-[var(--light)] rounded-input p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-input transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-[var(--text-muted)] hover:text-primary'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-input transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-[var(--text-muted)] hover:text-primary'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Showing <span className="font-medium">{products.length}</span> of{' '}
            <span className="font-medium">{pager.total}</span> products
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={motionVariants.staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div key={i} variants={motionVariants.staggerItem}>
                  <SkeletonProductCard />
                </motion.div>
              ))}
            </motion.div>
          ) : products.length > 0 ? (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={selectedCategory + '-' + sortBy + '-' + viewMode}
                variants={motionVariants.staggerContainer}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <ProductGrid
                  products={products as any}
                  variant={viewMode === 'list' ? 'compact' : 'default'}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-16">
              <DoodleShape size="lg" color="primary" animation="float" className="mx-auto mb-6 opacity-50" />
              <h3 className="font-display text-xl text-[var(--ink)] mb-2">No products found</h3>
              <p className="text-[var(--text-muted)] mb-6">Try adjusting your filters or browse all categories</p>
              <Button variant="doodle" size="lg" onClick={() => { setSelectedCategory('all'); setPage(1) }}>
                <span className="mr-2">✨</span>
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

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title text-white mb-6">Can't Find What You're Looking For?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Create your own custom stickers with our easy-to-use design tool. Upload your artwork, customize dimensions, and choose from premium materials.
          </p>
          <Link href="/custom-sticker">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              <span className="mr-2">✨</span>
              Design Custom Stickers
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
