import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { Wordmark } from '@/components/brand/Wordmark'
import colorTokens from '../../tokens/src/color.json'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'bioscope'

/**
 * The OG route runs in the Node runtime so it can read the logo from disk.
 * Satori rejects relative image URLs, so the mark is inlined as a data URI.
 */
async function getLogoDataUri(): Promise<string> {
  const logo = await readFile(path.join(process.cwd(), 'public', 'images', 'bioscope-logo.png'))
  return `data:image/png;base64,${logo.toString('base64')}`
}

/**
 * Satori cannot resolve `var(--…)`, so the OG route loads the Shrikhand font
 * itself. The Google Fonts CSS API returns WOFF2 to modern user agents, which
 * satori cannot parse, so request the TTF with a legacy user agent. If the
 * network is unavailable the route falls back to satori's default Noto Sans
 * rather than failing the build.
 */
async function getShrikhandFont() {
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Shrikhand&display=swap', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10_000),
    }).then((res) => res.text())
    const blocks = css.match(/@font-face\s*\{[^}]+\}/g) ?? []
    const latin = blocks.find((block) => /U\+0000-00FF/.test(block)) ?? blocks[blocks.length - 1]
    const url = latin?.match(/url\((https:[^)]+)\)/)?.[1]
    if (!url) return undefined

    const data = await fetch(url, { signal: AbortSignal.timeout(10_000) }).then((res) =>
      res.arrayBuffer()
    )
    return { data, name: 'Shrikhand', weight: 400 as const, style: 'normal' as const }
  } catch {
    return undefined
  }
}

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
      <Wordmark raw size="lg" logoSrc={logoSrc} />
    </div>,
    { ...size, fonts: font ? [font] : undefined }
  )
}
