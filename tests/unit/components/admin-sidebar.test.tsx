// @vitest-environment jsdom
//
// Task 1.4 — Admin layout and sidebar.
//
// Pins the brief's contract: the sidebar renders the seven admin
// destinations, the `isAdmin` guard blocks a non-admin (Access Denied and no
// sidebar), the breadcrumb is built from the pathname, and the user menu
// works. Also pins docs/DESIGN_CONTRACT.md §1 (token-only colour), §5 (the
// admin is calm pro: near-white surfaces, hairline borders, one teal accent,
// a gold active bar, no offset shadows) and §6 (44px hit targets, visible
// focus ring, semantic landmarks).
//
// The header/content geometry is asserted structurally rather than by pinning
// class strings: the sticky top bar occupies y=64–128, so the content column
// must reserve that slot. See the "does not overlap" test below.

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import AdminLayout from '@/app/(admin)/layout'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { ADMIN_HEADER_HEIGHT_PX, CONTENT_TOP_PX } from '@/lib/layout-metrics'

const { mockSignOut, mockLogout } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockLogout: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: vi.fn() }))

vi.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

const navigation = vi.hoisted(() => ({ pathname: '/admin/dashboard' }))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

// next/link and next/image are mocked so the component tree mounts outside
// the App Router (the tests pin rendering, not routing).
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// NotificationBell is a separate component with its own task; stub it so the
// layout's class check is scoped to the chrome this task owns.
vi.mock('@/components/layout/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}))

/** The brief's seven destinations, in order. */
const DESTINATIONS = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Products', href: '/admin/products' },
  { name: 'Orders', href: '/admin/orders' },
  { name: 'Custom Requests', href: '/admin/custom-requests' },
  { name: 'Customers', href: '/admin/customers' },
  { name: 'Analytics', href: '/admin/analytics' },
  { name: 'Settings', href: '/admin/settings' },
] as const

/**
 * Utilities the pre-rebuild admin chrome used that the token pipeline never
 * defined, plus the opacity-modified `var()` forms that Tailwind 3.4 does not
 * compile (Ruling 5) and the deprecated shim import (Ruling 7).
 */
const BANNED_SUBSTRINGS = [
  'border-3',
  'border-b-3',
  'border-t-3',
  'border-l-4',
  'rounded-card',
  'rounded-input',
  'shadow-btn',
  'shadow-glass',
  'text-body',
  'animate-pulse-soft',
  'bg-primary',
  'text-primary',
  'hover:text-primary',
  'hover:bg-primary',
  'bg-[var(--bg-color)]',
  'var(--surface-card)',
  'var(--text-primary)',
  'var(--text-secondary)',
  'var(--text-tertiary)',
  'var(--border-secondary)',
  'var(--shadow-offset)',
  'var(--light)',
  'var(--primary)',
  'bg-gradient-to-r',
  'backdrop-blur',
  'bg-[var(--ink)]/50',
  'hover:bg-[var(--error)]/10',
  'DoodleElements',
  'DoodleShape',
]

/** Raw hex / rgb() literals — contract §1. */
const BANNED_PATTERN = /(#(?:[0-9a-fA-F]{3,8})\b|rgba?\()/i

/** Every class token in the rendered tree. */
function renderedClasses(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[class]')).flatMap((el) =>
    (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
  )
}

/** The mobile overlay (the dim layer the sidebar toggle controls). */
function mobileOverlay(container: HTMLElement): HTMLElement | null {
  return (
    Array.from(container.querySelectorAll('div')).find((el) => {
      const classes = el.getAttribute('class') ?? ''
      return classes.includes('inset-0') && classes.includes('transition-opacity')
    }) ?? null
  )
}

/** Tailwind spacing scale (rem → px at the default 16px root). */
const TAILWIND_SPACING_PX: Record<string, number> = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
}

/**
 * The resolved vertical padding (px) of an element, read from its own classes.
 * Handles `pt-*` (top only) and `py-*` (both axes).
 */
function resolvedVerticalPaddingPx(el: HTMLElement): number {
  const classes = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)

  for (const cls of classes) {
    const arbitrary = cls.match(/^p[ty]-\[([\d.]+)px\]$/)
    if (arbitrary) return Number.parseFloat(arbitrary[1])

    const scale = cls.match(/^p[ty]-([\d.]+)$/)
    if (scale) {
      const value = TAILWIND_SPACING_PX[scale[1]]
      if (value !== undefined) return value
    }
  }
  return 0
}

