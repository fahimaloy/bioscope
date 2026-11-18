// @vitest-environment jsdom
//
// Task 1.2 — Navbar and MobileNav.
//
// Pins the brief's contract for `<Navbar />`: the lockup, the four nav links
// (Shop, Custom Sticker, About, Contact), a cart control that opens the cart
// drawer, and a mobile menu that is closed initially and opens on the menu
// button. Also pins the rebuild's hard requirements from
// docs/DESIGN_CONTRACT.md §1 (token-only colour), §5 (brand surfaces: paper
// background, 2px ink bottom border, hard offset shadows, no gradients) and §6
// (hit targets ≥ 44px, visible focus ring, semantic landmarks).

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { SessionProvider } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { useCartStore } from '@/lib/stores/cartStore'
import { useUIStore } from '@/lib/stores/uiStore'
import { useAuthStore } from '@/lib/stores/authStore'

/** The brief's four links, in order. `Home` is dropped — the lockup links home. */
const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/custom-sticker', label: 'Custom Sticker' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

/** Utilities the pre-rebuild navbar used that the token pipeline never defined. */
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

/** The mobile menu panel (the element the toggle controls). */
function mobileMenu(container: HTMLElement): HTMLElement | null {
  return container.querySelector('#mobile-menu-panel')
}

/** The four desktop nav link anchors. */
function navAnchors(container: HTMLElement): HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll('a')).filter((a) =>
    NAV_LINKS.some((l) => l.href === a.getAttribute('href'))
  )
}

/** The nav chrome renders inside the app's SessionProvider. */
function renderNavbar(ui: React.ReactNode) {
  return render(<SessionProvider>{ui}</SessionProvider>)
}

// next/link and next/navigation are mocked so the component tree mounts
// outside the App Router (the tests pin rendering, not routing).
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

beforeEach(() => {
  act(() => {
    useCartStore.setState({ items: [], isOpen: false, itemCount: 0, subtotal: 0 })
    useUIStore.setState({ mobileMenuOpen: false })
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false })
  })
  window.localStorage.clear()
})

