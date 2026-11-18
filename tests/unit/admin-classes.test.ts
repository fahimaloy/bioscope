import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * Additive regression gate (2026-11-15, Pass 5.1.2): the class of bug where
 * admin components reference Tailwind keys that do not exist in
 * tailwind.config.ts (custom color/radius/fontSize). Tailwind silently drops
 * unknown classes at build time, so these regressions render unstyled with
 * no error anywhere.
 *
 * Rule: for the four color utility families and the fontSize/borderRadius
 * families, every bare (non-arbitrary, non-scaled) custom key used in
 * src/components/admin/** must exist in the corresponding section of
 * tailwind.config.ts (or in the hardcoded Tailwind defaults below).
 */

const repoRoot = process.cwd()
const ADMIN_DIR = path.join(repoRoot, 'src/components/admin')

const DEFAULT_COLORS = new Set([
  'white', 'black', 'transparent', 'current', 'inherit',
  // Non-color utility families that share the text-/border- prefixes
  'center', 'left', 'right', 'justify', 'start', 'end', // text-align
  'solid', 'dashed', 'dotted', 'double', 'hidden', 'none', // border-style
  't', 'b', 'l', 'r', 'x', 'y', // border-t/b/l/r and divide-x/y widths
])

// Custom keys extracted from tailwind.config.ts at authoring time (asserted
// to still exist below — if the config changes, this test forces an update).
const CONFIG_COLORS = new Set([
  'accent', 'bg-color', 'blue', 'border', 'border-strong', 'brand', 'dark',
  'die-cut', 'error', 'gold', 'green', 'green-strong', 'info', 'ink',
  'ink-muted', 'ink-soft', 'light', 'lime', 'on-blue', 'on-brand', 'on-gold',
  'on-green', 'on-green-strong', 'on-lime', 'on-orange', 'on-pink',
  'on-pink-strong', 'on-red', 'on-teal', 'on-violet', 'orange', 'overlay',
  'paper', 'paper-deep', 'paper-raised', 'pink', 'pink-strong', 'primary',
  'purple', 'red', 'ring', 'secondary', 'success', 'surface',
  'surface-raised', 'surface-sunken', 'teal', 'text', 'text-inverse',
  'text-muted', 'text-subtle', 'violet', 'warning',
])

const DEFAULT_FONT_SIZES = new Set([
  'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl',
])
const CONFIG_FONT_SIZES = new Set(['base', 'body', 'lg', 'sm', 'xl', 'xs'])

const DEFAULT_RADII = new Set([
  'none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full',
])
const CONFIG_RADII = new Set([
  'card', 'input', 'lg', 'md', 'pill', 'sm', 'wobble-lg', 'wobble-md', 'wobble-sm', 'xl',
])

const allowed = {
  color: new Set([...DEFAULT_COLORS, ...CONFIG_COLORS]),
  fontSize: new Set([...DEFAULT_FONT_SIZES, ...CONFIG_FONT_SIZES]),
  radius: new Set([...DEFAULT_RADII, ...CONFIG_RADII]),
}

// (?<![\w-]) so CSS var references like var(--text-subtle) never match
const COLOR_PREFIX =
  /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|via|to|decoration|outline|divide|placeholder)-([a-z][a-z0-9-]*)\b/g
const RADIUS_PREFIX = /(?<![\w-])rounded-([a-z0-9-]+)\b/g

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (/\.tsx?$/.test(entry)) yield full
  }
}

function isScaledOrArbitrary(token: string): boolean {
  return /\d/.test(token) // gray-500, 2xl (contains digit), red-600 …
}

function collectViolations(): string[] {
  const violations: string[] = []
  for (const file of walk(ADMIN_DIR)) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(COLOR_PREFIX)) {
      const key = match[1]
      if (isScaledOrArbitrary(key)) continue
      if (key.startsWith('gradient-to')) continue // bg-gradient-to-* directions
      if (allowed.color.has(key)) continue
      if (allowed.fontSize.has(key)) continue // text-<fontSize-key> in the fontSize family
      violations.push(`${path.relative(repoRoot, file)}: color/text utility -${key} not in tailwind.config.ts`)
    }
    for (const match of source.matchAll(RADIUS_PREFIX)) {
      const key = match[1]
      if (isScaledOrArbitrary(key)) continue
      if (allowed.radius.has(key)) continue
      violations.push(`${path.relative(repoRoot, file)}: rounded-${key} not in tailwind.config.ts`)
    }
  }
  return violations
}

describe('admin classes reference only configured Tailwind keys', () => {
  it('tailwind.config.ts still defines the custom sections this gate pins', () => {
    const config = readFileSync(path.join(repoRoot, 'tailwind.config.ts'), 'utf8')
    expect(config).toContain('colors:')
    expect(config).toContain('borderRadius:')
    expect(config).toContain('fontSize:')
  })

  it('no admin component uses a bare utility key missing from the config', () => {
    const violations = collectViolations()
    expect(violations, violations.join('\n')).toEqual([])
  })
})
