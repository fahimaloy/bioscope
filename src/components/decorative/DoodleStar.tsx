import { cn } from '@/lib/utils'

/**
 * Doodle star — the brand mark of the decor set.
 *
 * Spec §5.6 / §5.7: hand-authored SVG, `currentColor`, animatable, stroke and
 * fill weights consistent within the surface. Purely decorative: `aria-hidden`.
 *
 * The loop animations ride the global keyframes in `src/app/globals.css`
 * (`animate-float-gentle`, `animate-wobble`, `animate-pulse-soft`,
 * `animate-rotate-slow`), which the `prefers-reduced-motion` block already
 * disables — so a doodle never keeps moving for a user who asked it to stop.
 */

export type DoodleColor =
  | 'pink'
  | 'gold'
  | 'violet'
  | 'teal'
  | 'blue'
  | 'lime'
  | 'orange'
  | 'red'
  | 'ink'

export type DoodleAnimation = 'none' | 'float' | 'wobble' | 'pulse' | 'spin'

const DOODLE_COLORS: Record<DoodleColor, string> = {
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

const DOODLE_ANIMATIONS: Record<DoodleAnimation, string> = {
  none: '',
  float: 'animate-float-gentle',
  wobble: 'animate-wobble',
  pulse: 'animate-pulse-soft',
  spin: 'animate-rotate-slow',
}

export interface DoodleStarProps {
  /** Edge length in px. */
  size?: number
  color?: DoodleColor
  animation?: DoodleAnimation
  className?: string
}

export function DoodleStar({
  size = 32,
  color = 'gold',
  animation = 'none',
  className,
}: DoodleStarProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', DOODLE_COLORS[color], DOODLE_ANIMATIONS[animation], className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        d="M12 2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.2l-6 3.2 1.3-6.7-5-4.7 6.8-.8z"
        fill="currentColor"
      />
    </svg>
  )
}
