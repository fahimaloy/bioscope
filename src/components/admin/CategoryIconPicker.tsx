'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { CATEGORY_ICONS, CATEGORY_ICON_NAMES } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

interface CategoryIconPickerProps {
  value: string | null
  onChange: (iconName: string) => void
  onClose: () => void
}

/**
 * Modal picker of curated Lucide glyphs for categories.
 * `closeOnEscape` is disabled because Escape would also close the parent form modal.
 */
export function CategoryIconPicker({ value, onChange, onClose }: CategoryIconPickerProps) {
  const [query, setQuery] = useState('')

  const names = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CATEGORY_ICON_NAMES
    return CATEGORY_ICON_NAMES.filter((n) => n.toLowerCase().includes(q))
  }, [query])

  return (
    <Modal isOpen onClose={onClose} title="Choose an icon" description="Shown when the category has no uploaded image." size="md" closeOnEscape={false}>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" aria-hidden="true" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter icons…"
            aria-label="Filter icons"
            className="w-full min-h-[44px] pl-10 pr-4 rounded-input border-2 border-[var(--ink)] bg-[var(--paper-raised)] text-[var(--ink)] placeholder:text-[var(--text-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear filter" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--paper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-72 overflow-y-auto pr-1" role="listbox" aria-label="Icon options">
          {names.map((name) => {
            const Icon = CATEGORY_ICONS[name]
            const selected = value === name
            return (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={name}
                title={name}
                onClick={() => { onChange(name); onClose() }}
                className={cn(
                  'h-12 w-12 flex items-center justify-center rounded-input border-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                  selected
                    ? 'border-[var(--primary)] ring-2 ring-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]'
                    : 'border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--paper-deep)]',
                )}
              >
                <Icon className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
              </button>
            )
          })}
          {names.length === 0 && (
            <p className="col-span-full text-sm text-[var(--text-muted)] text-center py-6">No icons match “{query}”.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
