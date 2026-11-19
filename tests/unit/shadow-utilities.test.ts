import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Shadow utility regression gate (2026-11-19).
 *
 * `shadow-[var(--shadow-*)]` is type-ambiguous to Tailwind v3: it compiles to
 * `--tw-shadow-color` with NO box-shadow, so every element using it renders
 * flat (this silently affected all 231 Buttons plus cards and builder panels).
 * The sanctioned form is the mapped theme utility: shadow-ink-1…4 /
 * shadow-die-cut (see tailwind.config.ts boxShadow). This gate bans the
 * ambiguous arbitrary-value form across src/.
 */

const repoRoot = process.cwd()
const SRC_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (SRC_EXTENSIONS.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

describe('shadow utilities', () => {
  it('no source file uses the ambiguous shadow-[var(...)] form', () => {
    const offenders: string[] = []
    for (const file of walk(path.join(repoRoot, 'src'))) {
      const text = readFileSync(file, 'utf8')
      const matches = text.match(/shadow-\[var\(/g)
      if (matches) offenders.push(`${path.relative(repoRoot, file)} (${matches.length})`)
    }
    expect(offenders).toEqual([])
  })

  it('the named shadow utilities exist in the Tailwind theme', () => {
    const config = readFileSync(path.join(repoRoot, 'tailwind.config.ts'), 'utf8')
    for (const key of ['ink-1', 'ink-2', 'ink-3', 'ink-4', 'die-cut']) {
      expect(config).toContain(`'${key}': 'var(--shadow-${key})'`)
    }
  })
})
