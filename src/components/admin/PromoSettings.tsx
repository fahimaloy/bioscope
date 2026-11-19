'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Ticket, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface Promo {
  code: string
  type: 'percent' | 'fixed'
  value: number
}

/**
 * E4 — admin promo-code management. Codes are settings keyed `promo_<CODE>`
 * with a JSON value { type: 'percent'|'fixed', value }. createOrder and the
 * checkout validate endpoint read these server-side. Created via the existing
 * settings API (requireAdmin); deleted via DELETE /api/settings/[key].
 */
export function PromoSettings() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const json = await res.json()
      const settings = (json?.data?.settings ?? {}) as Record<string, unknown>
      const list: Promo[] = []
      for (const [key, val] of Object.entries(settings)) {
        if (!key.startsWith('promo_')) continue
        const v = val as { type?: string; value?: number }
        if (v && (v.type === 'percent' || v.type === 'fixed') && typeof v.value === 'number') {
          list.push({ code: key.slice(6), type: v.type, value: v.value })
        }
      }
      list.sort((a, b) => a.code.localeCompare(b.code))
      setPromos(list)
    } catch {
      toast.error('Could not load promo codes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    const num = Number(value)
    if (!cleanCode) { setError('Enter a code (letters and numbers).'); return }
    if (!Number.isFinite(num) || num <= 0) { setError('Enter a positive discount value.'); return }
    if (type === 'percent' && num > 100) { setError('A percent discount cannot exceed 100.'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/promo_${encodeURIComponent(cleanCode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: JSON.stringify({ type, value: num }),
          type: 'JSON',
          category: 'PROMOTIONS',
          description: `Promo code ${cleanCode}`,
          isPublic: false,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json?.error || 'Could not save the code.'); return }
      toast.success(`Promo ${cleanCode} saved`)
      setCode('')
      setValue('')
      await load()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (promoCode: string) => {
    try {
      const res = await fetch(`/api/settings/promo_${encodeURIComponent(promoCode)}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        toast.error(json?.error || 'Could not delete the code')
        return
      }
      toast.success(`Promo ${promoCode} deleted`)
      await load()
    } catch {
      toast.error('Network error. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="doodle" padding="lg" className="relative">
        <h3 className="mb-4 flex items-center gap-2 font-display text-xl text-[var(--text)]">
          <Ticket className="h-5 w-5" aria-hidden="true" />
          Create a promo code
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <Input label="Code" placeholder="SAVE10" value={code} onChange={(e) => setCode(e.target.value)} disabled={saving} />
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor="promo-type">Type</label>
            <select
              id="promo-type"
              value={type}
              onChange={(e) => setType(e.target.value as 'percent' | 'fixed')}
              disabled={saving}
              className="h-12 w-full rounded-md border-2 border-[var(--ink)] bg-[var(--surface-raised)] px-3 text-[var(--text)]"
            >
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (BDT)</option>
            </select>
          </div>
          <Input label={type === 'percent' ? 'Percent off' : 'Amount off (BDT)'} type="number" min="0" placeholder={type === 'percent' ? '10' : '100'} value={value} onChange={(e) => setValue(e.target.value)} disabled={saving} />
          <Button type="button" variant="primary" size="lg" onClick={create} loading={saving} className="sm:mt-7">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
            Add
          </Button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-[var(--error)]">{error}</p>}
        <p className="mt-3 text-xs text-[var(--text-subtle)]">
          Codes are case-insensitive. Percent codes cap at 100%; fixed codes cap at the order subtotal.
        </p>
      </Card>

      <Card variant="doodle" padding="lg" className="relative">
        <h3 className="mb-4 font-display text-xl text-[var(--text)]">Active codes</h3>
        {loading ? (
          <p className="text-[var(--text-subtle)]">Loading…</p>
        ) : promos.length === 0 ? (
          <p className="text-[var(--text-muted)]">No promo codes yet. Create one above.</p>
        ) : (
          <ul className="space-y-3">
            {promos.map((p) => (
              <li key={p.code} className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-[var(--ink)] bg-[var(--surface-raised)] p-3">
                <span className="flex items-center gap-3">
                  <span className="font-display text-lg text-[var(--text)]">{p.code}</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {p.type === 'percent' ? `${p.value}% off` : `BDT ${p.value} off`}
                  </span>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(p.code)} aria-label={`Delete promo ${p.code}`}>
                  <Trash2 className="h-4 w-4 text-[var(--error)]" aria-hidden="true" />
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
