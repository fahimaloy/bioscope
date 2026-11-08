import { cn } from '@/lib/utils'

/**
 * Torn edge — a jagged paper tear that caps a section band.
 *
 * Spec §5.7. Render it as the first child of a `relative` band: `top` hangs
 * the tear below the band's top edge, `bottom` flips it above the bottom edge.
 * Purely decorative: `aria-hidden`, no text, no children.
 */

export type TornEdgeColor =
  | 'paper'
  | 'paper-deep'
  | 'paper-raised'
  | 'pink'
  | 'gold'
  | 'violet'
  | 'teal'
  | 'blue'
  | 'lime'
  | 'orange'
  | 'red'
  | 'ink'

export interface TornEdgeProps {
  /** Which end of the band the tear caps. */
  position?: 'top' | 'bottom'
  /** Paper colour the tear is cut from. Default `--paper`. */
  color?: TornEdgeColor
  className?: string
}

const EDGE_COLORS: Record<TornEdgeColor, string> = {
  paper: 'text-[var(--paper)]',
  'paper-deep': 'text-[var(--paper-deep)]',
  'paper-raised': 'text-[var(--paper-raised)]',
  pink: 'text-[var(--pink)]',
  gold: 'text-[var(--gold)]',
  violet: 'text-[var(--violet)]',
  teal: 'text-[var(--teal)]',
  blue: 'text-[var(--blue)]',
  lime: 'text-[var(--lime)]',
  orange: 'text-[var(--orange)]',
  red: 'text-[var(--red)]',
  ink: 'text-[var(--ink)]',
}

/** Jagged bottom edge, drawn against a 100×12 viewBox and stretched to fit. */
const TEAR_PATH =
  'M0 0 H100 V4 L95 9 L90 3 L84 10 L76 4 L68 11 L60 3 L52 8 L44 4 L36 10 L28 3 L20 8 L12 4 L6 10 L0 5 Z'

export function TornEdge({ position = 'top', color = 'paper', className }: TornEdgeProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('block h-3 w-full', EDGE_COLORS[color], position === 'bottom' && 'rotate-180', className)}
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      focusable="false"
    >
      <path d={TEAR_PATH} fill="currentColor" />
    </svg>
  )
}
