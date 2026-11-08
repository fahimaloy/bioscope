/**
 * Style Dictionary configuration — DTCG tokens → CSS variables + typed TS map.
 *
 * Two targets:
 *   - css: the `:root` block that scripts/splice-tokens.mjs splices into
 *     src/app/globals.css between the marked region.
 *   - ts:  src/lib/design-tokens.ts, the typed token map consumed by the UI.
 *
 * The tokens are authored flat (no CTI nesting) so the emitted custom
 * property names match the design spec exactly (--paper, --text-xs, ...).
 * Value transforms are intentionally empty: the custom formats read the
 * original $value so the spec's exact strings (hex case, ms durations,
 * var() references, color-mix) survive verbatim.
 */
const StyleDictionary = require('style-dictionary').default

/** Render one token's original $value as a CSS custom property value. */
function cssValue(token) {
  const raw = token.original.$value

  if (Array.isArray(raw)) {
    return `cubic-bezier(${raw.join(', ')})`
  }

  if (raw !== null && typeof raw === 'object') {
    if (typeof raw.fontSize === 'string') {
      return raw.fontSize
    }
    return JSON.stringify(raw)
  }

  return String(raw).replace(/\{([^}]+)\}/g, (_, ref) => `var(--${ref})`)
}

/** Flat CSS custom property block, e.g. `:root { --paper: #FAF3E3; }`. */
function cssTokensFormat({ dictionary }) {
  const lines = dictionary.allTokens
    .filter((token) => token.$type !== 'spring')
    .map((token) => `  --${token.name}: ${cssValue(token)};`)

  return `:root {\n${lines.join('\n')}\n}\n`
}

/** Typed flat map of every token to its CSS custom property reference. */
function tsTokensFormat({ dictionary }) {
  const entries = dictionary.allTokens
    .filter((token) => token.$type !== 'spring')
    .map((token) => `  ${JSON.stringify(token.name)}: 'var(--${token.name})',`)

  return (
    `export const designTokens = {\n${entries.join('\n')}\n} as const;\n\n` +
    `export type DesignTokens = typeof designTokens;\n`
  )
}

StyleDictionary.registerFormat({ name: 'css/tokens', format: cssTokensFormat })
StyleDictionary.registerFormat({ name: 'ts/tokens', format: tsTokensFormat })

module.exports = {
  source: ['tokens/src/color.json', 'tokens/src/type.json', 'tokens/src/shape.json', 'tokens/src/motion.json'],
  usesDtcg: true,
  platforms: {
    css: {
      transforms: [],
      buildPath: 'tokens/dist/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/tokens',
        },
      ],
    },
    ts: {
      transforms: [],
      buildPath: 'src/lib/',
      files: [
        {
          destination: 'design-tokens.ts',
          format: 'ts/tokens',
        },
      ],
    },
  },
}
