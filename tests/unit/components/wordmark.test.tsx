// @vitest-environment jsdom
//
// Task 0.5 — brand assets and wordmark lockup.
//
// Pins the brief's contract for <Wordmark />: it renders the logo image with
// `alt="BIOSCOPE"` and the Shrikhand `BIOSCOPE` wordmark, and it keeps a
// plain-<img> render path (`raw`) for the OG image runtime where next/image's
// optimizer is unavailable.

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Wordmark } from '@/components/brand/Wordmark'

/** The visible split-letter wordmark container (hidden from assistive tech). */
function wordmarkContainer(container: HTMLElement): HTMLElement {
  const wm = container.querySelector('[aria-hidden="true"]')
  expect(wm, 'the visible wordmark container is present').not.toBeNull()
  return wm as HTMLElement
}

describe('Wordmark', () => {
  it('renders the logo image and the BIOSCOPE wordmark', () => {
    render(<Wordmark />)

    expect(screen.getByRole('img', { name: 'BIOSCOPE' })).toBeInTheDocument()
    expect(screen.getByText('BIOSCOPE')).toBeInTheDocument()
  })

  it('spells BIOSCOPE in the visible wordmark', () => {
    const { container } = render(<Wordmark />)

    expect(wordmarkContainer(container).textContent).toBe('BIOSCOPE')
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
      // Each letter span should have the correct text size class
      const letters = wordmarkContainer(container).querySelectorAll('span')
      letters.forEach((span) => {
        expect(span.className, `${size} type scale`).toContain(text)
      })
      unmount()
    }
  })

  it('colors each letter with per-letter palette (8 letters)', () => {
    const { container } = render(<Wordmark />)
    const letters = wordmarkContainer(container).querySelectorAll('span')

    expect(letters).toHaveLength(8)
    // Each letter should have a letter-* color token
    const letterColors = Array.from({ length: 8 }, (_, i) => `text-[var(--letter-${i + 1})]`)
    const spans = Array.from(wordmarkContainer(container).querySelectorAll('span'))
    spans.forEach((span, index) => {
      expect(span.className).toContain(letterColors[index])
    })
  })

  it('uses no raw colour literal in the browser render path', () => {
    const { container } = render(<Wordmark />)
    const classes = Array.from(container.querySelectorAll('[class]')).flatMap((el) =>
      (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
    )

    expect(classes.filter((cls) => /#(?:[0-9a-f]{3,8})\b/i.test(cls))).toEqual([])
  })

  it('wires the die-cut halo class onto the mark on the browser path', () => {
    const { container } = render(<Wordmark />)
    const img = container.querySelector('img')

    expect(img, 'the logo is present').not.toBeNull()
    // The halo is a plain rule in globals.css (`.die-cut-mark`), not a Tailwind
    // arbitrary value — a bare multi-function filter string is not generated.
    expect(img!.getAttribute('class')).toContain('die-cut-mark')
  })

  it('applies the same die-cut halo to the mark on the raw path', () => {
    const { container } = render(<Wordmark raw logoSrc="data:image/png;base64,AAAA" />)
    const img = container.querySelector('img')

    expect(img, 'the raw path renders an img').not.toBeNull()
    expect(img!.style.filter).toBe(
      'drop-shadow(1px 1px 0 #241B12) drop-shadow(0 0 1px #FFFFFF)'
    )
  })

  it('renders a plain img with the same alt and dimensions when raw', () => {
    const logoSrc = 'data:image/png;base64,AAAA'
    const { container } = render(<Wordmark raw logoSrc={logoSrc} />)
    const img = container.querySelector('img')

    expect(img, 'the raw path renders an img').not.toBeNull()
    expect(img!.getAttribute('src')).toBe(logoSrc)
    expect(img!.getAttribute('alt')).toBe('BIOSCOPE')
    expect(img!.getAttribute('width')).toBe('40')
    expect(img!.getAttribute('height')).toBe('40')
    expect(img!.getAttribute('srcset')).toBeNull()

    // The raw path renders the wordmark text in a span with aria-hidden="true"
    const wordmark = wordmarkContainer(container)
    expect(wordmark).toBeInTheDocument()
    // jsdom serialises the literal `--ink` value `#241B12` as rgb().
    expect(wordmark.textContent).toBe('BIOSCOPE')
  })
})