/**
 * Splice the Style Dictionary CSS output into the marked region of
 * src/app/globals.css.
 *
 * Run by `pnpm tokens` after `style-dictionary build`. The region between the
 * generated-start and generated-end markers is replaced with the generated
 * :root block; everything outside the markers is untouched.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cssPath = path.join(repoRoot, 'src/app/globals.css')
const tokensPath = path.join(repoRoot, 'tokens/dist/tokens.css')

const START = '/* @tokens-start (generated) */'
const END = '/* @tokens-end */'

const generated = readFileSync(tokensPath, 'utf8').trim()
const css = readFileSync(cssPath, 'utf8')

const startIndex = css.indexOf(START)
const endIndex = css.indexOf(END)

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  console.error('✗ splice-tokens: markers not found in src/app/globals.css')
  console.error('  expected the generated-start and generated-end markers')
  process.exit(1)
}

const next =
  css.slice(0, startIndex + START.length) +
  '\n' +
  generated +
  '\n' +
  css.slice(endIndex)

writeFileSync(cssPath, next)
console.log('✓ splice-tokens: regenerated the token region in src/app/globals.css')