/** The resolved top padding (px) of an element, read from its own classes. */
function resolvedTopPaddingPx(el: HTMLElement): number {
  const classes = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)

  for (const cls of classes) {
    // Arbitrary value: pt-[64px].
    const arbitrary = cls.match(/^pt-\[([\d.]+)px\]$/)
    if (arbitrary) return Number.parseFloat(arbitrary[1])

    // Scale value: pt-16.
    const scale = cls.match(/^pt-([\d.]+)$/)
    if (scale) {
      const value = TAILWIND_SPACING_PX[scale[1]]
      if (value !== undefined) return value
    }
  }
  return 0
}

/** The sidebar landmark. */
function sidebar(container: HTMLElement): HTMLElement | null {
  return container.querySelector('aside[aria-label="Admin navigation"]')
}

/**
 * The z-index tokens from `src/app/globals.css`. Mirrored here because jsdom
 * does not load the compiled stylesheet; changing a token value should be
 * accompanied by a change here.
 */
const Z_TOKENS: Record<string, number> = {
  '--z-dropdown': 100,
  '--z-sticky': 200,
  '--z-fixed': 300,
  '--z-modal-backdrop': 400,
  '--z-modal': 500,
  '--z-popover': 600,
  '--z-tooltip': 700,
  '--z-toast': 800,
}

/** The resolved z-index of an element, read from its own classes. */
function resolvedZIndex(el: HTMLElement): number | null {
  for (const cls of (el.getAttribute('class') ?? '').split(/\s+/)) {
    const token = cls.match(/^z-\[var\((--z-[a-z-]+)\)\]$/)
    if (token) return Z_TOKENS[token[1]] ?? null
    const numeric = cls.match(/^z-(\d+)$/)
    if (numeric) return Number(numeric[1])
  }
  return null
}

/** The admin user object the mocked `useAuth` returns. */
function adminUser(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: '1', name: 'Ada Admin', email: 'ada@example.com', role: 'ADMIN' },
    isAdmin: true,
    isCustomer: false,
    isAuthenticated: true,
    isLoading: false,
    logout: mockLogout,
    updateProfile: vi.fn(),
    status: 'authenticated',
    ...overrides,
  }
}

beforeEach(() => {
  navigation.pathname = '/admin/dashboard'
  mockSignOut.mockClear()
  mockLogout.mockClear()
  mockUseAuth.mockReturnValue(adminUser() as never)
  act(() => {
    useNotificationStore.setState({
      pendingOrdersCount: 0,
      pendingRequestsCount: 0,
      unreadCount: 0,
      lowStockCount: 0,
    })
  })
  window.localStorage.clear()
})

