'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/SearchInput'
import { Checkbox } from '@/components/ui/Checkbox'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { CategoryIconPicker } from '@/components/admin/CategoryIconPicker'
import { getCategoryIcon } from '@/lib/category-icons'
import { useDebounce } from '@/lib/hooks/useDebounce'

interface CategoryRow {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  icon?: string | null
  isActive: boolean
  sortOrder: number
  _count?: { products: number }
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
  isActive: true,
  image: null as string | null,
  icon: null as string | null,
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/** Upload single image files through the admin endpoint and return their hosted URLs. */
const uploadCategoryImages = async (files: File[]) => {
  const urls: string[] = []
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file)
    const res = await fetch('/api/categories/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, name: file.name }),
    })
    const j = await res.json().catch(() => null)
    if (!res.ok) throw new Error(j?.error || 'Upload failed')
    urls.push(j?.data?.url)
  }
  return urls
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [page, setPage] = useState(1)
  const [pager, setPager] = useState({ total: 0, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', sortOrder: 'asc' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/categories?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setCategories(json.data.data)
        setPager({ total: json.data.pagination.total, pageSize: json.data.pagination.limit })
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login?callbackUrl=/admin/categories')
      } else {
        toast.error(json.error || 'Failed to load categories')
      }
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, router])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSlugTouched(false)
    setShowForm(true)
  }

  const openEdit = (row: CategoryRow) => {
    setEditing(row)
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      image: row.image ?? null,
      icon: row.icon ?? null,
    })
    setSlugTouched(true)
    setShowForm(true)
  }

  const setName = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched
        ? prev.slug
        : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    }))
  }

  const handleSubmit = async () => {
    const slug = form.slug.trim()
    if (form.name.trim().length < 2) return toast.error('Name must be at least 2 characters')
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return toast.error('Slug must be lowercase kebab-case')
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug,
        description: form.description.trim() ? form.description.trim() : null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        image: form.image,
        icon: form.icon,
      }
      const res = await fetch(editing ? `/api/categories/${editing.id}` : '/api/categories', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(j?.error || 'Failed to save category')
        return
      }
      toast.success(editing ? 'Category updated' : 'Category created')
      setShowForm(false)
      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: CategoryRow) => {
    if (!confirm(`Delete category “${row.name}”?`)) return
    const res = await fetch(`/api/categories/${row.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Category deleted')
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'Failed to delete')
    }
  }

  const handleToggleActive = async (row: CategoryRow) => {
    const res = await fetch(`/api/categories/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !row.isActive }),
    })
    if (res.ok) {
      toast.success(row.isActive ? 'Category deactivated' : 'Category activated')
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'Failed to update')
    }
  }

  const formIcon = getCategoryIcon(form.icon)
  const FormIcon = formIcon ?? Package

  const columns: Column<any>[] = [
    {
      key: 'image',
      header: 'Icon',
      cell: ({ row }: { row: any }) => {
        const Icon = getCategoryIcon(row.icon)
        return (
          <div className="w-12 h-12 rounded-input overflow-hidden bg-[var(--light)] border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] flex items-center justify-center">
            {row.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.image} alt={row.name} loading="lazy" className="w-full h-full object-contain" />
            ) : Icon ? (
              <Icon className="w-6 h-6 text-[var(--ink)]" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Package className="w-6 h-6 text-[var(--text-subtle)]" aria-hidden="true" />
            )}
          </div>
        )
      },
      width: '64px',
    },
    { key: 'name', header: 'Name', accessor: (row: any) => row.name, sortable: true },
    { key: 'slug', header: 'Slug', accessor: (row: any) => row.slug },
    { key: 'sortOrder', header: 'Sort', accessor: (row: any) => row.sortOrder, sortable: true },
    { key: 'products', header: 'Products', accessor: (row: any) => row._count?.products ?? 0 },
    {
      key: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.isActive ? 'success' : 'error'} size="sm">{row.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label="Edit" className="hover:-translate-y-1 transition-transform"><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(row)} aria-label={row.isActive ? 'Deactivate' : 'Activate'} className="hover:-translate-y-1 transition-transform text-xs font-medium">{row.isActive ? 'Off' : 'On'}</Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:-translate-y-1 transition-transform" onClick={() => handleDelete(row)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Categories</h1>
            <p className="text-[var(--text-subtle)]">Organise your product catalogue</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <SearchInput
            id="category-search"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            aria-label="Search categories"
          />
        </Card>

        <Card>
          <DataTable
            columns={columns}
            data={categories}
            keyExtractor={(row) => row.id}
            loading={loading}
            pagination={{ page, pageSize: pager.pageSize, total: pager.total, onPageChange: setPage, onPageSizeChange: () => {} }}
          />
        </Card>

        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(null) }}
          title={editing ? 'Edit Category' : 'Create Category'}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="cat-name" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">Name</label>
              <Input id="cat-name" value={form.name} onChange={(e) => setName(e.target.value)} placeholder="Summer Collection" />
            </div>
            <div>
              <label htmlFor="cat-slug" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">Slug</label>
              <Input id="cat-slug" value={form.slug} onChange={(e) => { setSlugTouched(true); setForm((p) => ({ ...p, slug: e.target.value })) }} placeholder="summer-collection" />
            </div>
            <div>
              <label htmlFor="cat-desc" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">Description</label>
              <Textarea id="cat-desc" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional short description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cat-sort" className="block text-sm font-medium text-[var(--text-subtle)] mb-1">Sort order</label>
                <Input id="cat-sort" type="number" min={0} value={String(form.sortOrder)} onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-[var(--text-subtle)] cursor-pointer">
                  <Checkbox checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v === true }))} aria-label="Active" />
                  Active
                </label>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-[var(--text-subtle)] mb-1">Image</span>
              <ImageUpload
                value={form.image ?? undefined}
                onChange={(files) => {
                  const urls = files.map((f) => (typeof f === 'string' ? f : '')).filter(Boolean)
                  setForm((p) => ({ ...p, image: urls.length ? urls[urls.length - 1] : null }))
                }}
                uploadAction={uploadCategoryImages}
                accept="image/*"
                maxSize={8}
                maxFiles={1}
                multiple={false}
                showPreview
                removable
                hint="Optional. Shown on the shop page category grid instead of the icon."
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-[var(--text-subtle)] mb-1">Icon <span className="text-[var(--text-muted)]">(fallback when no image)</span></span>
              <button type="button" onClick={() => setShowIconPicker(true)} className="flex items-center gap-3 w-full min-h-[44px] px-3 border-2 border-dashed border-[var(--ink)] rounded-input hover:bg-[var(--paper-deep)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
                <FormIcon className="w-6 h-6 text-[var(--ink)]" strokeWidth={1.75} aria-hidden="true" />
                <span className="text-sm text-[var(--text-subtle)]">{form.icon ?? 'Choose icon…'}</span>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}</Button>
            </div>
          </div>
        </Modal>

        {showIconPicker && (
          <CategoryIconPicker
            value={form.icon}
            onChange={(name) => setForm((p) => ({ ...p, icon: name }))}
            onClose={() => setShowIconPicker(false)}
          />
        )}
      </div>
    </div>
  )
}
