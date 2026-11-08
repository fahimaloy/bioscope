import { cn } from '@/lib/utils'

/**
 * Grid paper — a faint graph-paper backdrop for hero and custom-builder
 * sections (spec §5.7).
 *
 * The lines are drawn with `color-mix()` over `--ink`, so the grid follows the
 * theme token instead of a hardcoded colour. Purely decorative: `aria-hidden`,
 * `pointer-events-none`.
 */

export interface GridPaperProps {
  /** Grid cell size in px. Default 24. */
  cell?: number
  /** Line strength, 0–1. Default 0.08. */
  opacity?: number
  className?: string
}

export function GridPaper({ cell = 24, opacity = 0.08, className }: GridPaperProps) {
  const line = `color-mix(in srgb, var(--ink) ${Math.round(opacity * 100)}%, transparent)`

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: `${cell}px ${cell}px`,
      }}
    />
  )
}
