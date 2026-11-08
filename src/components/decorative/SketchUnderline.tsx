import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Sketch underline — a hand-drawn stroke beneath a word or phrase.
 *
 * Spec §5.7. Unlike the other decor pieces this one wraps **meaningful** text,
 * so the wrapper is deliberately *not* `aria-hidden` (hiding it would hide the
 * word); only the underline stroke is hidden from assistive tech.
 */

export type SketchUnderlineColor =
  | 'pink'
  | 'gold'
  | 'violet'
  | 'teal'
  | 'blue'
  | 'lime'
  | 'orange'
  | 'red'
  | 'ink'

const UNDERLINE_COLORS: Record<SketchUnderlineColor, string> = {
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

export interface SketchUnderlineProps {
  children: ReactNode
  color?: SketchUnderlineColor
  className?: string
}

export function SketchUnderline({ children, color = 'pink', className }: SketchUnderlineProps) {
  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      <svg
        aria-hidden="true"
        className={cn('absolute -bottom-1 left-0 h-1.5 w-full', UNDERLINE_COLORS[color])}
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          d="M0 4 C 20 1, 40 6, 60 3 S 90 2, 100 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
