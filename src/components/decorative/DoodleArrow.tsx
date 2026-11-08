import { cn } from '@/lib/utils'

/**
 * Doodle arrow — a swooping hand-drawn pointer for empty states and CTAs.
 *
 * Spec §5.6 / §5.7: hand-authored SVG, `currentColor`, animatable. Purely
 * decorative: `aria-hidden`. Loop animations ride the global keyframes in
 * `src/app/globals.css` and are disabled under `prefers-reduced-motion`.
 */

export type DoodleArrowColor =
  | 'pink'
  | 'gold'
  | 'violet'
  | 'teal'
  | 'blue'
  | 'lime'
  | 'orange'
  | 'red'
  | 'ink'

export type DoodleArrowAnimation = 'none' | 'float' | 'wobble' | 'pulse' | 'spin'

const ARROW_COLORS: Record<DoodleArrowColor, string> = {
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

const ARROW_ANIMATIONS: Record<DoodleArrowAnimation, string> = {
  none: '',
  float: 'animate-float-gentle',
  wobble: 'animate-wobble',
  pulse: 'animate-pulse-soft',
  spin: 'animate-rotate-slow',
}

export interface DoodleArrowProps {
  /** Edge length in px. */
  size?: number
  color?: DoodleArrowColor
  animation?: DoodleArrowAnimation
  className?: string
}

export function DoodleArrow({
  size = 32,
  color = 'teal',
  animation = 'none',
  className,
}: DoodleArrowProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', ARROW_COLORS[color], ARROW_ANIMATIONS[animation], className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        d="M2.5 18.5C6 10 12 5.5 20.5 4.5M20.5 4.5l-5.2.4M20.5 4.5l-.8 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
