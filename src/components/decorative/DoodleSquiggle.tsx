import { cn } from '@/lib/utils'

/**
 * Doodle squiggle — a loose hand-drawn underline/divider stroke.
 *
 * Spec §5.6 / §5.7: hand-authored SVG, `currentColor`, animatable. Purely
 * decorative: `aria-hidden`. Loop animations ride the global keyframes in
 * `src/app/globals.css` and are disabled under `prefers-reduced-motion`.
 */

export type DoodleSquiggleColor =
  | 'pink'
  | 'gold'
  | 'violet'
  | 'teal'
  | 'blue'
  | 'lime'
  | 'orange'
  | 'red'
  | 'ink'

export type DoodleSquiggleAnimation = 'none' | 'float' | 'wobble' | 'pulse' | 'spin'

const SQUIGGLE_COLORS: Record<DoodleSquiggleColor, string> = {
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

const SQUIGGLE_ANIMATIONS: Record<DoodleSquiggleAnimation, string> = {
  none: '',
  float: 'animate-float-gentle',
  wobble: 'animate-wobble',
  pulse: 'animate-pulse-soft',
  spin: 'animate-rotate-slow',
}

export interface DoodleSquiggleProps {
  /** Width in px. */
  size?: number
  color?: DoodleSquiggleColor
  animation?: DoodleSquiggleAnimation
  className?: string
}

export function DoodleSquiggle({
  size = 32,
  color = 'violet',
  animation = 'none',
  className,
}: DoodleSquiggleProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', SQUIGGLE_COLORS[color], SQUIGGLE_ANIMATIONS[animation], className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        d="M2 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
