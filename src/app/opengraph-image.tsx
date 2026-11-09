import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { Wordmark } from '@/components/brand/Wordmark'
import colorTokens from '../../tokens/src/color.json'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'bioscope'

/**
 * The OG route runs in the Node runtime so it can read both brand assets from
 * disk. Satori rejects relative image URLs, so the mark is inlined as a data
 * URI.
 */
async function getLogoDataUri(): Promise<string> {
  const logo = await readFile(path.join(process.cwd(), 'public', 'images', 'bioscope-logo.png'))
  return `data:image/png;base64,${logo.toString('base64')}`
}

/**
 * Satori cannot resolve `var(--…)`, so the OG route loads Shrikhand itself.
 *
 * The TTF is committed under `src/app/fonts/` (with its SIL OFL licence) and
 * read from disk: the Google Fonts CSS API returns WOFF2 to modern user agents,
 * which satori cannot parse, so a network fetch would mean either a second
 * build-time download or a silent fallback to satori's default Noto Sans — an
 * off-brand OG card with a green build. Reading the checked-in file makes the
 * asset deterministic. A missing file is a real bug, not a network condition,
 * so this throws rather than degrading.
 */
async function getShrikhandFont() {
  const data = await readFile(path.join(process.cwd(), 'src', 'app', 'fonts', 'Shrikhand-Regular.ttf'))
  return { data, name: 'Shrikhand', weight: 400 as const, style: 'normal' as const }
}

/**
 * `lg` measures ~301px wide on the 1200px canvas. Scaling the lockup (rather
 * than adding a `size` variant) keeps the `Wordmark` API at three sizes while
 * filling the social card. `transform` is applied about the centre, so the
 * flex-centred lockup stays centred.
 */
const OG_LOCKUP_SCALE = 2.4

export default async function OpengraphImage() {
  const [logoSrc, font] = await Promise.all([getLogoDataUri(), getShrikhandFont()])

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: colorTokens.paper.$value,
      }}
    >
      <div style={{ display: 'flex', transform: `scale(${OG_LOCKUP_SCALE})` }}>
        <Wordmark raw size="lg" logoSrc={logoSrc} />
      </div>
    </div>,
    { ...size, fonts: [font] }
  )
}
