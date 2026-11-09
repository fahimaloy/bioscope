// @vitest-environment jsdom
//
// Task 0.5 — brand assets and wordmark lockup.
//
// Pins the brief's contract for <Wordmark />: it renders the logo image with
// `alt="bioscope"` and the Shrikhand `bioscope` wordmark, and it keeps a
// plain-<img> render path (`raw`) for the OG image runtime where next/image's
// optimizer is unavailable.

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Wordmark } from '@/components/brand/Wordmark'

/** The visible split-letter wordmark (hidden from assistive tech). */
function visibleWordmark(container: HTMLElement): HTMLElement {
  const wordmark = container.querySelector('[aria-hidden="true"]')
  expect(wordmark, 'the visible wordmark is present').not.toBeNull()
  return wordmark as HTMLElement
}

describe('Wordmark', () => {
  it('renders the logo image and the bioscope wordmark', () => {
    render(<Wordmark />)

    expect(screen.getByRole('img', { name: 'bioscope' })).toBeInTheDocument()
    expect(screen.getByText('bioscope')).toBeInTheDocument()
  })

  it('spells bioscope in the visible wordmark', () => {
    const { container } = render(<Wordmark />)

    expect(visibleWordmark(container).textContent).toBe('bioscope')
  })

  it('scales the square logo and the wordmark type with the size prop', () => {
    const cases = [
      { size: 'sm', logo: 28, text: 'text-xl' },
      { size: 'md', logo: 40, text: 'text-3xl' },
      { size: 'lg', logo: 56, text: 'text-5xl' },
    ] as const

    for (const { size, logo, text } of cases) {
      const { container, unmount } = render(<Wordmark size={size} />)
      const img = container.querySelector('img')

      expect(img, `${size} renders the logo`).not.toBeNull()
      expect(img!.getAttribute('width'), `${size} logo width`).toBe(String(logo))
      expect(img!.getAttribute('height'), `${size} logo height`).toBe(String(logo))
      expect(visibleWordmark(container).className, `${size} type scale`).toContain(text)
      unmount()
    }
  })

  it('switches the wordmark colour between the light and dark variants', () => {
    const dark = render(<Wordmark variant="dark" />)
    expect(visibleWordmark(dark.container).className).toContain('text-[var(--ink)]')
    dark.unmount()

    const light = render(<Wordmark variant="light" />)
    expect(visibleWordmark(light.container).className).toContain('text-[var(--paper)]')
    light.unmount()
  })

  it('keeps the two "o" letters on folk accent tokens', () => {
    const { container } = render(<Wordmark />)
    const accents = Array.from(visibleWordmark(container).querySelectorAll('span'))

    expect(accents).toHaveLength(2)
    expect(accents[0].className).toContain('text-[var(--pink)]')
    expect(accents[1].className).toContain('text-[var(--violet)]')
  })

  it('uses no raw colour literal in the browser render path', () => {
    const { container } = render(<Wordmark />)
    const classes = Array.from(container.querySelectorAll('[class]')).flatMap((el) =>
      (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
    )

    expect(classes.filter((cls) => /#(?:[0-9a-f]{3,8})\b/i.test(cls))).toEqual([])
  })

  it('renders a plain img with the same alt and dimensions when raw', () => {
    const logoSrc = 'data:image/png;base64,AAAA'
    const { container } = render(<Wordmark raw logoSrc={logoSrc} />)
    const img = container.querySelector('img')

    expect(img, 'the raw path renders an img').not.toBeNull()
    expect(img!.getAttribute('src')).toBe(logoSrc)
    expect(img!.getAttribute('alt')).toBe('bioscope')
    expect(img!.getAttribute('width')).toBe('40')
    expect(img!.getAttribute('height')).toBe('40')
    expect(img!.getAttribute('srcset')).toBeNull()

    const wordmark = visibleWordmark(container)
    expect(wordmark.style.fontFamily).toBe('Shrikhand')
    // jsdom serialises the literal `--ink` value `#241B12` as rgb().
    expect(wordmark.style.color).toBe('rgb(36, 27, 18)')
  })
})
