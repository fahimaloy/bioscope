import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

/**
 * Task 1.7 fix round 2 — text-contrast gate.
 *
 * THE DEFECT: Task 1.7 made the legacy opacity numbers real. `text-[var(--ink)]/50`
 * had been a silent no-op (full-strength ink, 15.31:1 on paper); after the rewrite it
 * rendered at 50% ink on paper = 3.21:1, below WCAG AA (4.5:1). The same held for
 * /60 (4.34:1), /40 (2.44:1), /30 (1.90:1) and /20 (1.51:1). The design contract §2
 * bans ad-hoc `--ink` opacity for text for exactly this reason.
 *
 * THE FIX: map the ladder onto the design system's text roles.
 *   /20 /30 /40 /50 → --text-subtle (--ink-muted, 4.72:1 on --paper)
 *   /60             → --text-muted  (--ink-soft,  9.73:1 on --paper)
 *   /70 /80         → left as-is (5.95:1 / 8.35:1, already compliant)
 * Non-ink colour-mix text (--error 70%, --accent 30%/60%) was mapped onto the same
 * roles; --paper 60%/75% was measured on its real surface (--ink) and left because it
 * already clears AA.
 *
 * WHAT THIS GATE PROVES:
 *   1. no `text-[color-mix(in_srgb,var(--ink)_N%,transparent)]` with N ≤ 60 remains in
 *      `src/` (comments excluded) — the sub-AA ladder is gone;
 *   2. the three text roles clear AA on both contract surfaces (--paper and
 *      --paper-raised), computed from the token values in globals.css;
 *   3. every remaining `text-[color-mix(...)]` utility is an explicitly allowlisted
 *      non-ink exception, and that exception clears AA against its documented
 *      background.
 *
 * WHAT THIS GATE DOES NOT PROVE (do not over-read a green run):
 *   - it does not audit every `text-[var(--token)]` utility against the surface it
 *     actually sits on. A full per-site contrast gate needs a per-site background map,
 *     because the same token can sit on --paper, --paper-raised, --ink, or a tinted
 *     alert; the task report proposes that shape and explains why it is not shipped.
 *   - it does not judge decorative/icon `text-*` classes (DoodleStar, TornEdge, chart
 *     tooltip labels), which are not body text and are out of scope.
 *   - it does not prove the mapped classes compiled into CSS rules; the compiled-CSS
 *     count in the task report carries that claim.
 *
 * COMMENTS ARE STRIPPED before matching, using the same TypeScript-scanner approach
 * as tests/unit/tailwind-opacity.test.ts, so prose that documents the old pattern is
 * not an offence.
 */

const repoRoot = process.cwd()

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectSourceFiles(full, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

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
function stripComments(text: string): string {
  const ranges = commentRanges(text).sort((a, b) => a[0] - b[0])
  if (ranges.length === 0) return text
  let out = ''
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start < cursor) continue
    out += text.slice(cursor, start)
    out += text.slice(start, end).replace(/[^\n]/g, ' ')
    cursor = end
  }
  return out + text.slice(cursor)
}

/* ------------------------------------------------------------------ */
/* WCAG contrast (same math as tests/unit/design-tokens.test.ts)        */
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

function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground)
  const l2 = relativeLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** srgb `color-mix(in srgb, fg N%, transparent)` composited over `bg`. */