describe('Navbar', () => {
  it('renders the lockup, the four nav links, and the cart control', () => {
    const { container } = renderNavbar(<Navbar />)

    // The lockup: the mark image and the accessible brand name (Wordmark
    // renders the split-letter wordmark as one visible text node).
    expect(screen.getByRole('img', { name: 'BIOSCOPE' })).toBeInTheDocument()
    expect(screen.getByText('BIOSCOPE')).toBeInTheDocument()

    for (const { href, label } of NAV_LINKS) {
      const link = screen.getByRole('link', { name: label })
      expect(link.getAttribute('href'), `${label} resolves to ${href}`).toBe(href)
    }

    // The cart control only renders for a signed-in visitor; assert its
    // absence in the logged-out state. (Its presence and count are pinned by
    // the dedicated cart test below, which renders signed-in.)
    const cartButtons = () =>
      Array.from(container.querySelectorAll('button')).filter((b) =>
        /shopping cart/i.test(b.getAttribute('aria-label') ?? '')
      )
    expect(cartButtons(), 'the logged-out bar has no cart control').toHaveLength(0)
  })

  it('drops the legacy Home link — the lockup already links home', () => {
    renderNavbar(<Navbar />)

    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()
  })

  it('keeps the four links on the desktop surface and the menu button for mobile', () => {
    const { container } = renderNavbar(<Navbar />)

    expect(navAnchors(container)).toHaveLength(NAV_LINKS.length)

    const toggle = screen.getByRole('button', { name: /open menu/i })
    expect(toggle.getAttribute('aria-controls')).toBe('mobile-menu-panel')
    expect(toggle.className).toMatch(/lg:hidden/)
  })

  it('shows the desktop nav only from the lg breakpoint — the md band must not overflow the 64px bar', () => {
    const { container } = renderNavbar(<Navbar />)

    // The desktop surface is the element that wraps the desktop link list.
    const desktopList = container.querySelector('nav ul')
    expect(desktopList).not.toBeNull()
    const desktopSurface = desktopList!.parentElement!
    const classes = desktopSurface.getAttribute('class') ?? ''

    expect(classes, 'desktop nav is hidden below lg').toContain('lg:flex')
    expect(classes, 'desktop nav must not appear at md — the lockup + pills + auth do not fit').not.toContain('md:flex')

    const toggle = screen.getByRole('button', { name: /open menu/i })
    expect(toggle.className).toMatch(/lg:hidden/)
    expect(toggle.className).not.toMatch(/md:hidden/)
  })

  it('hides the mobile menu panel from the lg breakpoint up', () => {
    const { container } = renderNavbar(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const panel = mobileMenu(container)
    expect(panel).not.toBeNull()
    expect(panel!.className).toMatch(/lg:hidden/)
    expect(panel!.className).not.toMatch(/md:hidden/)
  })

  it('reveals the account menu on keyboard focus and reports its expanded state', () => {
    act(() => {
      useAuthStore.setState({ user: { role: 'CUSTOMER', name: 'Ada' } as never, isAuthenticated: true })
    })
    const { container } = renderNavbar(<Navbar />)

    const trigger = container.querySelector('button[aria-haspopup="true"]')
    expect(trigger, 'the account trigger declares a popup').not.toBeNull()
    expect(trigger!.getAttribute('aria-expanded')).toBe('false')

    // The menu itself must be revealed by focus, not hover alone.
    const menuClasses = Array.from(container.querySelectorAll('div'))
      .map((el) => el.getAttribute('class') ?? '')
      .find((c) => c.includes('group-focus-within:visible') && c.includes('group-focus-within:opacity-100'))
    expect(menuClasses, 'the account menu is revealed on focus-within').toBeDefined()

    // Focus is what a keyboard user has; the expanded state must follow it.
    fireEvent.focus(trigger!)
    expect(trigger!.getAttribute('aria-expanded')).toBe('true')

    fireEvent.blur(trigger!)
    expect(trigger!.getAttribute('aria-expanded')).toBe('false')
  })

  it('is a fixed paper surface with a 2px ink bottom border, on the brief', () => {
    const { container } = renderNavbar(<Navbar />)
    const nav = screen.getByRole('navigation', { name: /main/i })
    const classes = nav.getAttribute('class') ?? ''

    expect(classes).toContain('bg-[var(--paper)]')
    expect(classes).toContain('border-b-2')
    expect(classes).toContain('border-[var(--ink)]')
    // Fixed at the top, 64px tall — PageWrapper's pt-16 assumes it.
    expect(classes).toContain('fixed')
    expect(classes).toContain('top-0')
    expect(container.querySelector('.h-16')).not.toBeNull()
  })

  it('starts with the mobile menu closed and opens it on the menu button', () => {
    const { container } = renderNavbar(<Navbar />)

    expect(mobileMenu(container)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))

    const panel = mobileMenu(container)
    expect(panel, 'the panel mounts once the menu is open').not.toBeNull()
    expect(panel!.className).toMatch(/lg:hidden/)

    const toggle = screen.getByRole('button', { name: /close menu/i })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    // The panel carries the same four links (full-width panel below the bar).
    const panelLinks = Array.from(panel!.querySelectorAll('a')).filter((a) =>
      NAV_LINKS.some((l) => l.href === a.getAttribute('href'))
    )
    expect(panelLinks).toHaveLength(NAV_LINKS.length)
  })

  it('closes the mobile menu again on the toggle', async () => {
    const { container } = renderNavbar(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }))

    // The panel unmounts on the exit transition, not synchronously.
    await waitFor(() => expect(mobileMenu(container)).toBeNull())
  })

  it('shows the cart count and flips the drawer open when the cart is clicked', () => {
    act(() => {
      useCartStore.setState({ items: [], itemCount: 3 })
      useAuthStore.setState({ user: { role: 'CUSTOMER' } as never, isAuthenticated: true })
    })

    const { container } = renderNavbar(<Navbar />)

    // The cart control lives on the desktop surface (`hidden lg:flex`); jsdom
    // applies no media queries, so it is in the tree.
    const cart = Array.from(container.querySelectorAll('button')).find((b) =>
      /shopping cart/i.test(b.getAttribute('aria-label') ?? '')
    )
    expect(cart, 'the cart control is present').toBeDefined()
    expect(cart!.getAttribute('aria-label')).toBe('Shopping cart with 3 items')
    expect(cart).toHaveTextContent('3')
    expect(useCartStore.getState().isOpen).toBe(false)

    fireEvent.click(cart!)
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('uses no banned utility, undefined token, raw colour or gradient', () => {
    const { container } = renderNavbar(<Navbar />)

    const offenders = renderedClasses(container).filter(
      (cls) => BANNED_SUBSTRINGS.some((b) => cls.includes(b)) || BANNED_PATTERN.test(cls)
    )
    expect(offenders).toEqual([])
  })

  it('gives every interactive element a focus-visible rule', () => {
    const { container } = renderNavbar(<Navbar />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))

    const focusable = Array.from(
      container.querySelectorAll('button, input, select, textarea, [role="checkbox"]')
    )

    expect(focusable.length).toBeGreaterThan(4)
    for (const el of focusable) {
      const classes = el.getAttribute('class') ?? ''
      // The navbar renders its links as anchors, which carry the shared
      // `FOCUS_VISIBLE` fragment; the mobile panel's links sit inside the
      // `md:hidden` container and are covered by the same rule.
      const ringed = classes.includes('focus-visible:')
      expect(ringed, `${el.tagName} carries a focus-visible rule`).toBe(true)
    }

    // The anchors carry the same ring (the shared fragment on each link).
    const anchors = Array.from(container.querySelectorAll('a')).filter((a) =>
      NAV_LINKS.some((l) => l.href === a.getAttribute('href'))
    )
    expect(anchors.length).toBeGreaterThan(0)
    for (const a of anchors) {
      expect(a.getAttribute('class') ?? '').toContain('focus-visible:')
    }
  })

  it('keeps the icon toggle at a 44px hit target', () => {
    const { container } = renderNavbar(<Navbar />)

    const toggle = screen.getByRole('button', { name: /open menu/i })
    expect(toggle.className).toMatch(/min-h-\[44px\]/)
    expect(container.querySelector('button[aria-controls="mobile-menu-panel"]')).toBe(toggle)
  })

  it('renders the desktop nav links as pills that fill on hover with a spring', () => {
    const { container } = renderNavbar(<Navbar />)

    // The desktop surface is `hidden lg:flex`; jsdom applies no media queries,
    // so the `lg:` breakpoint is treated as matching. Scope the query to the
    // desktop list (the first `ul` inside the bar) so the mobile panel — which
    // is closed — cannot contribute links.
    const desktopList = container.querySelector('nav ul')
    expect(desktopList).not.toBeNull()

    const links = Array.from(desktopList!.querySelectorAll('a'))
    expect(links).toHaveLength(NAV_LINKS.length)

    for (const link of links) {
      const classes = link.getAttribute('class') ?? ''
      expect(classes, 'nav link is a pill').toContain('rounded-pill')
      expect(classes, 'hover fill is a spring').toMatch(/ease-spring/)
    }
  })
})

