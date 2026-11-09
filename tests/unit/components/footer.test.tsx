// @vitest-environment jsdom
//
// Task 1.3 — Footer with real destinations.
//
// Pins the brief's contract for `<Footer />`: the 16 real destinations (the 11
// new routes owned by T2.11/T2.12 plus the 5 that already exist), the
// `/cookies` link dropped, an ink surface with paper text, the four columns
// (Shop, Company, Support, Legal), the wordmark, a contact block, and the
// single decor accent (`TornEdge`) capping the top of the ink block.
//
// Also pins docs/DESIGN_CONTRACT.md §1 (token-only colour), §2 (contrast:
// body text on ink is paper/paper-raised, folk accents are decoration),
// §3 (one decor accent per section) and §6 (44px hit targets, visible focus
// ring, semantic landmarks).

import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { Footer } from '@/components/layout/Footer'

/**
 * The brief's authoritative destination list, in column order. `/cookies` is
 * absent on purpose — spec §7.1 lists no cookie page.
 */
const DESTINATIONS = [
  { href: '/shop', label: 'All Stickers', column: 'Shop' },
  { href: '/custom-sticker', label: 'Custom Sticker', column: 'Shop' },
  { href: '/about', label: 'About', column: 'Company' },
  { href: '/blog', label: 'Blog', column: 'Company' },
  { href: '/careers', label: 'Careers', column: 'Company' },
  { href: '/press', label: 'Press Kit', column: 'Company' },
  { href: '/affiliates', label: 'Affiliates', column: 'Company' },
  { href: '/faq', label: 'FAQ', column: 'Support' },
  { href: '/shipping', label: 'Shipping', column: 'Support' },
  { href: '/returns', label: 'Returns', column: 'Support' },
  { href: '/track-order', label: 'Track Order', column: 'Support' },
  { href: '/orders', label: 'My Orders', column: 'Support' },
  { href: '/contact', label: 'Contact', column: 'Support' },
  { href: '/privacy', label: 'Privacy Policy', column: 'Legal' },
  { href: '/terms', label: 'Terms of Service', column: 'Legal' },
  { href: '/accessibility', label: 'Accessibility', column: 'Legal' },
] as const

/** Utilities the pre-rebuild footer used that the token pipeline never defined. */
const BANNED_SUBSTRINGS = [
  'border-3',
  'border-b-3',
  'rounded-card',
  'rounded-input',
  'shadow-glass',
  'shadow-xs',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shadow-xl',
  'bg-white',
  'bg-primary',
  'text-primary',
  'text-red-500',
  'bg-red-500',
  'border-red-500',
  'var(--surface-card)',
  'var(--border-secondary)',
  'var(--light)',
  'var(--bg-color)',
  'var(--primary)',
  'var(--secondary)',
  'var(--tertiary)',
  'var(--purple)',
  'var(--dark)',
  'backdrop-blur',
  'bg-gradient-to-r',
  'bg-gradient-to-b',
  'linear-gradient',
]

