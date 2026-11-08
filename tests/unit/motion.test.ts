import { describe, expect, expectTypeOf, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { motionVariants, reducedMotionVariants, useMotionVariants } from '@/lib/motion'
import type { MotionVariantKey } from '@/lib/motion'

/**
 * Task 0.2 — motion contract.
 *
 * Pins four things the design contract (docs/DESIGN_CONTRACT.md §4) and the
 * task brief require of `src/lib/motion.ts`:
 *
 * 1. the public surface — every key the codebase consumes plus the legacy
 *    keys the brief keeps, all still valid Motion variant objects (the four
 *    gesture keys excepted: they are target-only by design);
 * 2. the motion-token values — springs inside the spec §5.5 ranges and
 *    durations that do not outstay the 600ms entrance scene;
 * 3. the reduced-motion guarantee — `reducedMotionVariants` is a drop-in
 *    with the same keys, no loop runs, and no content is left at
 *    `opacity: 0`, when the user prefers reduced motion;
 * 4. the gesture contract — the interactive keys are target-only maps that
 *    ride the gesture props directly, and the hover shadow steps instantly.
 */

const repoRoot = process.cwd()

const motionTokens = JSON.parse(
  readFileSync(path.join(repoRoot, 'tokens/src/motion.json'), 'utf8'),
) as Record<string, { $value: any }>

/** The module's public surfaces as plain records so the assertions can walk them. */
const variants = motionVariants as unknown as Record<string, Record<string, any>>
const reduced = reducedMotionVariants as unknown as Record<string, Record<string, any>>

/** `grep -rho 'motionVariants\.[a-zA-Z]*' src | sort -u` today. */
const CONSUMED_KEYS = [
  'bounceIn',
  'fadeInUp',
  'pulseSoft',
  'slideInLeft',
  'slideInRight',
  'staggerContainer',
  'staggerItem',
]

/** Legacy keys the brief keeps even though nothing consumes them today. */
const LEGACY_KEYS = [
  'fadeIn',
  'fadeInDown',
  'scaleIn',
  'wobble',
  'float',
  'hoverLift',
  'hoverScale',
  'tapPress',
  'focusRing',
  'pageEnter',
]

/**
 * The gesture keys are target-only maps — the object *is* the hover/tap/focus
 * target, passed straight to `whileHover={motionVariants.hoverLift}`. They
 * deliberately have no `initial`/`animate`: wrapping them in a rest→target set
 * is what made `whileHover="animate"` a silent no-op (a gesture label only
 * resolves against the element's own `variants` prop).
 */
const GESTURE_KEYS = ['hoverLift', 'hoverScale', 'tapPress', 'focusRing']

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function transitionOf(variant: Record<string, any>): Record<string, any> | undefined {
  return isObject(variant?.transition) ? variant.transition : undefined
}

function loopsForever(variant: Record<string, any>): boolean {
  return transitionOf(variant)?.repeat === Infinity
}

/** `150ms` → `0.15`, matching Motion's seconds-based durations. */
function seconds(tokenName: string): number {
  const raw = motionTokens[tokenName]?.$value
  expect(raw, `motion token ${tokenName} exists`).toBeTruthy()
  return Number(String(raw).replace('ms', '')) / 1000
}

describe('motion variants', () => {
  it('keeps every key the codebase consumes and every legacy key', () => {
    for (const key of [...CONSUMED_KEYS, ...LEGACY_KEYS]) {
      expect(variants[key], `motionVariants.${key}`).toBeTruthy()
    }
  })

  it('exposes a valid Motion variant object for every non-gesture key', () => {
    // The gesture keys are target-only by design (see GESTURE_KEYS); the
    // `reducedMotion` sub-map is gone — its fallback map is now a top-level
    // export with the same keys as `motionVariants`.
    for (const [key, variant] of Object.entries(variants)) {
      if (GESTURE_KEYS.includes(key)) continue
      expect(isObject(variant), `${key} is an object`).toBe(true)
      expect(
        isObject(variant.initial) || isObject(variant.animate),
        `${key} defines an initial and/or animate target`,
      ).toBe(true)
    }
  })

  it('keeps the gesture keys target-only, with their transition at the top level', () => {
    for (const key of GESTURE_KEYS) {
      const variant = variants[key]
      expect(variant.initial, `${key} has no initial`).toBeUndefined()
      expect(variant.animate, `${key} has no animate`).toBeUndefined()
      expect(isObject(variant.transition), `${key} carries its transition`).toBe(true)
    }
  })

  it('gives reducedMotionVariants exactly the same keys as motionVariants', () => {
    expect(Object.keys(reduced).sort()).toEqual(Object.keys(variants).sort())
  })

  it('types useMotionVariants() as a drop-in for motionVariants', () => {
    // Regression guard for the finding that `useMotionVariants().hoverLift`
    // (and the other gesture keys) failed with TS2339 while the hook was
    // documented as a substitute for importing `motionVariants` directly.
    type Hook = ReturnType<typeof useMotionVariants>
    expectTypeOf<Hook>().toHaveProperty('hoverLift')
    expectTypeOf<Hook>().toHaveProperty('hoverScale')
    expectTypeOf<Hook>().toHaveProperty('tapPress')
    expectTypeOf<Hook>().toHaveProperty('focusRing')
    expectTypeOf<keyof Hook>().toEqualTypeOf<MotionVariantKey>()
  })

  it('staggerContainer staggers its children', () => {
    const transition = variants.staggerContainer.animate.transition
    expect(transition.staggerChildren).toBeGreaterThan(0)
    expect(transition.delayChildren).toBeGreaterThanOrEqual(0)
  })

  it('gives every looping variant a reduced-motion fallback that stops the loop', () => {
    const looping = Object.entries(variants).filter(([, variant]) => loopsForever(variant))
    expect(looping.length, 'the module still has looping variants').toBeGreaterThan(0)

    for (const [key] of looping) {
      expect(reduced[key], `${key} loops, so it needs a reduced-motion fallback`).toBeTruthy()
      expect(
        reduced[key].transition?.repeat,
        `${key} must not loop under reduced motion`,
      ).not.toBe(Infinity)
    }
  })

  it('collapses every reduced-motion duration and stagger to zero', () => {
    expect(Object.keys(reduced).length).toBeGreaterThan(0)
    for (const [key, variant] of Object.entries(reduced)) {
      const transition = transitionOf(variant)
      if (!transition) continue
      if ('duration' in transition) {
        expect(transition.duration, `${key} reduced transition duration`).toBe(0)
      }
      if ('staggerChildren' in transition) {
        expect(transition.staggerChildren, `${key} reduced stagger`).toBe(0)
      }
      if ('delayChildren' in transition) {
        expect(transition.delayChildren, `${key} reduced delay`).toBe(0)
      }
    }
  })

  it('never leaves content at opacity 0 under reduced motion', () => {
    for (const [key, variant] of Object.entries(reduced)) {
      if (variant.initial?.opacity !== 0) continue
      expect(variant.animate?.opacity, `${key} reaches its final opacity`).toBe(1)
    }
  })

  it('uses the motion-token springs inside the contract ranges', () => {
    const press = motionTokens['spring-press'].$value as { stiffness: number; damping: number }
    const springs: Array<Record<string, any>> = []

    for (const [key, variant] of Object.entries(variants)) {
      const transition = transitionOf(variant)
      if (transition?.type === 'spring') springs.push({ key, ...transition })
    }

    expect(springs.length, 'the module still uses springs').toBeGreaterThan(0)
    for (const spring of springs) {
      const isPress = spring.stiffness === press.stiffness && spring.damping === press.damping
      if (isPress) continue
      expect(spring.stiffness, `${spring.key} stiffness`).toBeGreaterThanOrEqual(400)
      expect(spring.stiffness, `${spring.key} stiffness`).toBeLessThanOrEqual(550)
      expect(spring.damping, `${spring.key} damping`).toBeGreaterThanOrEqual(20)
      expect(spring.damping, `${spring.key} damping`).toBeLessThanOrEqual(30)
    }
  })

  it('uses the press spring for tap targets and the hover spring for hovers', () => {
    const press = motionTokens['spring-press'].$value
    const hover = motionTokens['spring-hover'].$value
    expect(transitionOf(variants.tapPress)).toMatchObject({ type: 'spring', ...press })
    expect(transitionOf(variants.hoverLift)).toMatchObject({ type: 'spring', ...hover })
  })

  it('steps the hover shadow instantly while the lift rides the spring', () => {
    const transition = transitionOf(variants.hoverLift)
    expect(transition?.type).toBe('spring')
    expect(transition?.boxShadow).toMatchObject({ duration: 0 })
  })

  it('derives its durations from the motion tokens and caps non-looping motion at 600ms', () => {
    expect(transitionOf(variants.fadeIn)?.duration).toBe(seconds('dur-base'))
    expect(transitionOf(variants.tapPress)?.duration).toBeUndefined()

    for (const [key, variant] of Object.entries(variants)) {
      if (loopsForever(variant)) continue
      const duration = transitionOf(variant)?.duration
      if (typeof duration === 'number') {
        expect(duration, `${key} duration`).toBeLessThanOrEqual(0.6)
      }
    }
  })
})
