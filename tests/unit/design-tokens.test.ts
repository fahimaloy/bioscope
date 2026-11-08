import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { designTokens } from '@/lib/design-tokens'

/**
 * Task 0.1 — token pipeline contract.
 *
 * The DTCG JSON in tokens/src/*.json is the single source of truth. These
 * assertions pin the values the design spec fixes (§5.2–§5.5) and the shape
 * of the generated typed token map.
 */

const repoRoot = process.cwd()

function readJson(relativePath: string): Record<string, any> {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'))
}

const color = readJson('tokens/src/color.json')
const type = readJson('tokens/src/type.json')
const shape = readJson('tokens/src/shape.json')
const motion = readJson('tokens/src/motion.json')

/* ------------------------------------------------------------------ */
/* WCAG contrast                                                        */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  const value = parseInt(expanded, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function channelLuminance(channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

/** WCAG 2.1 contrast ratio between a foreground and a background hex. */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground)
  const l2 = relativeLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/* ------------------------------------------------------------------ */
/* Spec-fixed values                                                    */
/* ------------------------------------------------------------------ */

/** Primitive colors, spec §5.2. */
const PRIMITIVES: Record<string, string> = {
  paper: '#FAF3E3',
  'paper-deep': '#F3E7CE',
  'paper-raised': '#FFFDF7',
  ink: '#241B12',
  'ink-soft': '#4A3B2C',
  'ink-muted': '#7A6A57',
  'die-cut': '#FFFFFF',
  pink: '#E91E63',
  'pink-strong': '#C2185B',
  violet: '#9C27B0',
  orange: '#FF9800',
  lime: '#8BC34A',
  teal: '#009688',
  blue: '#2196F3',
  gold: '#FBC02D',
  red: '#D32F2F',
  green: '#388E3C',
  'green-strong': '#2E7D32',
}

/**
 * Semantic color aliases and the primitive they resolve to, spec §5.2.
 * `overlay` is a color-mix expression, not a primitive alias, and
 * `border-strong` is a shape token (spec §5.4) — both are asserted separately.
 */
const SEMANTIC_ALIASES: Record<string, string> = {
  brand: 'pink',
  'on-brand': 'die-cut',
  accent: 'gold',
  info: 'blue',
  success: 'green',
  warning: 'orange',
  error: 'red',
  surface: 'paper',
  'surface-raised': 'paper-raised',
  'surface-sunken': 'paper-deep',
  text: 'ink',
  'text-muted': 'ink-soft',
  'text-subtle': 'ink-muted',
  'text-inverse': 'paper-raised',
  border: 'ink',
  ring: 'gold',
  'on-pink': 'ink',
  'on-pink-strong': 'die-cut',
  'on-violet': 'die-cut',
  'on-red': 'die-cut',
  'on-green': 'ink',
  'on-green-strong': 'die-cut',
  'on-teal': 'ink',
  'on-orange': 'ink',
  'on-gold': 'ink',
  'on-blue': 'ink',
  'on-lime': 'ink',
}

/** Text-bearing `--on-<accent>` pairs that must pass WCAG AA (spec §5.2). */
const AA_PAIRS = [
  { name: 'white on --pink-strong', foreground: '#FFFFFF', background: '#C2185B' },
  { name: 'white on --violet', foreground: '#FFFFFF', background: '#9C27B0' },
  { name: 'white on --red', foreground: '#FFFFFF', background: '#D32F2F' },
  { name: 'white on --green-strong', foreground: '#FFFFFF', background: '#2E7D32' },
  { name: 'ink on --teal', foreground: '#241B12', background: '#009688' },
  { name: 'ink on --orange', foreground: '#241B12', background: '#FF9800' },
  { name: 'ink on --gold', foreground: '#241B12', background: '#FBC02D' },
  { name: 'ink on --blue', foreground: '#241B12', background: '#2196F3' },
  { name: 'ink on --lime', foreground: '#241B12', background: '#8BC34A' },
]

/**
 * Vivid accents that carry text at sub-AA ratios. These are display/decor
 * only and are asserted separately so they are never silently counted as
 * text pairs (spec §5.2, ledger ruling).
 */
const DISPLAY_ONLY_PAIRS = [
  { name: 'ink on --pink', foreground: '#241B12', background: '#E91E63', expected: 3.89 },
  { name: 'ink on --green', foreground: '#241B12', background: '#388E3C', expected: 4.11 },
]

const TYPE_SCALE: Record<string, { fontSize: string; lineHeight: string }> = {
  'text-xs': { fontSize: '12px', lineHeight: '1.5' },
  'text-sm': { fontSize: '14px', lineHeight: '1.5' },
  'text-base': { fontSize: '16px', lineHeight: '1.6' },
  'text-lg': { fontSize: '18px', lineHeight: '1.6' },
  'text-xl': { fontSize: '20px', lineHeight: '1.4' },
  'text-2xl': { fontSize: '24px', lineHeight: '1.3' },
  'text-3xl': { fontSize: '30px', lineHeight: '1.2' },
  'text-4xl': { fontSize: '36px', lineHeight: '1.15' },
  'text-5xl': { fontSize: '48px', lineHeight: '1.1' },
  'text-6xl': { fontSize: '64px', lineHeight: '1.05' },
}

const EASINGS: Record<string, number[]> = {
  'ease-spring': [0.34, 1.56, 0.64, 1],
  'ease-out': [0.16, 1, 0.3, 1],
  'ease-in-out': [0.65, 0, 0.35, 1],
}

const DURATIONS: Record<string, string> = {
  'dur-micro': '150ms',
  'dur-fast': '200ms',
  'dur-base': '300ms',
  'dur-slow': '500ms',
  'dur-scene': '800ms',
}

const SHAPE: Record<string, string> = {
  'radius-sm': '6px',
  'radius-md': '10px',
  'radius-lg': '16px',
  'radius-xl': '24px',
  'radius-pill': '999px',
  'radius-wobble-sm': '255px 15px 225px 15px / 15px 225px 15px 255px',
  'radius-wobble-md': '18px 6px 20px 8px / 8px 20px 6px 18px',
  'radius-wobble-lg': '30px 10px 34px 12px / 12px 34px 10px 30px',
  'border-ink': '2px solid var(--ink)',
  'border-strong': '3px solid var(--ink)',
  'shadow-ink-1': '2px 2px 0 var(--ink)',
  'shadow-ink-2': '4px 4px 0 var(--ink)',
  'shadow-ink-3': '6px 6px 0 var(--ink)',
  'shadow-ink-4': '10px 10px 0 var(--ink)',
  'shadow-color': '8px 8px 0 var(--accent)',
  'shadow-die-cut': '0 0 0 3px var(--die-cut), var(--shadow-ink-2)',
}

/** Every CSS custom property the brief's Interfaces list requires. */
const REQUIRED_CSS_TOKENS = [
  '--paper',
  '--paper-deep',
  '--paper-raised',
  '--ink',
  '--ink-soft',
  '--ink-muted',
  '--die-cut',
  '--pink',
  '--pink-strong',
  '--violet',
  '--orange',
  '--lime',
  '--teal',
  '--blue',
  '--gold',
  '--red',
  '--green',
  '--green-strong',
  '--brand',
  '--on-brand',
  '--on-pink',
  '--on-pink-strong',
  '--on-violet',
  '--on-red',
  '--on-green',
  '--on-green-strong',
  '--on-teal',
  '--on-orange',
  '--on-gold',
  '--on-blue',
  '--on-lime',
  '--accent',
  '--info',
  '--success',
  '--warning',
  '--error',
  '--surface',
  '--surface-raised',
  '--surface-sunken',
  '--text',
  '--text-muted',
  '--text-subtle',
  '--text-inverse',
  '--border',
  '--border-strong',
  '--ring',
  '--overlay',
  '--shadow-ink-1',
  '--shadow-ink-2',
  '--shadow-ink-3',
  '--shadow-ink-4',
  '--shadow-color',
  '--shadow-die-cut',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-pill',
  '--radius-wobble-sm',
  '--radius-wobble-md',
  '--radius-wobble-lg',
  '--border-ink',
  '--ease-spring',
  '--ease-out',
  '--ease-in-out',
  '--dur-micro',
  '--dur-fast',
  '--dur-base',
  '--dur-slow',
  '--dur-scene',
  '--text-xs',
  '--text-sm',
  '--text-base',
  '--text-lg',
  '--text-xl',
  '--text-2xl',
  '--text-3xl',
  '--text-4xl',
  '--text-5xl',
  '--text-6xl',
]

/* ------------------------------------------------------------------ */
/* Assertions                                                          */
/* ------------------------------------------------------------------ */

describe('design tokens', () => {
  it('defines the primitive color values fixed by spec §5.2', () => {
    for (const [name, value] of Object.entries(PRIMITIVES)) {
      expect(color[name]?.$value, `color.${name}`).toBe(value)
    }
  })

  it('passes WCAG AA for body text on paper', () => {
    expect(contrastRatio('#241B12', '#FAF3E3')).toBeGreaterThanOrEqual(4.5)
  })

  it('passes WCAG AA for every text-bearing --on-<accent> pair', () => {
    for (const pair of AA_PAIRS) {
      expect(contrastRatio(pair.foreground, pair.background), pair.name).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('documents the display-only sub-AA accent pairs', () => {
    for (const pair of DISPLAY_ONLY_PAIRS) {
      const ratio = contrastRatio(pair.foreground, pair.background)
      expect(ratio, pair.name).toBeLessThan(4.5)
      expect(ratio, pair.name).toBeCloseTo(pair.expected, 2)
    }
    // The display-only pairings are still explicit tokens.
    expect(color['on-pink']?.$value).toBe('{ink}')
    expect(color['on-green']?.$value).toBe('{ink}')
  })

  it('resolves every semantic alias to a primitive in tokens/src/color.json', () => {
    const resolve = (name: string): string => {
      const token = color[name]
      expect(token, `color.${name} exists`).toBeTruthy()
      const value = token.$value
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return resolve(value.slice(1, -1))
      }
      return String(value)
    }

    for (const [alias, primitive] of Object.entries(SEMANTIC_ALIASES)) {
      expect(color[primitive]?.$value, `primitive ${primitive} exists`).toBeTruthy()
      expect(resolve(alias).toUpperCase(), `${alias} resolves to ${primitive}`).toBe(
        String(color[primitive].$value).toUpperCase(),
      )
    }
  })

  it('defines --overlay as the spec color-mix', () => {
    expect(color.overlay.$value).toBe('color-mix(in srgb, var(--ink) 55%, transparent)')
  })

  it('defines --shadow-die-cut without colliding with --die-cut', () => {
    expect(shape['shadow-die-cut'].$value).toBe('0 0 0 3px var(--die-cut), var(--shadow-ink-2)')
    // Both referenced parts must resolve to tokens that exist.
    expect(shape['shadow-ink-2'].$value).toBe('4px 4px 0 var(--ink)')
    expect(color['die-cut'].$value).toBe('#FFFFFF')
  })

  it('defines the type scale from spec §5.3', () => {
    for (const [name, expected] of Object.entries(TYPE_SCALE)) {
      expect(type[name]?.$value, `type.${name}`).toEqual(expected)
    }
  })

  it('defines the motion tokens from spec §5.5', () => {
    for (const [name, expected] of Object.entries(EASINGS)) {
      expect(motion[name]?.$value, `motion.${name}`).toEqual(expected)
    }
    for (const [name, expected] of Object.entries(DURATIONS)) {
      expect(motion[name]?.$value, `motion.${name}`).toBe(expected)
    }
  })

  it('defines the shape tokens from spec §5.4', () => {
    for (const [name, expected] of Object.entries(SHAPE)) {
      expect(shape[name]?.$value, `shape.${name}`).toBe(expected)
    }
  })

  it('exports designTokens with every required token as a var() reference', () => {
    const tokens = designTokens as unknown as Record<string, string>
    for (const token of REQUIRED_CSS_TOKENS) {
      const key = token.replace(/^--/, '')
      expect(tokens[key], `designTokens.${key}`).toBe(`var(${token})`)
    }
  })

  it('splices every required token into the generated globals.css region', () => {
    const css = readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8')
    const region = css.split('/* @tokens-start (generated) */')[1]?.split('/* @tokens-end */')[0] ?? ''
    expect(region, 'generated token region exists').not.toBe('')
    for (const token of REQUIRED_CSS_TOKENS) {
      expect(region, `${token} present`).toContain(`${token}:`)
    }
  })
})
