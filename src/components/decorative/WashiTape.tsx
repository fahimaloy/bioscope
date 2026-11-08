import { cn } from '@/lib/utils'

/**
 * Washi tape — a flat paper-tape strip used to "pin" a heading or card.
 *
 * Spec §5.7 / §5.8: flat colour block, 2px ink border, hard offset shadow.
 * Deliberately **no gradient** (contract §5 bans gradients on brand surfaces).
 * Purely decorative: `aria-hidden`, no text, no children.
 */

export type WashiTapeColor =
  | 'pink'
  | 'gold'
  | 'violet'
  | 'teal'
  | 'blue'
  | 'lime'
  | 'orange'
  | 'red'
  | 'ink'

const TAPE_COLORS: Record<WashiTapeColor, string> = {
  pink: 'bg-[var(--pink)]',
  gold: 'bg-[var(--gold)]',
  violet: 'bg-[var(--violet)]',
  teal: 'bg-[var(--teal)]',
  blue: 'bg-[var(--blue)]',
  lime: 'bg-[var(--lime)]',
  orange: 'bg-[var(--orange)]',
  red: 'bg-[var(--red)]',
  ink: 'bg-[var(--ink)]',
}

export interface WashiTapeProps {
  /** Tape colour. Default `--gold` (the `--accent` token). */
  color?: WashiTapeColor
  /** Rotation in degrees. Default `-2`, the sticker-badge tilt of §5.8. */
  rotation?: number
  /** Strip width in px. */
  width?: number
  /** Strip height in px. */
  height?: number
  className?: string
}

export function WashiTape({
  color = 'gold',
  rotation = -2,
  width = 140,
  height = 28,
  className,
}: WashiTapeProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'inline-block border-2 border-[var(--ink)] shadow-ink-1',
        TAPE_COLORS[color],
        className,
      )}
      style={{ width, height, transform: `rotate(${rotation}deg)` }}
    />
  )
}
