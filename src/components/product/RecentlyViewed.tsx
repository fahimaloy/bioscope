'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRecentlyViewedStore, type ViewedProduct } from '@/lib/stores/recentlyViewedStore'
import { formatCurrency } from '@/lib/utils'
import { SketchUnderline } from '@/components/decorative'

const FALLBACK = '/images/sticker-placeholder.svg'

/**
 * E8 — recently-viewed rail. Records the current product on mount (localStorage,
 * last 8, most-recent first) and renders the OTHER recently-viewed products.
 * Renders nothing until there is history beyond the current product. Gated on
 * mount to avoid an SSR/client hydration mismatch (persisted store is client-only).
 */
export function RecentlyViewed({ current }: { current: ViewedProduct }) {
  const viewed = useRecentlyViewedStore((s) => s.viewed)
  const addViewed = useRecentlyViewedStore((s) => s.addViewed)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    addViewed(current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id])

  if (!mounted) return null
  const others = viewed.filter((p) => p.id !== current.id).slice(0, 8)
  if (others.length === 0) return null

  return (
    <section className="mt-16" aria-label="Recently viewed products">
      <h2 className="mb-6 font-display text-2xl text-[var(--brand)]">
        <SketchUnderline>Recently Viewed</SketchUnderline>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {others.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.slug}`}
            className="group w-40 flex-shrink-0 snap-start rounded-[var(--radius-lg)] border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] bg-[var(--surface-raised)] p-3 transition-colors hover:border-[var(--brand)]"
          >
            <div className="relative mb-2 aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--paper-deep)]">
              <Image src={p.image || FALLBACK} alt={p.name} fill className="object-cover" sizes="160px" />
            </div>
            <h3 className="truncate text-sm text-[var(--text)] group-hover:text-[var(--brand)]">{p.name}</h3>
            <p className="font-display text-base text-[var(--brand)]">{formatCurrency(p.basePrice)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
