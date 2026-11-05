'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Card } from '@/components/ui/Card'
import { ProductForm } from '@/components/admin/ProductForm'
import { ProductPreview } from '@/components/admin/ProductPreview'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'

const COLUMNS: Column<any>[] = [
  { key: 'image', header: 'Image', cell: ({ row }: { row: any }) => <img src={row.images?.[0] || '/images/sticker-placeholder.svg'} alt={row.name} className="w-12 h-12 rounded-input object-cover" /> },
  { key: 'name', header: 'Product', accessor: (row: any) => row.name, sortable: true },
  { key: 'category', header: 'Category', accessor: (row: any) => row.category?.name ?? '—' },
  { key: 'price', header: 'Price', accessor: (row: any) => formatCurrency(Number(row.basePrice)), sortable: true },
  { key: 'stock', header: 'Stock', accessor: (row: any) => row.stock, sortable: true },
  { key: 'status', header: 'Status', cell: ({ row }: { row: any }) => <Badge variant={row.isActive ? 'success' : 'error'} size="sm">{row.isActive ? 'Active' : 'Inactive'}</Badge> },
  { key: 'featured', header: 'Featured', cell: ({ row }: { row: any }) => (row.isFeatured ? 'Yes' : 'No') },
  { key: 'createdAt', header: 'Created', accessor: (row: any) => formatDate(row.createdAt), sortable: true },
]

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pager, setPager] = useState({ total: 0, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [previewProduct, setPreviewProduct] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', sortBy: 'createdAt', sortOrder: 'desc' })
      if (search) params.set('search', search)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (statusFilter) params.set('isActive', statusFilter === 'active' ? 'true' : 'false')
      const res = await fetch(`/api/products?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setProducts(json.data.data)
        setPager({ total: json.data.pagination.total, pageSize: json.data.pagination.limit })
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login?callbackUrl=/admin/products')
      } else {
        toast.error(json.error || 'Failed to load products')
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter, statusFilter, router])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch('/api/categories?limit=100&isActive=true')
      .then((r) => r.json())
      .then((j) => { if (j.success) setCategories(j.data.data) })
      .catch(() => {})
  }, [])

  const handleSubmit = async (data: any) => {
    const res = await fetch(editingProduct ? `/api/products/${editingProduct.id}` : '/api/products', {
      method: editingProduct ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success(editingProduct ? 'Product updated' : 'Product created')
      setShowForm(false)
      setEditingProduct(null)
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'Failed to save product')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'Failed to delete')
    }
  }

  const columns: Column<any>[] = [
    ...COLUMNS,
    {
      key: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setPreviewProduct(row)} aria-label="Preview"><Eye className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(row); setShowForm(true) }} aria-label="Edit"><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(row.id)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Products</h1>
            <p className="text-[var(--ink)]/60">Manage your product catalog</p>
          </div>
          <Button onClick={() => { setEditingProduct(null); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/40" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input"
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
              options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              placeholder="Filter by category"
              className="w-48"
            />
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              options={[{ value: '', label: 'All Status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              placeholder="Filter by status"
              className="w-40"
            />
          </div>
        </Card>

        <Card>
          <DataTable
            columns={columns}
            data={products}
            keyExtractor={(row) => row.id}
            loading={loading}
            pagination={{
              page,
              pageSize: pager.pageSize,
              total: pager.total,
              onPageChange: setPage,
              onPageSizeChange: () => {},
            }}
          />
        </Card>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-card border-3 border-[var(--ink)] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <ProductForm
                initialData={editingProduct}
                categories={categories}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingProduct(null) }}
                isEditing={!!editingProduct}
              />
            </div>
          </div>
        )}

        {previewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-card border-3 border-[var(--ink)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <ProductPreview product={previewProduct} />
              <div className="p-4 border-t border-[var(--light)]">
                <Button variant="outline" onClick={() => setPreviewProduct(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
