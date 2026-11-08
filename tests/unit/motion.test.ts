import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { motionVariants } from '@/lib/motion'

/**
 * Task 0.2 — motion contract.
 *
 * Pins three things the design contract (docs/DESIGN_CONTRACT.md §4) and the
 * task brief require of `src/lib/motion.ts`:
 *
 * 1. the public surface — every key the codebase consumes plus the legacy
 *    keys the brief keeps, all still valid Motion variant objects;
 * 2. the motion-token values — springs inside the spec §5.5 ranges and
 *    durations that do not outstay the 600ms entrance scene;
 * 3. the reduced-motion guarantee — no loop runs, and no content is left at
 *    `opacity: 0`, when the user prefers reduced motion.
 */

const repoRoot = process.cwd()

const motionTokens = JSON.parse(
  readFileSync(path.join(repoRoot, 'tokens/src/motion.json'), 'utf8'),
) as Record<string, { $value: any }>

/** The module's public surface as a plain record so the assertions can walk it. */
const variants = motionVariants as unknown as Record<string, Record<string, any>>

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

const REDUCED_MOTION = 'reducedMotion'

const reduced = variants[REDUCED_MOTION] as Record<string, Record<string, any>>

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

  it('exposes a valid Motion variant object for every key except the reducedMotion sub-map', () => {
    // `reducedMotion` is a nested map of fallback variants, not a variant
    // itself: it is swapped in wholesale when the user prefers reduced
    // motion, so its children — not the map — are variant objects. Asserting
    // `initial`/`animate` on the map would force flattening it into a single
    // variant and lose the per-variant fallbacks.
    for (const [key, variant] of Object.entries(variants)) {
      if (key === REDUCED_MOTION) continue
      expect(isObject(variant), `${key} is an object`).toBe(true)
      expect(
        isObject(variant.initial) || isObject(variant.animate),
        `${key} defines an initial and/or animate target`,
      ).toBe(true)
    }
  })

  it('staggerContainer staggers its children', () => {
    const transition = variants.staggerContainer.animate.transition
    expect(transition.staggerChildren).toBeGreaterThan(0)
    expect(transition.delayChildren).toBeGreaterThanOrEqual(0)
  })

  it('gives every looping variant a reduced-motion fallback that stops the loop', () => {
    const looping = Object.entries(variants).filter(
      ([key, variant]) => key !== REDUCED_MOTION && loopsForever(variant),
    )
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
      if (key === REDUCED_MOTION) continue
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

  it('derives its durations from the motion tokens and caps non-looping motion at 600ms', () => {
    expect(transitionOf(variants.fadeIn)?.duration).toBe(seconds('dur-base'))
    expect(transitionOf(variants.tapPress)?.duration).toBeUndefined()

    for (const [key, variant] of Object.entries(variants)) {
      if (key === REDUCED_MOTION || loopsForever(variant)) continue
      const duration = transitionOf(variant)?.duration
      if (typeof duration === 'number') {
        expect(duration, `${key} duration`).toBeLessThanOrEqual(0.6)
      }
    }
  })
})
