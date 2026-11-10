import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

/**
 * Task 1.7 — opacity-modifier gate.
 *
 * THE DEFECT: Tailwind 3.4 silently drops the opacity modifier when the
 * arbitrary value is a `var()` reference. `text-[var(--ink)]/60` compiles to
 * *nothing* — there is no rule, and the class is a no-op in the browser.
 * `border-[var(--ink)]/20` does not even fall back gracefully: with no rule
 * emitted, the border resolves to Tailwind's preflight grey `#E5E7EB`.
 * `bg-[var(--ink)]/10` produces no background at all. The same is true of the
 * inline-style form `color: 'var(--ink)/60'`, which is invalid CSS and dropped
 * by the browser.
 *
 * THE FIX: `color-mix()` in srgb space. Note the underscores — Tailwind
 * converts `_` back to a space inside arbitrary values, so `in_srgb` and the
 * separator before the percentage MUST be written as `in_srgb` and `_60%`:
 *
 *   text-[var(--ink)]/60            → text-[color-mix(in_srgb,var(--ink)_60%,transparent)]
 *   hover:border-[var(--paper)]/20  → hover:border-[color-mix(in_srgb,var(--paper)_20%,transparent)]
 *   color: 'var(--ink)/60'          → color: 'color-mix(in srgb, var(--ink) 60%, transparent)'
 *
 * WHAT THE HARD GATE PROVES: the *pattern* `var(--x)]/N` (and the bracket-less
 * inline-style form `var(--x)/N`) occurs nowhere in `src/`, comments excluded.
 * Zero matches means no Tailwind class in this tree can silently lose its
 * opacity modifier.
 *
 * WHAT THIS GATE DOES NOT PROVE (do not over-read a green run):
 *   - it does not prove any rewritten class actually compiled into a CSS rule.
 *     A class can be absent from the emitted stylesheet for reasons unrelated
 *     to this pattern (wrong variant spelling, a typo in the utility name, a
 *     token that is itself undefined). The compiled-CSS count in the task
 *     report carries that claim, not this test;
 *   - it does not prove the chosen opacity percentage is the one a designer
 *     would pick — the rewrite is deliberately mechanical and preserves the
 *     original number;
 *   - it does not prove the resulting computed colour is accessible.
 * A pass here is a *pattern-absence* check, not a visual or a compilation one.
 *
 * COMMENTS ARE STRIPPED BEFORE MATCHING. `src/components/layout/Footer.tsx`
 * documents this very defect in prose ("Tailwind 3.4 emits no rule for
 * `text-[var(--paper)]/75`"); that mention is correct documentation, not an
 * offence. Stripping is done with the TypeScript scanner
 * (`ts.createScanner(..., skipTrivia = false)`), which yields every
 * `SingleLineCommentTrivia` / `MultiLineCommentTrivia` range in the file —
 * including comments inside JSX expression containers and template literals,
 * which a naive `//`-to-end-of-line regex would get wrong. The ranges are then
 * blanked (newlines preserved, so reported line numbers still refer to the
 * real file). On this tree the scanner's comment set was cross-checked against
 * an AST walk using `ts.getLeadingCommentRanges` / `getTrailingCommentRanges`
 * and the two agreed exactly.
 */

const repoRoot = process.cwd()

/** Recursively collect every `.ts` / `.tsx` file under `src/`. */
function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectSourceFiles(full, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

/**
 * Byte ranges of every comment in `text`, from the TypeScript scanner.
 * `skipTrivia = false` is what makes the scanner return comments as tokens
 * instead of skipping over them.
 */
function commentRanges(text: string): Array<[number, number]> {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text)
  const ranges: Array<[number, number]> = []
  let token = scanner.scan()
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    if (
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      ranges.push([scanner.getTokenStart(), scanner.getTextPos()])
    }
    token = scanner.scan()
  }
  return ranges
}