describe('MobileNav', () => {
  it('renders as a bottom tab bar with the same four destinations', () => {
    const { container } = renderNavbar(<MobileNav />)

    const bar = container.querySelector('nav[aria-label="Bottom navigation"]')
    expect(bar).not.toBeNull()
    expect(bar!.getAttribute('class')).toMatch(/fixed/)
    expect(bar!.getAttribute('class')).toMatch(/bottom-0/)

    const hrefs = Array.from(bar!.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    for (const { href } of NAV_LINKS) {
      expect(hrefs).toContain(href)
    }
  })

  it('opens and closes its expanded menu on the More toggle', () => {
    const { container } = renderNavbar(<MobileNav />)

    // The toggle's accessible name is the visible `More` label (the button is
    // a flex column: icon + text), so match on the text node rather than the
    // regex that also matches the `Open menu` aria-label.
    const toggle = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.trim().endsWith('More')
    )
    expect(toggle, 'the More toggle is present').toBeDefined()
    expect(toggle!.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(toggle!)
    expect(toggle!.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('#mobile-nav-menu')).toBeInTheDocument()

    const close = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.trim().endsWith('Close')
    )
    fireEvent.click(close!)
    expect(toggle!.getAttribute('aria-expanded')).toBe('false')
  })

  it('uses no banned utility, undefined token, raw colour or gradient', () => {
    const { container } = renderNavbar(<MobileNav />)

    const offenders = renderedClasses(container).filter(
      (cls) => BANNED_SUBSTRINGS.some((b) => cls.includes(b)) || BANNED_PATTERN.test(cls)
    )
    expect(offenders).toEqual([])
  })

  it('lays the six tab-bar items in a single row', () => {
    const { container } = renderNavbar(<MobileNav />)

    const bar = container.querySelector('nav[aria-label="Bottom navigation"]')
    expect(bar).not.toBeNull()

    // 5 destination links + the More toggle = 6 cells; a 5-column grid wraps
    // More onto a second row.
    const grid = Array.from(bar!.children).find((el) =>
      (el.getAttribute('class') ?? '').split(/\s+/).includes('grid')
    )
    expect(grid, 'the tab bar uses a grid').toBeDefined()
    expect(grid!.getAttribute('class')).toContain('grid-cols-6')
    expect(grid!.getAttribute('class')).not.toContain('grid-cols-5')
    expect(grid!.children).toHaveLength(6)
  })
})
