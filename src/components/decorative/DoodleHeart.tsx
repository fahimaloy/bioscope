import { cn } from '@/lib/utils'

/**
 * Doodle heart — hand-drawn favouriting mark.
 *
 * Spec §5.6 / §5.7: hand-authored SVG, `currentColor`, animatable. Purely
 * decorative: `aria-hidden`. Loop animations ride the global keyframes in
 * `src/app/globals.css` and are disabled under `prefers-reduced-motion`.
 */

export type DoodleHeartColor =
  | 'pink'
  | 'gold'
  | 'violet'
  | 'teal'
  | 'blue'
  | 'lime'
  | 'orange'
  | 'red'
  | 'ink'

export type DoodleHeartAnimation = 'none' | 'float' | 'wobble' | 'pulse' | 'spin'

const HEART_COLORS: Record<DoodleHeartColor, string> = {
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

const HEART_ANIMATIONS: Record<DoodleHeartAnimation, string> = {
  none: '',
  float: 'animate-float-gentle',
  wobble: 'animate-wobble',
  pulse: 'animate-pulse-soft',
  spin: 'animate-rotate-slow',
}

export interface DoodleHeartProps {
  /** Edge length in px. */
  size?: number
  color?: DoodleHeartColor
  animation?: DoodleHeartAnimation
  className?: string
}

export function DoodleHeart({
  size = 32,
  color = 'pink',
  animation = 'none',
  className,
}: DoodleHeartProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', HEART_COLORS[color], HEART_ANIMATIONS[animation], className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    </svg>
  )
}