/** Replace comment bytes with spaces, preserving newlines and offsets. */
export function stripComments(text: string): string {
  const ranges = commentRanges(text).sort((a, b) => a[0] - b[0])
  if (ranges.length === 0) return text

  let out = ''
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start < cursor) continue // overlapping range; already blanked
    out += text.slice(cursor, start)
    out += text.slice(start, end).replace(/[^\n]/g, ' ')
    cursor = end
  }
  return out + text.slice(cursor)
}

/**
 * The offence pattern. The closing bracket is optional so the same pattern
 * catches both the Tailwind arbitrary-value form (`var(--ink)]/60`) and the
 * inline-style form (`color: 'var(--ink)/60'`). Whitespace is tolerated around
 * the slash so a future `var(--ink) / 60` is not missed.
 */
const OPACITY_MODIFIER = /var\(\s*(--[a-z0-9-]+)\)\]?\s*\/\s*\d+/g

interface Offence {
  file: string
  line: number
  text: string
  token: string
}

/** Every opacity-modified `var()` in `src/`, comments excluded. */
function findOffences(): Offence[] {
  const offences: Offence[] = []
  for (const file of collectSourceFiles(path.join(repoRoot, 'src'))) {
    const source = readFileSync(file, 'utf8')
    const stripped = stripComments(source)
    for (const match of stripped.matchAll(OPACITY_MODIFIER)) {
      const line = stripped.slice(0, match.index).split('\n').length
      offences.push({
        file: path.relative(repoRoot, file),
        line,
        text: stripped.split('\n')[line - 1]?.trim() ?? '',
        token: match[1],
      })
    }
  }
  return offences.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
}

const offences = findOffences()

describe('tailwind opacity modifiers', () => {
  it('emits no opacity-modified var() arbitrary values', () => {
    if (offences.length > 0) {
      // Printed, not just counted: the fix is mechanical, and the list is what
      // makes a regression reviewable.
      console.log(
        `\n${offences.length} opacity-modified var() occurrence(s):\n` +
          offences.map((o) => `  ${o.file}:${o.line}  ${o.text}`).join('\n'),
      )
    }
    expect(
      offences.map((o) => `${o.file}:${o.line}`),
      `opacity-modified var() is dropped by Tailwind 3.4; use color-mix instead:\n${offences
        .map((o) => `  ${o.file}:${o.line}  ${o.token}`)
        .join('\n')}`,
    ).toEqual([])
  })

  /**
   * The rewrite is only sound if the token it mixes is one that actually
   * resolves. A `color-mix` over an undefined token is the same class of bug
   * one layer down: the declaration is invalid at computed-value time and is
   * dropped. This asserts the rewritten classes reference defined tokens.
   *
   * It does not require the token to be defined *outside* `@media` — a
   * media-only token is inert at normal contrast, which is a separate defect
   * owned by the per-page rebuild and reported below, not here.
   */
  it('resolves every token referenced by a rewritten color-mix class', () => {
    const css = readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8')
    const defined = new Set<string>()
    for (const match of css.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)) defined.add(`--${match[1]}`)

    const used = new Map<string, number>()
    for (const file of collectSourceFiles(path.join(repoRoot, 'src'))) {
      const stripped = stripComments(readFileSync(file, 'utf8'))
      for (const match of stripped.matchAll(
        /color-mix\(\s*in_srgb\s*,\s*var\(\s*(--[a-z0-9-]+)\)/g,
      )) {
        used.set(match[1], (used.get(match[1]) ?? 0) + 1)
      }
    }

    const undefinedTokens = [...used.keys()].filter((name) => !defined.has(name)).sort()
    if (used.size > 0) {
      console.log(
        `\ntokens consumed by color-mix classes:\n` +
          [...used.entries()].map(([name, n]) => `  ${name} × ${n}`).join('\n'),
      )
    }
    expect(
      undefinedTokens,
      `color-mix over an undefined token is dropped at computed-value time:\n${undefinedTokens
        .map((name) => `  ${name}`)
        .join('\n')}`,
    ).toEqual([])
  })
})
