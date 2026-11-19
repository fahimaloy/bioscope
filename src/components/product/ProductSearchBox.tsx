'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Suggestion {
  id: string
  slug: string
  name: string
  images: string[]
  basePrice: number
}

const RECENT_KEY = 'bioscope-recent-searches'
const MAX_RECENT = 5

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

/**
 * E10 — shop search box with debounced suggestions (top 5 from /api/products),
 * keyboard navigation (Arrow/Enter/Escape), recent searches (localStorage ≤5),
 * a clear button, and an honest empty state. Typing still drives the parent's
 * grid filter via onChange; selecting a suggestion navigates to the product.
 */
export function ProductSearchBox({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { setRecent(loadRecent()) }, [])

  // Debounced suggestions — one fetch per pause, not per keystroke.
  useEffect(() => {
    const q = value.trim()
    if (q.length === 0) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=5`, { signal: ctrl.signal })
        const json = await res.json()
        const items = (json?.data?.data ?? []) as Suggestion[]
        setSuggestions(items.map((p) => ({ id: p.id, slug: p.slug, name: p.name, images: p.images ?? [], basePrice: Number(p.basePrice) })))
        setActiveIndex(-1)
      } catch {
        /* aborted or offline — keep prior suggestions */
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [value])

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const saveRecent = useCallback((term: string) => {
    const t = term.trim()
    if (!t) return
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT)
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const showRecent = value.trim().length === 0 && recent.length > 0
  const list: { kind: 'product' | 'recent'; label: string; slug?: string }[] = showRecent
    ? recent.map((r) => ({ kind: 'recent', label: r }))
    : suggestions.map((s) => ({ kind: 'product', label: s.name, slug: s.slug }))

  const commit = (index: number) => {
    const item = list[index]
    if (!item) return
    if (item.kind === 'product' && item.slug) {
      saveRecent(value)
      setOpen(false)
      router.push(`/shop/${item.slug}`)
    } else {
      onChange(item.label)
      saveRecent(item.label)
      setOpen(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setOpen(true)
      setActiveIndex((i) => (list.length ? (i + 1) % list.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (list.length ? (i - 1 + list.length) % list.length : -1))
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0) { e.preventDefault(); commit(activeIndex) }
      else { saveRecent(value); setOpen(false) }
    }
  }

  const empty = value.trim().length > 0 && !loading && suggestions.length === 0

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-label="Search stickers"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `search-opt-${activeIndex}` : undefined}
          aria-autocomplete="list"
          placeholder="Search stickers…"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-h-[44px] w-full rounded-[var(--radius-md)] border-2 border-[var(--ink)] bg-[var(--surface-raised)] pl-10 pr-10 text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
        {value.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { onChange(''); setSuggestions([]); setOpen(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-subtle)] hover:text-[var(--text)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (list.length > 0 || empty) && (
        <ul
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-[var(--radius-lg)] border-2 border-[var(--ink)] bg-[var(--surface-raised)] py-2 shadow-ink-3"
        >
          {showRecent && (
            <li className="px-3 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]" aria-hidden="true">
              Recent searches
            </li>
          )}
          {list.map((item, i) => (
            <li
              key={`${item.kind}-${item.label}-${i}`}
              id={`search-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => commit(i)}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-3 py-2 text-[var(--text)]',
                i === activeIndex && 'bg-[var(--paper-deep)]'
              )}
            >
              {item.kind === 'recent' ? (
                <Clock size={16} className="flex-shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
              ) : (
                <Search size={16} className="flex-shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
              )}
              <span className="truncate">{item.label}</span>
            </li>
          ))}
          {empty && (
            <li className="px-3 py-3 text-sm text-[var(--text-subtle)]" role="option" aria-selected={false} aria-disabled="true">
              No stickers match “{value.trim()}”.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
