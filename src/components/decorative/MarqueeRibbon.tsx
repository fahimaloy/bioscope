import { cn } from '@/lib/utils'

/**
 * Marquee ribbon — a scrolling brand band (spec §5.7).
 *
 * The items are rendered twice so the `marquee-scroll` keyframe can translate
 * the track by exactly -50% and loop seamlessly. Hovering pauses the track
 * (`animation-play-state`), and the `prefers-reduced-motion` block in
 * `globals.css` stops the loop entirely.
 *
 * The text is duplicated decoration, not content: the whole band is
 * `aria-hidden`.
 */

export interface MarqueeRibbonProps {
  /** Ribbon entries, in order. Duplicated internally for the loop. */
  items: string[]
  /** Seconds per loop. Default 20. */
  duration?: number
  className?: string
}

export function MarqueeRibbon({ items, duration = 20, className }: MarqueeRibbonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden whitespace-nowrap border-y-2 border-[var(--ink)] bg-[var(--accent)]',
        className,
      )}
    >
      <div
        className="flex w-max items-center hover:[animation-play-state:paused]"
        style={{
          animationName: 'marquee-scroll',
          animationDuration: `${duration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }}
      >
        {[...items, ...items].map((item, index) => (
          <span
            key={index}
            className="inline-block px-8 font-display text-sm tracking-[0.05em] text-[var(--ink)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