function mixOver(foreground: string, background: string, percent: number): string {
  const [fr, fg, fb] = hexToRgb(foreground)
  const [br, bg, bb] = hexToRgb(background)
  const p = percent / 100
  const channel = (f: number, b: number) => Math.round(f * p + b * (1 - p))
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(channel(fr, br))}${toHex(channel(fg, bg))}${toHex(channel(fb, bb))}`
}

/* ------------------------------------------------------------------ */
/* Token resolution from globals.css                                    */
/* ------------------------------------------------------------------ */

const css = readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8')

/** Every `--name: value;` declaration, comments excluded. */
function tokenDeclarations(source: string): Map<string, string> {
  const declarations = new Map<string, string>()
  const pattern = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    declarations.set(`--${match[1]}`, match[2].trim())
  }
  return declarations
}

const DECLARATIONS = tokenDeclarations(stripComments(css))

/** Resolve a token to a hex value, following `var(--…)` aliases. */
function resolveHex(token: string, seen: Set<string> = new Set()): string | null {
  if (seen.has(token)) return null
  seen.add(token)
  const value = DECLARATIONS.get(token)
  if (value === undefined) return null
  const alias = /^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)$/.exec(value)
  if (alias) return resolveHex(alias[1], seen)
  return /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : null
}

/* ------------------------------------------------------------------ */
/* Enumerate text arbitrary-value utilities                            */
/* ------------------------------------------------------------------ */

interface TextUtility {
  file: string
  line: number
  /** The full utility, e.g. `group-hover:text-[var(--text-subtle)]`. */
  utility: string
  /** The token name for `text-[var(--x)]`, otherwise null. */
  token: string | null
  /** The token + percent for `text-[color-mix(in_srgb,var(--x)_N%,transparent)]`. */
  mix: { token: string; percent: number } | null
}

function collectTextUtilities(): TextUtility[] {
  const utilities: TextUtility[] = []
  const pattern = /([a-zA-Z0-9:_-]*?)text-\[([^\]]+)\]/g
  for (const file of collectSourceFiles(path.join(repoRoot, 'src'))) {
    const stripped = stripComments(readFileSync(file, 'utf8'))
    let match: RegExpExecArray | null
    while ((match = pattern.exec(stripped)) !== null) {
      const value = match[2]
      const line = stripped.slice(0, match.index).split('\n').length
      const tokenMatch = /^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)$/.exec(value)
      const mixMatch = /^color-mix\(in_srgb\s*,\s*var\(\s*(--[a-zA-Z0-9_-]+)\s*\)_(\d+)%\s*,\s*transparent\)$/.exec(value)
      utilities.push({
        file: path.relative(repoRoot, file),
        line,
        utility: match[0],
        token: tokenMatch ? tokenMatch[1] : null,
        mix: mixMatch ? { token: mixMatch[1], percent: Number(mixMatch[2]) } : null,
      })
    }
  }
  return utilities
}

const textUtilities = collectTextUtilities()

/**
 * The only `text-[color-mix(...)]` forms permitted to remain, each paired with the
 * surface it is documented to sit on and the AA bar it must clear. Anything else is
 * an ad-hoc text opacity the contract bans.
 *
 *   --ink 70% / 80%  → on --paper (left as-is by the controller: already compliant)
 *   --paper 60% / 75% → on --ink (footer + CTA; inverse text, compliant)
 */
const ALLOWED_TEXT_MIX: Array<{ token: string; percent: number; background: string }> = [
  { token: '--ink', percent: 70, background: '--paper' },
  { token: '--ink', percent: 80, background: '--paper' },
  { token: '--paper', percent: 60, background: '--ink' },
  { token: '--paper', percent: 75, background: '--ink' },
]

describe('text contrast', () => {
  it('leaves no sub-AA ink-opacity text utility in src/', () => {
    const offences = textUtilities.filter(
      (u) => u.mix?.token === '--ink' && u.mix.percent <= 60,
    )
    if (offences.length > 0) {
      console.log(
        `\n${offences.length} sub-AA ink-opacity text utility occurrence(s):\n` +
          offences.map((o) => `  ${o.file}:${o.line}  ${o.utility}`).join('\n'),
      )
    }
    expect(
      offences.map((o) => `${o.file}:${o.line}`),
      `ad-hoc --ink opacity below 70% is banned for text (contract §2):\n${offences
        .map((o) => `  ${o.file}:${o.line}  ${o.mix?.percent}%`)
        .join('\n')}`,
    ).toEqual([])
  })

  it('clears WCAG AA for the three text roles on both contract surfaces', () => {
    const roles = [
      { token: '--text', surface: '--paper' },
      { token: '--text', surface: '--paper-raised' },
      { token: '--text-muted', surface: '--paper' },
      { token: '--text-muted', surface: '--paper-raised' },
      { token: '--text-subtle', surface: '--paper' },
      { token: '--text-subtle', surface: '--paper-raised' },
    ]
    for (const { token, surface } of roles) {
      const foreground = resolveHex(token)
      const background = resolveHex(surface)
      expect(foreground, `${token} resolves to a hex`).toBeTruthy()
      expect(background, `${surface} resolves to a hex`).toBeTruthy()
      const ratio = contrastRatio(foreground!, background!)
      console.log(`  ${token} on ${surface}: ${ratio.toFixed(2)}:1`)
      expect(ratio, `${token} on ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('restricts remaining text color-mix utilities to the allowlisted AA exceptions', () => {
    const remaining = textUtilities.filter((u) => u.mix !== null)
    const unexpected = remaining.filter(
      (u) =>
        !ALLOWED_TEXT_MIX.some(
          (a) => a.token === u.mix!.token && a.percent === u.mix!.percent,
        ),
    )
    if (remaining.length > 0) {
      const counts = new Map<string, number>()
      for (const u of remaining) {
        const key = `${u.mix!.token} ${u.mix!.percent}%`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      console.log(
        `\nremaining text color-mix utilities:\n` +
          [...counts.entries()].map(([k, n]) => `  ${k} × ${n}`).join('\n'),
      )
    }
    expect(
      unexpected.map((u) => `${u.file}:${u.line} ${u.utility}`),
      `text colour must come from the text roles, not an ad-hoc opacity:\n${unexpected
        .map((u) => `  ${u.file}:${u.line}  ${u.mix?.token} ${u.mix?.percent}%`)
        .join('\n')}`,
    ).toEqual([])

    // The allowlisted exceptions must actually clear AA on their documented surface.
    for (const allowed of ALLOWED_TEXT_MIX) {
      const foreground = resolveHex(allowed.token)
      const background = resolveHex(allowed.background)
      expect(foreground, `${allowed.token} resolves`).toBeTruthy()
      expect(background, `${allowed.background} resolves`).toBeTruthy()
      const composite = mixOver(foreground!, background!, allowed.percent)
      const ratio = contrastRatio(composite, background!)
      console.log(
        `  ${allowed.token} ${allowed.percent}% on ${allowed.background}: ${ratio.toFixed(2)}:1`,
      )
      expect(
        ratio,
        `${allowed.token} ${allowed.percent}% on ${allowed.background}`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})
