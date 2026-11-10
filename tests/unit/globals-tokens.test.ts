import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Task 1.6 — globals.css token-resolution gate.
 *
 * WHAT THE HARD GATE PROVES: every CSS custom property *referenced* in
 * `src/app/globals.css` is *defined* in that same file, except the three
 * `--font-*` names that `next/font` injects at runtime and therefore never
 * appear in the source. Formally: `references ⊆ definitions ∪ {--font-display,
 * --font-body, --font-hand}`. A green hard gate means no declaration in this
 * file can be dropped for referencing a token that exists nowhere.
 *
 * WHAT THE MEDIA-ONLY REPORT REVEALS: the hard gate cannot see *where* a token
 * is defined. A token whose every definition sits inside an `@media` block is
 * "defined" as far as the gate is concerned, yet it does not exist at normal
 * contrast — every declaration consuming it is invalid at computed-value time
 * and is dropped. The second test prints that set (`token → defining line
 * numbers`) on every run. It is informational: it does not fail on media-only
 * tokens. It fails only if a token is defined nowhere at all, which is the one
 * case the report would otherwise hide.
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

/**
 * Same comment removal, but newlines inside a stripped comment are preserved.
 * Needed for the media-only report: line numbers must refer to the real file.
 */
export function stripCssCommentsKeepLines(source: string): string {
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
      const stop = end === -1 ? source.length : end + 1
      for (let j = i; j < stop; j += 1) {
        if (source[j] === '\n') out += '\n'
      }
      i = stop
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

export interface DefinitionSite {
  /** 1-based line in globals.css where the declaration starts. */
  line: number
  /** True when every enclosing block is (or is nested in) an `@media` block. */
  inMedia: boolean
}

/**
 * Collect custom-property declarations with their line number and whether they
 * sit inside an `@media` block. Walks the stylesheet with a block stack so a
 * declaration in `:root` nested in `@media (prefers-contrast: high)` is marked
 * `inMedia`, while the same token declared in a plain `:root` is not.
 */
export function collectDefinitionSites(css: string): Map<string, DefinitionSite[]> {
  const sites = new Map<string, DefinitionSite[]>()
  const stack: string[] = []
  let prelude = ''
  let preludeStartLine = 1
  let line = 1
  let inString: string | null = null

  const record = (): void => {
    const declaration = prelude.trim()
    const match = /^(--[a-zA-Z0-9_-]+)\s*:/.exec(declaration)
    if (match) {
      const name = match[1]
      const inMedia = stack.some((entry) => entry.startsWith('@media'))
      const list = sites.get(name) ?? []
      list.push({ line: preludeStartLine, inMedia })
      sites.set(name, list)
    }
  }

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i]
    const next = css[i + 1]

    if (inString) {
      prelude += char
      if (char === '\\') {
        prelude += next ?? ''
        i += 1
      } else if (char === inString) {
        inString = null
      }
      if (char === '\n') line += 1
      continue
    }

    if (char === '"' || char === "'") {
      inString = char
      prelude += char
      continue
    }

    if (char === '\n') {
      line += 1
      prelude += char
      continue
    }

    if (char === '{') {
      stack.push(prelude.trim())
      prelude = ''
      continue
    }

    if (char === '}' || char === ';') {
      // A declaration may end at `}` without a trailing `;` (last in block).
      record()
      if (char === '}') stack.pop()
      prelude = ''
      continue
    }

    if (prelude.trim() === '' && !/\s/.test(char)) preludeStartLine = line
    prelude += char
  }

  return sites
}

const source = readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8')
const css = stripCssComments(source)
const cssWithLines = stripCssCommentsKeepLines(source)
const definitions = collectDefinitions(css)
const definitionSites = collectDefinitionSites(cssWithLines)
const references = collectReferences(css)

const undefinedTokens = [...references]
  .filter((name) => !definitions.has(name) && !RUNTIME_INJECTED.has(name))
  .sort()

/**
 * Tokens whose every definition is inside an `@media` block. They satisfy the
 * hard gate (the name *is* defined somewhere) but are inert unless the media
 * query matches.
 */
const mediaOnlyTokens = [...definitionSites.entries()]
  .filter(([, sites]) => sites.length > 0 && sites.every((site) => site.inMedia))
  .map(([name, sites]) => ({ name, lines: sites.map((site) => site.line) }))
  .sort((a, b) => a.name.localeCompare(b.name))

function mediaOnlyReport(): string {
  const rows = mediaOnlyTokens.map(
    (token) => `  ${token.name} → lines ${token.lines.join(', ')}`,
  )
  return [
    'tokens defined only inside @media blocks (inert at normal contrast):',
    ...rows,
  ].join('\n')
}

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
   * Informational: prints the media-only set so the placement blind spot is
   * visible on every run. It does not fail on media-only tokens — those are
   * owned by the per-page rebuild. It fails only if a token is defined nowhere
   * at all, because that is the one defect the report would otherwise hide.
   */
  it('reports tokens defined only inside @media blocks', () => {
    const report = mediaOnlyReport()
    console.log(`\n${report}\n`)
    expect(
      undefinedTokens,
      `tokens referenced but never defined:\n${undefinedTokens
        .map((token) => `  ${token}`)
        .join('\n')}\n\n${report}`,
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