describe('AdminSidebar', () => {
  it('renders the seven admin destinations', () => {
    render(<AdminSidebar />)

    for (const { name, href } of DESTINATIONS) {
      const link = screen.getByRole('link', { name })
      expect(link.getAttribute('href'), `${name} resolves to ${href}`).toBe(href)
    }
  })

  it('is a calm-pro surface: near-white, hairline border, below the 64px navbar', () => {
    const { container } = render(<AdminSidebar />)

    const aside = sidebar(container)
    expect(aside, 'the sidebar is a labelled landmark').not.toBeNull()
    const classes = aside!.getAttribute('class') ?? ''

    expect(classes).toContain('bg-[var(--surface-raised)]')
    expect(classes).toContain('border-r')
    expect(classes).toContain('border-[var(--border)]')
    // Hairline, not the brand's 2-3px.
    expect(classes).not.toContain('border-r-2')
    expect(classes).not.toContain('border-r-3')
    // The fixed navbar is 64px; the sidebar starts under it.
    expect(classes).toContain('top-16')
  })

  it('marks the active destination with a gold left bar', () => {
    navigation.pathname = '/admin/products'
    render(<AdminSidebar />)

    const products = screen.getByRole('link', { name: 'Products' })
    expect(products.getAttribute('aria-current')).toBe('page')
    expect(products.className, 'the active item carries the gold left bar').toContain(
      'border-l-[var(--gold)]'
    )

    const dashboard = screen.getByRole('link', { name: 'Dashboard' })
    expect(dashboard.getAttribute('aria-current')).toBeNull()
    expect(dashboard.className).not.toContain('border-l-[var(--gold)]')
  })

  it('marks the active settings sub-nav item with the same gold left bar', () => {
    navigation.pathname = '/admin/settings/tax'
    render(<AdminSidebar />)

    const tax = screen.getByRole('link', { name: 'Tax' })
    expect(tax.getAttribute('aria-current')).toBe('page')
    expect(tax.className, 'the sub-nav active item carries the gold bar too').toContain(
      'border-l-[var(--gold)]'
    )

    // Prefix matching means the parent `General` route is also active here;
    // that is the sidebar's pre-existing behaviour, not something this task
    // changes. The bar is what the sub-nav was missing.
  })

  it('positions the collapsed badge dot against the item, not the rail', () => {
    act(() => {
      useNotificationStore.setState({ pendingOrdersCount: 4 })
    })
    render(<AdminSidebar collapsed />)

    const orders = screen.getByRole('link', { name: /Orders/ })
    expect(orders.getAttribute('class') ?? '', 'the item is the positioning context').toContain(
      'relative'
    )
    const dot = within(orders).getByLabelText('Orders has pending items')
    expect(dot.parentElement).toBe(orders)
    expect(dot.className).toContain('absolute')
  })

  it('uses a visible pulse on the badge instead of the no-op shimmer', () => {
    act(() => {
      useNotificationStore.setState({ pendingOrdersCount: 5 })
    })
    render(<AdminSidebar />)

    const badge = within(screen.getByRole('link', { name: /Orders/ })).getByText('5')
    expect(badge.className, 'the badge animates').toContain('animate-pulse-soft')
    expect(badge.className, 'the shimmer keyframe has no effect on a solid fill').not.toContain(
      'animate-shimmer'
    )
  })

  it('gives the sidebar close and collapse buttons a 44px hit target', () => {
    const { container } = render(<AdminSidebar onToggleCollapse={() => {}} />)

    for (const name of ['Close sidebar', 'Collapse sidebar']) {
      const btn = screen.getByRole('button', { name })
      const classes = btn.getAttribute('class') ?? ''
      expect(classes, `${name} is 44px tall`).toContain('min-h-[44px]')
      expect(classes, `${name} is 44px wide`).toContain('min-w-[44px]')
    }
    expect(container).not.toBeNull()
  })

  it('layers the mobile overlay between the admin header and the sidebar rail', () => {
    const { container } = render(
      <AdminLayout>
        <div>orders body</div>
      </AdminLayout>
    )

    const header = container.querySelector('header')!
    const overlay = mobileOverlay(container)!
    const rail = sidebar(container)!
    expect(header, 'the top bar is a header element').not.toBeNull()
    expect(overlay, 'the mobile overlay is present').not.toBeNull()
    expect(rail, 'the sidebar rail is present').not.toBeNull()

    const headerZ = resolvedZIndex(header)
    const overlayZ = resolvedZIndex(overlay)
    const railZ = resolvedZIndex(rail)
    expect(headerZ, 'the header has a resolvable z-index').not.toBeNull()
    expect(overlayZ, 'the overlay has a resolvable z-index').not.toBeNull()
    expect(railZ, 'the rail has a resolvable z-index').not.toBeNull()

    // The overlay must dim the top bar…
    expect(overlayZ! > headerZ!, 'the overlay is above the header').toBe(true)
    // …but stay below the rail. A scrim above the rail intercepts taps on every
    // nav item, so the menu could only be closed, never navigated.
    expect(overlayZ! < railZ!, 'the overlay is below the rail').toBe(true)
  })

  it('uses the teal accent for its badge fill, with on-teal text', () => {
    act(() => {
      useNotificationStore.setState({ pendingOrdersCount: 5, pendingRequestsCount: 3 })
    })
    render(<AdminSidebar />)

    const orders = screen.getByRole('link', { name: /Orders/ })
    const ordersBadge = within(orders).getByText('5')
    expect(ordersBadge.className).toContain('bg-[var(--teal)]')
    expect(ordersBadge.className).toContain('text-[var(--on-teal)]')

    const requests = screen.getByRole('link', { name: /Custom Requests/ })
    const requestsBadge = within(requests).getByText('3')
    expect(requestsBadge.className).toContain('bg-[var(--teal)]')
    expect(requestsBadge.className).toContain('text-[var(--on-teal)]')
  })

  it('collapses to icons and expands again', () => {
    const { container } = render(<AdminSidebar collapsed onToggleCollapse={() => {}} />)

    expect(screen.queryByText('Dashboard'), 'the collapsed rail hides labels').toBeNull()
    const expand = screen.getByRole('button', { name: 'Expand sidebar' })
    expect(expand.getAttribute('aria-expanded')).toBe('false')
    expect(sidebar(container)!.className).toContain('w-20')

    render(<AdminSidebar />)
    const collapse = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(collapse.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('dims the page behind the mobile sidebar and closes on the overlay', () => {
    const onCloseMobile = vi.fn()
    const { container } = render(<AdminSidebar mobileOpen={false} onCloseMobile={onCloseMobile} />)

    const overlay = mobileOverlay(container)
    expect(overlay, 'the mobile overlay is present').not.toBeNull()
    expect(overlay!.className).toContain('pointer-events-none')
    expect(overlay!.className).toContain('bg-[var(--overlay)]')

    fireEvent.click(overlay!)
    expect(onCloseMobile).toHaveBeenCalledTimes(1)

    const open = render(<AdminSidebar mobileOpen onCloseMobile={onCloseMobile} />)
    const openOverlay = mobileOverlay(open.container)
    expect(openOverlay!.className).not.toContain('pointer-events-none')
  })

  it('logs out through the auth hook and NextAuth', () => {
    render(<AdminSidebar />)

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('uses no banned utility, undefined token, raw colour or gradient', () => {
    const { container } = render(<AdminSidebar />)

    const offenders = renderedClasses(container).filter(
      (cls) => BANNED_SUBSTRINGS.some((b) => cls.includes(b)) || BANNED_PATTERN.test(cls)
    )
    expect(offenders).toEqual([])
  })

  it('gives every interactive element a focus-visible rule', () => {
    const { container } = render(<AdminSidebar />)

    const focusable = Array.from(container.querySelectorAll('a, button'))
    expect(focusable.length).toBeGreaterThan(DESTINATIONS.length)
    for (const el of focusable) {
      expect(el.getAttribute('class') ?? '', `${el.tagName} carries a focus ring`).toContain(
        'focus-visible:'
      )
    }
  })

  it('keeps every destination at a 44px hit target', () => {
    render(<AdminSidebar />)

    for (const { name, href } of DESTINATIONS) {
      const link = screen.getByRole('link', { name })
      expect(link.getAttribute('class') ?? '', `${name} is a 44px target`).toContain(
        'min-h-[44px]'
      )
      expect(link.getAttribute('href')).toBe(href)
    }
  })
})

describe('AdminLayout', () => {
  it('blocks a non-admin before rendering the sidebar (Ruling 2)', () => {
    mockUseAuth.mockReturnValue(
      adminUser({
        isAdmin: false,
        user: { id: '2', name: 'Cara Customer', email: 'cara@example.com', role: 'CUSTOMER' },
      }) as never
    )
    const { container } = render(
      <AdminLayout>
        <div>secret admin body</div>
      </AdminLayout>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(sidebar(container), 'the sidebar is not rendered for a non-admin').toBeNull()
    expect(screen.queryByText('secret admin body')).toBeNull()
  })

  it('renders the sidebar and the page body for an admin', () => {
    navigation.pathname = '/admin/products'
    const { container } = render(
      <AdminLayout>
        <div>products body</div>
      </AdminLayout>
    )

    expect(screen.queryByText('Access Denied')).toBeNull()
    expect(sidebar(container), 'the sidebar is mounted').not.toBeNull()
    expect(screen.getByText('products body')).toBeInTheDocument()
  })

  it('builds the breadcrumb from the pathname', () => {
    navigation.pathname = '/admin/settings/tax'
    render(
      <AdminLayout>
        <div>tax body</div>
      </AdminLayout>
    )

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'Admin' })).toHaveAttribute(
      'href',
      '/admin/dashboard'
    )
    expect(within(breadcrumb).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/admin/settings'
    )
    // The segment fallback is the raw pathname segment (the legacy layout
    // did not title-case unknown segments).
    const current = within(breadcrumb).getByText('tax')
    expect(current.closest('[aria-current]')?.getAttribute('aria-current')).toBe('page')
  })

  it('renders the user menu with profile, settings and logout', () => {
    render(
      <AdminLayout>
        <div>body</div>
      </AdminLayout>
    )

    const trigger = screen.getByRole('button', { name: /Ada Admin/ })
    expect(trigger.getAttribute('aria-haspopup')).toBe('true')

    const menu = trigger.parentElement!
    expect(within(menu).getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/admin/profile'
    )
    expect(within(menu).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/admin/settings'
    )

    fireEvent.click(within(menu).getByRole('button', { name: 'Logout' }))
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
  })

  it('uses no banned utility, undefined token, raw colour or gradient in its own tree', () => {
    navigation.pathname = '/admin/orders'
    const { container } = render(
      <AdminLayout>
        <div>orders body</div>
      </AdminLayout>
    )

    // Scope to the layout's own chrome: the header, the main column and the
    // sidebar. NotificationBell is a separate component with its own task.
    const header = container.querySelector('header')
    expect(header, 'the top bar is a header element').not.toBeNull()
    const main = screen.getByText('orders body').closest('main')
    expect(main, 'the content column is a main element').not.toBeNull()

    const scoped = [header!, main!, sidebar(container)!].flatMap((el) => renderedClasses(el))
    const offenders = scoped.filter(
      (cls) => BANNED_SUBSTRINGS.some((b) => cls.includes(b)) || BANNED_PATTERN.test(cls)
    )
    expect(offenders).toEqual([])
  })

  it('reserves the sticky header slot so the content is not overlapped', () => {
    const { container } = render(
      <AdminLayout>
        <h1>Dashboard</h1>
      </AdminLayout>
    )

    const header = container.querySelector('header')!
    // `Dashboard` is also the sidebar's first destination link, so scope to
    // the h1 rather than using `getByText`.
    const main = screen.getByRole('heading', { name: 'Dashboard', level: 1 }).closest('main')!
    expect(header, 'the top bar is a header element').not.toBeNull()
    expect(main, 'the content column is a main element').not.toBeNull()

    // The sticky bar's in-flow slot is the content column's top padding. The
    // bar paints at `top-16` (64px) and is 64px tall, so the body must start
    // at 128px. If the column drops its offset, the bar's slot starts at y=0,
    // the bar paints at y=64–128, and it covers the first 40px of the body.
    //
    // jsdom performs no layout and does not load the project's compiled
    // Tailwind stylesheet, so `getComputedStyle` returns an empty string for
    // class-driven declarations and `getBoundingClientRect` is always 0. The
    // offset is therefore resolved from the classes themselves — the one
    // layout input that decides whether the bar overlaps the body. A real
    // rect-vs-rect check was done in Chromium; see the fix-round report.
    const column = header.parentElement!
    const columnTop = resolvedTopPaddingPx(column)
    // `py-6` sets both axes; the main's vertical padding is what the browser
    // adds on top of the reserved slot.
    const mainTop = resolvedVerticalPaddingPx(main)

    // `pt-16` is 64px; the bar is 64px tall, so the body starts at 128px.
    expect(
      columnTop,
      'the content column reserves the sticky bar slot (regression: 40px overlap)'
    ).toBeGreaterThanOrEqual(ADMIN_HEADER_HEIGHT_PX)
    expect(columnTop + ADMIN_HEADER_HEIGHT_PX, 'the body starts below the bar').toBe(
      CONTENT_TOP_PX
    )
    expect(
      columnTop + ADMIN_HEADER_HEIGHT_PX + mainTop,
      'the first body element clears the bar'
    ).toBe(CONTENT_TOP_PX + 24)
  })

  it('imports SketchUnderline from the decorative barrel, not the deprecated shim (Ruling 7)', () => {
    const source = readFileSync('src/app/(admin)/layout.tsx', 'utf8')
    expect(source).not.toContain('DoodleElements')
    expect(source).toContain("from '@/components/decorative'")
  })
})