/** Raw hex / rgb() literals — contract §1. */
const BANNED_PATTERN = /(#(?:[0-9a-fA-F]{3,8})\b|rgba?\()/i

/** Every class token in the rendered tree. */
function renderedClasses(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[class]')).flatMap((el) =>
    (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
  )
}

/** Every `href` in the rendered tree. */
function renderedHrefs(container: HTMLElement): Array<string | null> {
  return Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'))
}

// next/link is mocked so the component tree mounts outside the App Router (the
// tests pin rendering, not routing).
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('Footer', () => {
  it('renders the wordmark and links all 16 real destinations', () => {
    render(<Footer />)

    // The lockup: the mark image plus the accessible brand name on its link.
    // The old assertion passed on the sr-only text node alone; the link's
    // accessible name pins the lockup link itself.
    expect(screen.getByRole('img', { name: 'bioscope' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'bioscope — home' })).toBeInTheDocument()

    for (const { href, label } of DESTINATIONS) {
      const link = screen.getByRole('link', { name: label })
      expect(link.getAttribute('href'), `${label} resolves to ${href}`).toBe(href)
    }
  })

  it('drops the /cookies destination — spec §7.1 has no cookie page', () => {
    const { container } = render(<Footer />)

    expect(renderedHrefs(container)).not.toContain('/cookies')
    expect(screen.queryByRole('link', { name: /cookie/i })).toBeNull()
  })

  it('is an ink surface with paper text (Ruling 2)', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    const classes = footer.getAttribute('class') ?? ''

    expect(classes).toContain('bg-[var(--ink)]')
    expect(classes).toContain('text-[var(--paper)]')
    expect(classes).not.toContain('bg-[var(--bg-color)]')
    expect(classes).not.toContain('text-[var(--ink)]')
  })

  it('renders the Shop, Company, Support and Legal columns', () => {
    render(<Footer />)

    for (const column of ['Shop', 'Company', 'Support', 'Legal']) {
      const nav = screen.getByRole('navigation', { name: column })
      expect(nav, `${column} column is a labelled landmark`).toBeInTheDocument()
      expect(within(nav).getAllByRole('link').length).toBeGreaterThan(0)
    }

    // Every destination sits in the column the brief assigns it to.
    for (const { href, label, column } of DESTINATIONS) {
      const nav = screen.getByRole('navigation', { name: column })
      const link = within(nav).getByRole('link', { name: label })
      expect(link.getAttribute('href'), `${label} is in ${column}`).toBe(href)
    }
  })

  it('renders a contact block with a mailto, a tel and a map link', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: /hello@bioscope\.shop/ })).toHaveAttribute(
      'href',
      'mailto:hello@bioscope.shop'
    )
    expect(screen.getByRole('link', { name: /\+880/ })).toHaveAttribute(
      'href',
      'tel:+8801700000000'
    )
    expect(screen.getByRole('link', { name: /Dhaka/ })).toHaveAttribute(
      'href',
      'https://maps.google.com/?q=Dhaka,Bangladesh'
    )
  })

  it('caps the ink block with a single TornEdge at the very top', () => {
    const { container } = render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    const tear = footer.firstElementChild
    expect(tear?.tagName, 'the tear is the first child of the footer').toBe('svg')
    expect(tear?.getAttribute('viewBox')).toBe('0 0 100 12')
    expect(tear?.getAttribute('aria-hidden')).toBe('true')
    // The tear is cut from the paper page above, so the ink block's top edge
    // reads as torn (TornEdge's own `color` doc: "paper colour the tear is cut
    // from").
    expect(tear?.getAttribute('class')).toContain('text-[var(--paper)]')

    expect(container.querySelectorAll('svg[viewBox="0 0 100 12"]')).toHaveLength(1)
  })

  it('drops the non-functional newsletter form (Ruling 3)', () => {
    const { container } = render(<Footer />)

    expect(container.querySelector('form')).toBeNull()
    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('[name="footer-email"]')).toBeNull()
    expect(screen.queryByRole('heading', { name: /newsletter/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull()
    expect(screen.queryByText(/subscribe/i)).toBeNull()

    // The legacy handler was `console.log` + a TODO; no backend exists. The
    // rendered tree proves the form and its copy are gone; the source scan is
    // kept only as a backstop for the handler, which leaves no rendered trace.
    const source = readFileSync('src/components/layout/Footer.tsx', 'utf8')
    expect(source).not.toContain('console.log')
  })

  it('does not import the deprecated DoodleElements shim (Ruling 5)', () => {
    const { container } = render(<Footer />)

    // Rendered tree: the shim's DoodleShape/DoodleScribble/DoodleStar all draw
    // organic SVGs, while the footer legitimately renders only the TornEdge
    // (0 0 100 12) and the 24×24 lucide contact icons.
    const svgs = Array.from(container.querySelectorAll('svg'))
    expect(svgs.length).toBeGreaterThan(0)
    for (const svg of svgs) {
      expect(['0 0 100 12', '0 0 24 24']).toContain(svg.getAttribute('viewBox'))
    }

    // Backstop: the shim is never imported.
    const source = readFileSync('src/components/layout/Footer.tsx', 'utf8')
    expect(source).not.toContain('DoodleElements')
    expect(source).not.toContain('DoodleShape')
    expect(source).not.toContain('DoodleBackground')
  })

  it('uses no banned utility, undefined token, raw colour or gradient', () => {
    const { container } = render(<Footer />)

    const offenders = renderedClasses(container).filter(
      (cls) => BANNED_SUBSTRINGS.some((b) => cls.includes(b)) || BANNED_PATTERN.test(cls)
    )
    expect(offenders).toEqual([])
  })

  it('gives every interactive element a focus-visible rule', () => {
    const { container } = render(<Footer />)

    const anchors = Array.from(container.querySelectorAll('a'))
    expect(anchors.length).toBeGreaterThan(DESTINATIONS.length)
    for (const a of anchors) {
      expect(
        a.getAttribute('class') ?? '',
        `${a.getAttribute('href')} carries a focus-visible rule`
      ).toContain('focus-visible:')
    }
  })

  it('keeps every destination link at a 44px hit target', () => {
    render(<Footer />)

    for (const { href, label } of DESTINATIONS) {
      const link = screen.getByRole('link', { name: label })
      expect(link.getAttribute('class') ?? '', `${label} is a 44px target`).toContain('min-h-[44px]')
      expect(link.getAttribute('href')).toBe(href)
    }
  })

  it('uses no folk accent as text on the ink surface — body text is paper (Ruling 6)', () => {
    const { container } = render(<Footer />)

    // The wordmark's two "o" glyphs carry pink/violet as display type, which
    // contract §2 permits. Nothing else may use an accent as text on ink.
    const wordmarkRoot = container.querySelector('span.sr-only')?.parentElement
    expect(wordmarkRoot, 'the wordmark renders its sr-only label').not.toBeNull()

    const ACCENT_TEXT =
      /text-\[var\(--(pink|pink-strong|violet|orange|lime|teal|blue|gold|red|green|green-strong)\)\]/
    const accentTextElements = Array.from(container.querySelectorAll('[class]')).filter((el) =>
      ACCENT_TEXT.test(el.getAttribute('class') ?? '')
    )

    expect(accentTextElements.length).toBeGreaterThan(0)
    for (const el of accentTextElements) {
      expect(wordmarkRoot!.contains(el), 'accent text is confined to the wordmark').toBe(true)
    }
  })

  it('renders the social links as labelled external links', () => {
    render(<Footer />)

    for (const label of ['Facebook', 'Instagram', 'Twitter', 'LinkedIn']) {
      const link = screen.getByRole('link', { name: label })
      expect(link.getAttribute('href'), `${label} is an external url`).toMatch(/^https:\/\//)
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })
})
