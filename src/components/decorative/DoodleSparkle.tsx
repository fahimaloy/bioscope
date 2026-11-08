import { cn } from '@/lib/utils'

/**
 * Doodle sparkle — a four-point twinkle for empty states and celebrations.
 *
 * Spec §5.6 / §5.7: hand-authored SVG, `currentColor`, animatable. Purely
 * decorative: `aria-hidden`. Loop animations ride the global keyframes in
 * `src/app/globals.css` and are disabled under `prefers-reduced-motion`.
 */

export type DoodleSparkleColor =
  | 'pink'
  | 'gold'
  | 'violet'
  | 'teal'
  | 'blue'
  | 'lime'
  | 'orange'
  | 'red'
  | 'ink'

export type DoodleSparkleAnimation = 'none' | 'float' | 'wobble' | 'pulse' | 'spin'

const SPARKLE_COLORS: Record<DoodleSparkleColor, string> = {
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

const SPARKLE_ANIMATIONS: Record<DoodleSparkleAnimation, string> = {
  none: '',
  float: 'animate-float-gentle',
  wobble: 'animate-wobble',
  pulse: 'animate-pulse-soft',
  spin: 'animate-rotate-slow',
}

export interface DoodleSparkleProps {
  /** Edge length in px. */
  size?: number
  color?: DoodleSparkleColor
  animation?: DoodleSparkleAnimation
  className?: string
}

export function DoodleSparkle({
  size = 32,
  color = 'orange',
  animation = 'none',
  className,
}: DoodleSparkleProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn('shrink-0', SPARKLE_COLORS[color], SPARKLE_ANIMATIONS[animation], className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8z" fill="currentColor" />
    </svg>
  )
}
