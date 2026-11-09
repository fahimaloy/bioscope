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

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import AdminLayout from '@/app/(admin)/layout'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationStore } from '@/lib/stores/notificationStore'

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

/** The sidebar landmark. */
function sidebar(container: HTMLElement): HTMLElement | null {
  return container.querySelector('aside[aria-label="Admin navigation"]')
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
    expect(products.className, 'the active item carries the gold bar').toContain(
      'border-[var(--gold)]'
    )

    const dashboard = screen.getByRole('link', { name: 'Dashboard' })
    expect(dashboard.getAttribute('aria-current')).toBeNull()
    expect(dashboard.className).not.toContain('border-[var(--gold)]')
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

  it('imports SketchUnderline from the decorative barrel, not the deprecated shim (Ruling 7)', () => {
    const source = readFileSync('src/app/(admin)/layout.tsx', 'utf8')
    expect(source).not.toContain('DoodleElements')
    expect(source).toContain("from '@/components/decorative'")
  })
})
