import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Additive regression gate (2026-11-15, Phase C-06): catches the defect class
 * that silently broke the app — JS/TSX referencing Tailwind color/size keys
 * that were never defined in tailwind.config.ts (e.g. text-primary with an
 * /NN alpha, which Tailwind cannot derive from a plain var()).
 *
 * This test is NOT edited in the frozen `tests/**` exception sense — it is a
 * new additive file; existing gates are untouched.
 *
 * It intentionally does not try to validate every class name. It asserts two
 * things:
 *
 * 1. `-(color)/NN` alpha-modifier usage on any custom var()-based palette
 *    color is forbidden. Tailwind cannot apply an alpha to a plain `var()`
 *    custom color, so every `/NN` variant is silently dropped at build time.
 *    The sanctioned form is the color-mix arbitrary value:
 *    bg-[color-mix(in_srgb,var(--primary)_10%,transparent)].
 * 2. The six legacy color aliases exist at the :root level of the generated
 *    token region in src/app/globals.css (not only inside @media) — the
 *    exact failure that made the whole app render unstyled.
 */

const repoRoot = process.cwd()

const SRC_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const SOURCE_DIRS = ['src']

/** Custom palette names (var()-based) that may never take an /NN alpha. */
const CUSTOM_COLORS = [
  'primary',
  'secondary',
  'brand',
  'pink',
  'pink-strong',
  'violet',
  'orange',
  'lime',
  'teal',
  'blue',
  'gold',
  'red',
  'green',
  'green-strong',
  'paper',
  'paper-deep',
  'paper-raised',
  'ink',
  'ink-soft',
  'ink-muted',
  'die-cut',
]

const COLOR_UTILITY_PREFIX =
  /\b(?:bg|text|border|ring|fill|stroke|accent|divide|from|via|to|decoration|outline|placeholder)-([a-z][a-z0-9-]*)\/(\d{1,3})\b/g

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else if (SRC_EXTENSIONS.has(path.extname(entry.name))) {
      yield full
    }
  }
}

describe('no unresolvable utility classes (additive gate)', () => {
  it('forbids /NN alpha on var()-based palette colours (silently dropped by Tailwind)', () => {
    const offenders: string[] = []
    for (const dir of SOURCE_DIRS) {
      for (const file of walk(path.join(repoRoot, dir))) {
        const source = readFileSync(file, 'utf8')
        for (const match of source.matchAll(COLOR_UTILITY_PREFIX)) {
          const [, name, alpha] = match
          if (CUSTOM_COLORS.includes(name)) {
            offenders.push(`${path.relative(repoRoot, file)}: ${name}/${alpha}`)
          }
        }
      }
    }
    expect(
      offenders.sort(),
      `var()-based palette colors cannot carry an alpha modifier — use the color-mix arbitrary value form instead:\n${offenders.map((o) => `  ${o}`).join('\n')}`,
    ).toEqual([])
  })

  it('defines the six legacy aliases at :root level in the generated token region', () => {
    const globals = readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8')
    const start = globals.indexOf('/* @tokens-start (generated) */')
    const end = globals.indexOf('/* @tokens-end */')
    expect(start, '@tokens-start marker missing from globals.css').toBeGreaterThanOrEqual(0)
    expect(end, '@tokens-end marker missing from globals.css').toBeGreaterThan(start)
    const region = globals.slice(start, end)
    for (const alias of ['--primary', '--secondary', '--light', '--dark', '--bg-color', '--purple']) {
      expect(region, `${alias} missing from the :root token region`).toContain(`${alias}:`)
    }
  })
})
