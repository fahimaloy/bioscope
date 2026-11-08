import { cn } from '@/lib/utils'

/**
 * Sticker peel — the folded top-right corner that marks a card as a sticker.
 *
 * Spec §5.7. Drop it inside a `relative` surface; it positions itself at the
 * top-right corner and never intercepts pointer events. Purely decorative:
 * `aria-hidden`, no text, no children.
 */

export interface StickerPeelProps {
  /** Corner square size in px. */
  size?: number
  /** Fold colour — the die-cut white of the sticker backing. */
  color?: 'die-cut' | 'paper' | 'paper-raised'
  className?: string
}

const PEEL_COLORS: Record<NonNullable<StickerPeelProps['color']>, string> = {
  'die-cut': 'bg-[var(--die-cut)]',
  paper: 'bg-[var(--paper)]',
  'paper-raised': 'bg-[var(--paper-raised)]',
}

export function StickerPeel({ size = 20, color = 'die-cut', className }: StickerPeelProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -right-1 -top-1 z-10 border-2 border-[var(--ink)] shadow-ink-1',
        PEEL_COLORS[color],
        className,
      )}
      style={{ width: size, height: size, transform: 'rotate(45deg)' }}
    />
  )
}
