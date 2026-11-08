import { useReducedMotion } from 'framer-motion'

/**
 * Motion system — spec §5.5 and docs/DESIGN_CONTRACT.md §4.
 *
 * Every value below is derived from `tokens/src/motion.json` (the single
 * source of truth) and pinned by `tests/unit/motion.test.ts`:
 *
 * | token | value | used for |
 * |---|---|---|
 * | `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | page enter |
 * | `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | fades, scale-in |
 * | `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | loops, wobble |
 * | `--dur-micro` | `150ms` | exposed via Tailwind for CSS micro-interactions |
 * | `--dur-fast` | `200ms` | scale-in |
 * | `--dur-base` | `300ms` | fades, page enter |
 * | `--dur-slow` | `500ms` | wobble |
 * | `--dur-scene` | `800ms` | reserved — entrances cap at 600ms |
 * | `spring-hover` | `stiffness 500, damping 30` | entrances, hovers |
 * | `spring-press` | `stiffness 700, damping 30` | tap/press feedback |
 *
 * Motion is `transform`/`opacity` only, and every entrance stays inside the
 * 600ms scene cap. Loops (`float`, `pulseSoft`) carry a `reducedMotion`
 * fallback so nothing keeps moving and no content is ever left at
 * `opacity: 0` when the user prefers reduced motion.
 */

/** `--ease-spring` — springy overshoot. */
const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const
/** `--ease-out` — decisive exit. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const
/** `--ease-in-out` — neutral loop easing. */
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

/** `--dur-fast` (200ms). */
const DUR_FAST = 0.2
/** `--dur-base` (300ms). */
const DUR_BASE = 0.3
/** `--dur-slow` (500ms). */
const DUR_SLOW = 0.5

/** `spring-hover` — spec §5.5 range is stiffness 400–550, damping 20–30. */
const SPRING_HOVER = { type: 'spring', stiffness: 500, damping: 30 } as const
/** `spring-press` — press feedback. */
const SPRING_PRESS = { type: 'spring', stiffness: 700, damping: 30 } as const

/**
 * Reduced-motion fallbacks, keyed like `motionVariants`. Loops stop, timed
 * transitions collapse to zero, and every variant that starts at
 * `opacity: 0` still reaches its final state — content is never withheld.
 */
const reducedMotionVariants = {
  // Entrance
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } },
  fadeInUp: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } },
  fadeInDown: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } },
  scaleIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } },
  slideInRight: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } },
  slideInLeft: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } },

  // Doodle-specific — loops stop, transforms settle
  wobble: { animate: { rotate: 0 }, transition: { duration: 0 } },
  float: { animate: { y: 0 }, transition: { duration: 0 } },
  pulseSoft: { initial: { scale: 1 }, animate: { scale: 1 }, transition: { duration: 0 } },
  bounceIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0 } },

  // Stagger container
  staggerContainer: { animate: { transition: { staggerChildren: 0, delayChildren: 0 } } },
  staggerItem: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0 } },

  // Page transitions
  pageEnter: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } },
} as const

export const motionVariants = {
  // Entrance
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: DUR_BASE, ease: EASE_OUT } },
  fadeInUp: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -24 }, transition: SPRING_HOVER },
  fadeInDown: { initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 24 }, transition: SPRING_HOVER },
  scaleIn: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: DUR_FAST, ease: EASE_OUT } },
  slideInRight: { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: SPRING_HOVER },
  slideInLeft: { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 24 }, transition: SPRING_HOVER },

  // Doodle-specific
  wobble: { animate: { rotate: [-3, 3, -3, 0] }, transition: { duration: DUR_SLOW, ease: EASE_IN_OUT } },
  float: { animate: { y: [0, -8, 0] }, transition: { duration: 3, repeat: Infinity, ease: EASE_IN_OUT } },
  pulseSoft: { initial: { scale: 1 }, animate: { scale: [1, 1.02, 1] as [number, number, number] }, transition: { duration: 2, repeat: Infinity, ease: EASE_IN_OUT } },
  bounceIn: { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1 }, transition: SPRING_HOVER },

  // Interactive — rest → target sets; drive them with `whileHover="animate"`,
  // `whileTap="animate"` or `whileFocus="animate"`.
  hoverLift: {
    initial: { scale: 1, y: 0, boxShadow: 'var(--shadow-ink-2)' },
    animate: { scale: 1.02, y: -4, boxShadow: 'var(--shadow-ink-3)' },
    transition: SPRING_HOVER,
  },
  hoverScale: { initial: { scale: 1 }, animate: { scale: 1.05 }, transition: SPRING_HOVER },
  tapPress: { initial: { scale: 1 }, animate: { scale: 0.98 }, transition: SPRING_PRESS },
  // Focus rings are state, not motion: the ring appears instantly and the
  // visible ring itself comes from the CSS `:focus-visible` rule.
  focusRing: {
    initial: { boxShadow: '0 0 0 0 var(--ring)' },
    animate: { boxShadow: '0 0 0 3px var(--ring)' },
    transition: { duration: 0 },
  },

  // Stagger container
  staggerContainer: { animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } },
  staggerItem: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: SPRING_HOVER },

  // Page transitions
  pageEnter: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -24 }, transition: { duration: DUR_BASE, ease: EASE_SPRING } },

  // Reduced-motion fallbacks — swapped in wholesale, never animated in a loop
  reducedMotion: reducedMotionVariants,
} as const

export type MotionVariantKey = keyof typeof motionVariants

/**
 * Returns `motionVariants`, or its `reducedMotion` fallbacks when the user
 * prefers reduced motion. Use it where a component would otherwise import
 * `motionVariants` directly, so loops stop and entrances become instant:
 *
 *   const variants = useMotionVariants()
 *   <motion.div variants={variants.staggerItem} />
 */
export function useMotionVariants() {
  const reduced = useReducedMotion()
  return reduced ? reducedMotionVariants : motionVariants
}
