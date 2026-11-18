'use client'

import type { ReactNode } from 'react'
import { GrainOverlay, GridPaper } from '@/components/decorative'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: ReactNode
  /**
   * `default` — the standard page background: `--paper` plus the spec §5.4
   * paper-grain texture. `grid` — the default plus `GridPaper`. `none` — no
   * background at all (the page supplies its own surface).
   */
  background?: 'default' | 'grid' | 'none'
  className?: string
}

/**
 * Task 1.5 — the customer page wrapper.
 *
 * `default` is the cream gradient page with the fixed grain overlay (spec §5.4);
 * `grid` adds the graph-paper backdrop for the custom builder; `none` leaves
 * the surface to the page. The bottom padding clears the fixed `MobileNav`
 * bar (`pb-20` = 80px against the bar's 72px, an 8px margin) and relaxes to
 * `pb-12` from `md` up, where the bar is hidden.
 */
export function PageWrapper({ children, background = 'default', className }: PageWrapperProps) {
  return (
    <div
      className={cn(
        'relative min-h-screen',
        className
      )}
    >
      {background !== 'none' && <GrainOverlay />}
      {background === 'grid' && <GridPaper />}
      <main className="relative z-10 pt-16 pb-20 md:pb-12">{children}</main>
    </div>
  )
}
