'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ProductGrid } from '@/components/product'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { SkeletonProductCard } from '@/components/ui/Skeleton'
import { Grid, List } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <DoodleScatter count={3} className="absolute top-0 left-0 w-full h-full" />
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
              <span className="text-sm font-medium text-[var(--ink)]/60">Categories:</span>
              <button
                onClick={() => { setSelectedCategory('all'); setPage(1) }}
                className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white shadow-btn'
                    : 'bg-[var(--light)] text-[var(--ink)] hover:bg-dark/10 border border-[var(--ink)]/20'
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setPage(1) }}
                  className={`px-4 py-2 rounded-pill text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-white shadow-btn'
                      : 'bg-[var(--light)] text-[var(--ink)] hover:bg-dark/10 border border-[var(--ink)]/20'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[var(--ink)]/60">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
                  className="px-3 py-2 border-2 border-[var(--ink)] rounded-input focus:border-primary focus:shadow-input text-sm"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-[var(--light)] rounded-input p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-input transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  aria-label="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-input transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-[var(--ink)]/60">
            Showing <span className="font-medium">{products.length}</span> of{' '}
            <span className="font-medium">{pager.total}</span> products
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid
              products={products as any}
              variant={viewMode === 'list' ? 'compact' : 'default'}
            />
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-[var(--light)] rounded-full flex items-center justify-center">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="font-display text-xl text-[var(--ink)] mb-2">No products found</h3>
              <p className="text-[var(--ink)]/60 mb-4">Try adjusting your filters or browse all categories</p>
              <Button variant="secondary" onClick={() => { setSelectedCategory('all'); setPage(1) }}>
                View All Products
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
