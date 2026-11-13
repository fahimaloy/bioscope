/**
 * Token → hex resolution at the canvas boundary.
 *
 * `fabric` cannot parse CSS custom properties: a `var(--…)` fill reaches
 * `_tryParsingColor`, fails, and renders opaque black. The builder therefore
 * resolves token-valued colours to a real hex string before handing them to the
 * canvas.
 *
 * This mirrors the private helper in `@/components/ui/ColorPicker` (the one
 * primitive that already had the same problem). It is a module-local copy
 * rather than an export from the primitive barrel: that barrel's key list is a
 * pinned API surface (`UI_PRIMITIVE_EXPORTS`, asserted by
 * `tests/unit/components/primitives.test.tsx`), and this task owns only the
 * builder files.
 */

/** Resolves a hex literal or a single `var(--…)` token to a hex string. */
export function resolveHex(color: string): string | null {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return color
  const match = color.match(/^var\((--[a-z0-9-]+)\)$/)
  if (!match || typeof window === 'undefined') return null
  const declared = window
    .getComputedStyle(window.document.documentElement)
    .getPropertyValue(match[1])
    .trim()
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(declared) ? declared : null
}

/**
 * The fill handed to fabric for a layer.
 *
 * `fallbackToken` is the design token for "no colour chosen yet" — `--brand`
 * for shapes, `--ink` for text. When the token cannot be resolved (jsdom, or a
 * token the theme does not define) the original string is passed through, which
 * is exactly what `ColorPicker` does and what fabric's own parser would do.
 */
export function resolveCanvasFill(fill: string | undefined, fallbackToken: string): string {
  const candidate = fill || fallbackToken
  return resolveHex(candidate) ?? candidate
}
