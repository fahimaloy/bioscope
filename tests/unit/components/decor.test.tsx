// @vitest-environment jsdom
//
// Task 0.3 — decor / doodle component set.
//
// Pins the contract from docs/DESIGN_CONTRACT.md §3 and the task brief:
// every decor component renders an `aria-hidden` decorative element, the
// doodles never carry text, `MarqueeRibbon` duplicates its items for a
// seamless loop and pauses on hover, and `DoodleScatter` is deterministic
// and hard-capped at 6 elements per contract §3.

import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import {
  DoodleArrow,
  DoodleHeart,
  DoodleScatter,
  DoodleSparkle,
  DoodleSquiggle,
  DoodleStar,
  GrainOverlay,
  GridPaper,
  MarqueeRibbon,
  SketchUnderline,
  StickerPeel,
  TornEdge,
  WashiTape,
} from '@/components/decorative'

function rootOf(container: HTMLElement): HTMLElement {
  const root = container.firstElementChild
  expect(root, 'the component renders an element').not.toBeNull()
  return root as HTMLElement
}

/** Renders `element` and returns the inline style of every positioned child. */
function childStyles(element: ReactNode): string[] {
  const { container, unmount } = render(element)
  const styles = Array.from(rootOf(container).childNodes).map(
    (node) => (node as HTMLElement).getAttribute('style') ?? '',
  )
  unmount()
  return styles
}

describe('decor set', () => {
  it('renders DoodleStar, WashiTape, MarqueeRibbon and DoodleScatter hidden and text-free', () => {
    const cases: Array<[string, ReactNode]> = [
      ['DoodleStar', <DoodleStar key="star" />],
      ['WashiTape', <WashiTape key="tape" />],
      ['MarqueeRibbon', <MarqueeRibbon key="ribbon" items={[]} />],
      ['DoodleScatter', <DoodleScatter key="scatter" />],
    ]

    for (const [name, element] of cases) {
      const { container, unmount } = render(element)
      const root = rootOf(container)
      expect(root.getAttribute('aria-hidden'), `${name} is aria-hidden`).toBe('true')
      expect(root.textContent, `${name} renders no text`).toBe('')
      unmount()
    }
  })

  it('MarqueeRibbon duplicates its items for a seamless loop and pauses on hover', () => {
    const { container } = render(<MarqueeRibbon items={['VINYL', 'PAPER']} />)
    const band = rootOf(container)

    expect(band.getAttribute('aria-hidden')).toBe('true')

    const track = band.firstElementChild as HTMLElement | null
    expect(track, 'the ribbon animates an inner track').not.toBeNull()
    expect(track!.style.animationName).toBe('marquee-scroll')

    const halves = track!.querySelectorAll('span')
    expect(halves).toHaveLength(4)
    expect(halves[0].textContent).toBe(halves[2].textContent)
    expect(halves[1].textContent).toBe(halves[3].textContent)
    expect(track!.className).toContain('animation-play-state:paused')
  })

  it('DoodleScatter defaults to 6 elements and hard-caps the count at 6', () => {
    const { container, unmount } = render(<DoodleScatter />)
    expect(rootOf(container).childNodes, 'default count is 6').toHaveLength(6)
    unmount()

    const { container: capped } = render(<DoodleScatter count={99} />)
    expect(rootOf(capped).childNodes, 'count is hard-capped at 6').toHaveLength(6)
  })

  it('DoodleScatter positions elements from a deterministic seed', () => {
    const styles = childStyles(<DoodleScatter count={4} seed="bioscope" />)

    expect(styles).toHaveLength(4)
    expect(childStyles(<DoodleScatter count={4} seed="bioscope" />)).toEqual(styles)
    expect(childStyles(<DoodleScatter count={4} seed="other-seed" />)).not.toEqual(styles)

    for (const style of styles) {
      expect(style).toMatch(/left:/)
      expect(style).toMatch(/top:/)
      expect(style).toMatch(/rotate\(/)
    }
  })

  it('hides decoration from assistive tech without hiding meaningful text', () => {
    const decorative: Array<[string, ReactNode]> = [
      ['DoodleStar', <DoodleStar key="s" />],
      ['DoodleHeart', <DoodleHeart key="h" />],
      ['DoodleArrow', <DoodleArrow key="a" />],
      ['DoodleSquiggle', <DoodleSquiggle key="q" />],
      ['DoodleSparkle', <DoodleSparkle key="p" />],
      ['DoodleScatter', <DoodleScatter key="c" />],
      ['WashiTape', <WashiTape key="t" />],
      ['StickerPeel', <StickerPeel key="pe" />],
      ['TornEdge', <TornEdge key="te" />],
      ['MarqueeRibbon', <MarqueeRibbon key="m" items={['NEW']} />],
      ['GrainOverlay', <GrainOverlay key="g" />],
      ['GridPaper', <GridPaper key="gp" />],
    ]

    for (const [name, element] of decorative) {
      const { container, unmount } = render(element)
      expect(rootOf(container).getAttribute('aria-hidden'), name).toBe('true')
      unmount()
    }

    // SketchUnderline wraps a real word: the underline is hidden, the word is not.
    const { container } = render(<SketchUnderline>handmade</SketchUnderline>)
    const root = rootOf(container)
    expect(root.textContent).toBe('handmade')
    expect(root.getAttribute('aria-hidden')).toBeNull()
    expect(root.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
})
