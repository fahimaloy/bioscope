'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/SearchInput'
import { toast } from 'sonner'
import { Boxes, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface InventoryProduct {
  id: string
  name: string
  slug: string
  stock: number
  lowStockThreshold: number
  trackInventory: boolean
  images: string[]
  category?: { name: string } | null
}

interface StockAdjustment {
  id: string
  change: number
  previousStock: number
  newStock: number
  reason: string
  note: string | null
  createdAt: string
}

const REASONS = ['RESTOCK', 'SALE_CORRECTION', 'DAMAGE', 'RETURN', 'MANUAL_ADJUSTMENT']

export default function AdminInventoryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<InventoryProduct | null>(null)
  const [newStock, setNewStock] = useState('')
  const [reason, setReason] = useState('RESTOCK')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<StockAdjustment[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/products?${params.toString()}`)
      const json = await res.json()
      if (res.status === 401 || res.status === 403) {
        router.push('/login?callbackUrl=/admin/inventory')
        return
      }
      if (!res.ok) throw new Error(json?.error || 'Failed to load products')
      const all: InventoryProduct[] = json.data?.data ?? []
      setProducts(all.filter((p) => p.trackInventory))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [search, router])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  const openAdjust = (p: InventoryProduct) => {
    setSelected(p)
    setNewStock(String(p.stock))
    setReason('RESTOCK')
    setNote('')
    setHistory([])
    setHistoryLoading(true)
    fetch(`/api/products/${p.id}/stock`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => setHistory(Array.isArray(body?.data?.adjustments) ? body.data.adjustments : []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }

  const saveAdjustment = async () => {
    if (!selected) return
    const value = Number(newStock)
    if (!Number.isInteger(value) || value < 0) {
      toast.error('Stock must be a non-negative integer')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${selected.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: value, reason, note: note.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to adjust stock')
      toast.success(`Stock updated to ${value}`)
      setSelected(null)
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock')
    } finally {
      setSaving(false)
    }
  }

  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold).length

  return (
  <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-primary flex items-center gap-3">
              <Boxes className="w-8 h-8" /> Inventory
            </h1>
            <p className="text-[var(--text-subtle)]">Stock levels for tracked products</p>
          </div>
          {lowStock > 0 && (
            <Badge variant="warning" size="sm" className="gap-1.5">
              <AlertTriangle className="w-4 h-4" /> {lowStock} low stock
            </Badge>
          )}
        </div>

        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tracked products…" />

        <Card variant="doodle" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-[var(--light)] text-sm uppercase tracking-wide text-[var(--text-subtle)]">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Threshold</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-subtle)]">Loading…</td></tr>
                )}
                {!loading && products.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-subtle)]">No tracked products. Enable “track inventory” on a product to see it here.</td></tr>
                )}
                {products.map((p) => {
                  const low = p.stock <= p.lowStockThreshold
                  return (
                    <tr key={p.id} className="border-b border-[var(--light)] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-input object-cover" />
                          )}
                          <span className="font-medium text-[var(--ink)]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-subtle)]">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={low ? 'warning' : 'success'} size="sm">{p.stock} {low ? '· LOW' : ''}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-subtle)]">{p.lowStockThreshold}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => openAdjust(p)}>Adjust</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Adjust — ${selected.name}` : 'Adjust stock'} size="md">
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-subtle)]">Current stock: <span className="font-display text-[var(--ink)]">{selected.stock}</span></p>
            <Input label="New stock level" type="number" min={0} value={newStock} onChange={(e) => setNewStock(e.target.value)} />
            <div>
              <label className="text-sm font-medium text-[var(--ink)]" htmlFor="reason">Reason</label>
              <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-input border-2 border-[var(--light)] bg-[var(--surface-raised)] px-3 py-2 text-[var(--ink)]">
                {REASONS.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--ink)]" htmlFor="note">Note (optional)</label>
              <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-input border-2 border-[var(--light)] bg-[var(--surface-raised)] px-3 py-2 text-[var(--ink)]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={saveAdjustment} loading={saving}>Save adjustment</Button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[var(--ink)] mb-2">Recent adjustments</h4>
              {historyLoading && <p className="text-sm text-[var(--text-subtle)]">Loading history…</p>}
              {!historyLoading && history.length === 0 && <p className="text-sm text-[var(--text-subtle)]">No adjustments yet.</p>}
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 text-sm border-b border-[var(--light)] py-1.5">
                    <span className="flex items-center gap-2">
                      {h.change >= 0 ? <ArrowUp className="w-4 h-4 text-success" /> : <ArrowDown className="w-4 h-4 text-error" />}
                      <span className="text-[var(--ink)]">{h.previousStock} → {h.newStock}</span>
                      <span className="text-xs uppercase text-[var(--text-subtle)]">{h.reason.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="text-xs text-[var(--text-subtle)]">{formatDate(h.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
