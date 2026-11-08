import { cn } from '@/lib/utils'

/**
 * Grain overlay — a fixed film-grain texture over the whole page (spec §5.7).
 *
 * Purely decorative: `aria-hidden`, `pointer-events-none`, and faint enough
 * (default 3.5% opacity) that it never affects contrast.
 */

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

export interface GrainOverlayProps {
  /** Texture strength, 0–1. Default 0.035. */
  opacity?: number
  className?: string
}

export function GrainOverlay({ opacity = 0.035, className }: GrainOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 z-[9999]', className)}
      style={{
        backgroundImage: `url("${GRAIN_URI}")`,
        backgroundSize: '256px 256px',
        opacity,
      }}
    />
  )
}
