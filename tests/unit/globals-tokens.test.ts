import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Task 1.6 — globals.css token-resolution gate.
 *
 * WHAT THIS PROVES: every CSS custom property *referenced* in
 * `src/app/globals.css` is *defined* in that same file, except the three
 * `--font-*` names that `next/font` injects at runtime and therefore never
 * appear in the source. Formally: `references ⊆ definitions ∪ {--font-display,
 * --font-body, --font-hand}`.
 *
 * WHAT THIS DOES NOT PROVE (do not over-read a green run):
 *   - it says nothing about whether a token's *value* is sensible or matches
 *     the design contract;
 *   - it does not show that any class consuming the token is actually rendered
 *     by a route in the current build;
 *   - it does not assert the resulting computed `box-shadow` / `animation`.
 * A pass here is a *resolution* check, not a visual one.
 *
 * Comments are stripped before matching: prose in globals.css legitimately
 * mentions old patterns (e.g. the Footer.tsx:94 note) and must count neither
 * as a reference nor as a definition.
 */

const repoRoot = process.cwd()

/** next/font defines these at runtime; they are never written to globals.css. */
const RUNTIME_INJECTED = new Set(['--font-display', '--font-body', '--font-hand'])

/**
 * Remove CSS block comments while leaving string literals and url() data URIs
 * alone. A plain non-greedy `/\*[\s\S]*?\//` would be fine for this file, but
 * the scanner keeps the gate honest if a comment delimiter ever appears inside
 * a quoted string.
 */
export function stripCssComments(source: string): string {
  let out = ''
  let inString: string | null = null

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    const next = source[i + 1]

    if (inString) {
      out += char
      if (char === '\\') {
        out += next ?? ''
        i += 1
      } else if (char === inString) {
        inString = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      inString = char
      out += char
      continue
    }

    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      i = end === -1 ? source.length : end + 1
      out += ' '
      continue
    }

    out += char
  }

  return out
}

/** Every `--name` that appears as a custom-property declaration. */
export function collectDefinitions(css: string): Set<string> {
  const names = new Set<string>()
  const pattern = /--([a-zA-Z0-9_-]+)\s*:/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(css)) !== null) {
    names.add(`--${match[1]}`)
  }
  return names
}

/** Every `--name` consumed by a `var()` reference, including fallbacks. */
export function collectReferences(css: string): Set<string> {
  const names = new Set<string>()
  const pattern = /var\(\s*(--[a-zA-Z0-9_-]+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(css)) !== null) {
    names.add(match[1])
  }
  return names
}

const css = stripCssComments(
  readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8'),
)
const definitions = collectDefinitions(css)
const references = collectReferences(css)

const undefinedTokens = [...references]
  .filter((name) => !definitions.has(name) && !RUNTIME_INJECTED.has(name))
  .sort()

describe('globals.css token resolution', () => {
  it('defines every custom property referenced in globals.css', () => {
    expect(
      undefinedTokens,
      `tokens referenced but never defined:\n${undefinedTokens
        .map((token) => `  ${token}`)
        .join('\n')}`,
    ).toEqual([])
  })

  /**
   * Pins the controller mapping from the Task 1.6 brief. This is a
   * documentation assertion, not a new rule: it records which existing token
   * each legacy utility was remapped onto, so a later edit cannot silently
   * re-point a class at a different elevation.
   */
  it('remaps the legacy utility tokens onto the existing shadow scale', () => {
    const expected: Record<string, string> = {
      '--shadow-card': '--shadow-ink-2',
      '--shadow-card-hover': '--shadow-ink-3',
      '--shadow-stat': '--shadow-ink-2',
      '--shadow-btn': '--shadow-ink-2',
      '--shadow-btn-hover': '--shadow-ink-3',
      '--shadow-btn-active': '--shadow-ink-1',
      '--shadow-input': '--shadow-ink-1',
      // Contract §5: no gradients, no glass — the blurred treatment is dead,
      // so the strongest elevation is a hard ink offset.
      '--shadow-glass': '--shadow-ink-4',
      // Used as the easing argument of `animation:`, not a duration.
      '--transition-base': '--ease-out',
    }

    for (const [legacy, replacement] of Object.entries(expected)) {
      expect(css, `${legacy} should map to ${replacement}`).toContain(
        `var(${replacement})`,
      )
      expect(css, `${legacy} must no longer be referenced`).not.toContain(
        `var(${legacy})`,
      )
    }
  })
})
