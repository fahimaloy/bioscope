// @vitest-environment jsdom
//
// Task 1.5 — CartDrawer and PageWrapper.
//
// Pins the brief's contract for `<CartDrawer />`: hidden from the accessibility
// tree when closed, a modal dialog labelled by its visible "Shopping Cart"
// heading, items and subtotal when open, and a checkout button that stays
// rendered but is disabled when the cart is empty. Also pins the rebuild's
// hard requirements from docs/DESIGN_CONTRACT.md §1 (token-only colour),
// §5 (brand surfaces: paper background, 3px ink left border, hard offset
// shadow, token scrim, no gradients/glass) and §6 (focus trap, ESC to close,
// focus restore, 44px hit targets).
//
// `<PageWrapper />` is pinned for its `background` prop (`default | grid |
// none`), the paper-grain texture, and a bottom padding that clears the fixed
// MobileNav bar.

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useCartStore } from '@/lib/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import type { CartItem, Product } from '@/types'

/**
 * Measured height of the fixed MobileNav bar (Chromium, 390×844): one row of
 * 56px `min-h` + 24px `py-3` + 18px `text-xs` line box + 2px `border-t-2`.
 * Tailwind's default spacing scale resolves `pb-20` to 80px, an 8px margin.
 */
const MOBILE_NAV_HEIGHT_PX = 72
const TAILWIND_SPACING_PX: Record<string, number> = { 'pb-20': 80, 'md:pb-12': 48 }

// next/link and next/image are mocked so the component tree mounts outside
// the App Router (the tests pin rendering, not routing or image optimisation).
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}))

const product: Product = {
  id: 'p1',
  name: 'Test Sticker',
  slug: 'test-sticker',
  description: null,
  basePrice: 250,
  compareAtPrice: null,
  images: ['/test-sticker.png'],
  categoryId: 'c1',
  allowedDimensions: [],
  allowedQuantities: [],
  customizationOptions: null,
  taxPercent: 0,
  additionalCharge: 0,
  isTaxInclusive: false,
  trackInventory: false,
  stock: 100,
  lowStockThreshold: 10,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  metaTitle: null,
  metaDescription: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

const item: CartItem = {
  id: 'i1',
  cartId: 'local',
  productId: 'p1',
  product,
  productName: 'Test Sticker',
  productSlug: 'test-sticker',
  productImage: '/test-sticker.png',
  unitPrice: 250,
  width: 5,
  height: 5,
  quantity: 2,
  customization: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

/** The drawer's focus-trap selector, mirrored from the component. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Utilities the pre-rebuild drawer used that the token pipeline never defined. */
const BANNED_SUBSTRINGS = [
  'border-l-3',
  'border-3',
  'rounded-input',
  'rounded-card',
  'text-body',
  'hover:text-red-500',
  'bg-black/50',
  'bg-white',
  'backdrop-blur',
  'bg-primary',
  'text-primary',
  'var(--light)',
  'var(--bg-primary)',
  'var(--bg-color)',
  'var(--surface-card)',
  'var(--border-secondary)',
  'var(--primary)',
  'var(--secondary)',
  'var(--tertiary)',
  'var(--purple)',
  'var(--dark)',
  'shadow-glass',
  'shadow-xs',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shadow-xl',
  'bg-gradient-to-r',
  'bg-gradient-to-b',
]

/** Raw hex / rgb() literals, gradients, and opacity-modified `var()` no-ops. */
const BANNED_PATTERN =
  /(#(?:[0-9a-fA-F]{3,8})\b|rgba?\(|linear-gradient|var\(--[a-z0-9-]+\)\]\/\d+)/i

/** Every class token in the rendered tree. */
function renderedClasses(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[class]')).flatMap((el) =>
    (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
  )
}

function openCartWithItems() {
  act(() => {
    useCartStore.setState({ items: [item], itemCount: 2, subtotal: 500, isOpen: true })
  })
}

beforeEach(() => {
  act(() => {
    useCartStore.setState({ items: [], isOpen: false, itemCount: 0, subtotal: 0 })
  })
  window.localStorage.clear()
})

describe('CartDrawer', () => {
  it('is hidden from the accessibility tree when closed', () => {
    render(<CartDrawer />)

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('is a modal dialog labelled by its visible heading', () => {
    openCartWithItems()
    render(<CartDrawer />)

    const dialog = screen.getByRole('dialog', { name: 'Shopping Cart' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'cart-drawer-title')
  })

  it('lists the cart items and the subtotal when open', () => {
    openCartWithItems()
    render(<CartDrawer />)

    expect(screen.getByText('Test Sticker')).toBeInTheDocument()
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    // The line item (250 × 2) and the subtotal both render 500. `formatCurrency`
    // emits a non-breaking space (BDT 500); match the raw text node so the
    // query is not defeated by Testing Library's whitespace normaliser.
    const formatted = formatCurrency(500)
    expect(
      screen.getAllByText((_content, el) => el?.textContent === formatted)
    ).toHaveLength(2)
  })

  it('keeps the checkout button rendered and disabled when the cart is empty', () => {
    act(() => {
      useCartStore.setState({ items: [], isOpen: true, itemCount: 0, subtotal: 0 })
    })
    render(<CartDrawer />)

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument()

    const checkout = screen.getByRole('button', { name: /checkout/i })
    expect(checkout).toBeDisabled()
    expect(checkout).toHaveAttribute('aria-disabled', 'true')
  })

  it('enables checkout when the cart has items', () => {
    openCartWithItems()
    render(<CartDrawer />)

    expect(screen.getByRole('button', { name: /checkout/i })).toBeEnabled()
  })

  it('closes on Escape', () => {
    openCartWithItems()
    render(<CartDrawer />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(useCartStore.getState().isOpen).toBe(false)
  })

  it('traps Tab within the drawer', () => {
    openCartWithItems()
    render(<CartDrawer />)

    const dialog = screen.getByRole('dialog')
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    expect(focusables.length).toBeGreaterThan(2)

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })

    expect(document.activeElement).toBe(first)
  })

  it('traps Shift+Tab within the drawer', () => {
    openCartWithItems()
    render(<CartDrawer />)

    const dialog = screen.getByRole('dialog')
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    first.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(last)
  })

  it('pulls focus back into the drawer when Tab is pressed from outside', () => {
    function Harness() {
      return (
        <>
          <button type="button">Outside the drawer</button>
          <CartDrawer />
        </>
      )
    }
    openCartWithItems()
    render(<Harness />)

    const dialog = screen.getByRole('dialog')
    const outside = screen.getByRole('button', { name: 'Outside the drawer' })
    outside.focus()
    expect(dialog.contains(document.activeElement)).toBe(false)

    fireEvent.keyDown(document, { key: 'Tab' })

    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('pulls focus to the last element on Shift+Tab from outside', () => {
    function Harness() {
      return (
        <>
          <button type="button">Outside the drawer</button>
          <CartDrawer />
        </>
      )
    }
    openCartWithItems()
    render(<Harness />)

    const dialog = screen.getByRole('dialog')
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    const outside = screen.getByRole('button', { name: 'Outside the drawer' })
    outside.focus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(focusables[focusables.length - 1])
  })

  it('moves focus from the dialog surface to the first element on Tab', () => {
    openCartWithItems()
    render(<CartDrawer />)

    const dialog = screen.getByRole('dialog')
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

    // The post-open focus target is the dialog surface itself (tabIndex={-1}).
    expect(document.activeElement).toBe(dialog)

    fireEvent.keyDown(document, { key: 'Tab' })

    expect(document.activeElement).toBe(focusables[0])
  })

  it('wraps Shift+Tab from the dialog surface to the last element', () => {
    openCartWithItems()
    render(<CartDrawer />)

    const dialog = screen.getByRole('dialog')
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    expect(document.activeElement).toBe(dialog)

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(focusables[focusables.length - 1])
  })

  it('focuses the dialog only after it becomes visible, never while still `invisible`', () => {
    const recorded: string[] = []
    const originalFocus = HTMLElement.prototype.focus
    HTMLElement.prototype.focus = function focus(this: HTMLElement, options?: FocusOptions) {
      if (this.getAttribute('role') === 'dialog') recorded.push(this.className)
      return originalFocus.call(this, options)
    } as typeof HTMLElement.prototype.focus

    try {
      // Render closed (aside carries `invisible`), then open — the transition
      // a real browser performs. jsdom's `focus()` ignores `visibility`, so
      // this pins the invariant by recording the class at call time.
      render(<CartDrawer />)
      act(() => {
        useCartStore.setState({ items: [item], itemCount: 2, subtotal: 500, isOpen: true })
      })

      expect(recorded.length).toBeGreaterThan(0)
      expect(recorded.some((cls) => cls.includes('invisible'))).toBe(false)
    } finally {
      HTMLElement.prototype.focus = originalFocus
    }
  })

  it('restores focus to the invoking element on close', async () => {
    function Harness() {
      return (
        <>
          <button type="button">Open cart</button>
          <CartDrawer />
        </>
      )
    }
    render(<Harness />)

    const trigger = screen.getByRole('button', { name: 'Open cart' })
    trigger.focus()

    act(() => {
      useCartStore.setState({ isOpen: true })
    })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    act(() => {
      useCartStore.setState({ isOpen: false })
    })
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('uses the token scrim and the modal z-tokens', () => {
    openCartWithItems()
    const { container } = render(<CartDrawer />)

    const overlay = container.firstElementChild as HTMLElement
    const overlayClasses = overlay.getAttribute('class') ?? ''
    expect(overlayClasses).toContain('z-[var(--z-modal-backdrop)]')
    expect(overlayClasses).toContain('bg-[var(--overlay)]')
    expect(overlayClasses).not.toContain('backdrop-blur')

    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('z-[var(--z-modal)]')
  })

  it('uses a hard token offset shadow and a 3px ink left border', () => {
    openCartWithItems()
    render(<CartDrawer />)

    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('border-l-[3px]')
    expect(dialog.className).toContain('border-l-[var(--ink)]')
    expect(dialog.className).toMatch(/shadow-\[[^\]]*var\(--ink\)\]/)
    expect(dialog.className).not.toContain('40px')
  })

  it('uses no banned utility, undefined token, raw colour or gradient', () => {
    openCartWithItems()
    const { container } = render(<CartDrawer />)

    const offenders = renderedClasses(container).filter(
      (cls) => BANNED_SUBSTRINGS.some((b) => cls.includes(b)) || BANNED_PATTERN.test(cls)
    )
    expect(offenders).toEqual([])
  })
})

describe('PageWrapper', () => {
  it('leaves the backdrop to the body gradient and renders the grain by default', () => {
    const { container } = render(
      <PageWrapper>
        <p>content</p>
      </PageWrapper>
    )

    // Page-level paper fill removed deliberately: the body paints the
    // --paper base and the --bg-gradient token; an opaque page background
    // would hide both. Island surfaces keep their own fills.
    expect(container.firstElementChild?.className).not.toContain('bg-[var(--paper)]')
    expect(container.firstElementChild?.className).toContain('min-h-screen')
    // GrainOverlay is the fixed decor layer; GridPaper is the absolute one.
    const decor = Array.from(container.querySelectorAll('[aria-hidden="true"]'))
    expect(decor.some((el) => el.className.includes('fixed'))).toBe(true)
    expect(decor.some((el) => el.className.includes('absolute'))).toBe(false)
  })

  it('adds GridPaper when background="grid"', () => {
    const { container } = render(
      <PageWrapper background="grid">
        <p>content</p>
      </PageWrapper>
    )

    const decor = Array.from(container.querySelectorAll('[aria-hidden="true"]'))
    expect(decor.some((el) => el.className.includes('fixed'))).toBe(true)
    expect(decor.some((el) => el.className.includes('absolute'))).toBe(true)
  })

  it('applies no background when background="none"', () => {
    const { container } = render(
      <PageWrapper background="none">
        <p>content</p>
      </PageWrapper>
    )

    expect(container.firstElementChild?.className).not.toContain('bg-[var(--paper)]')
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
  })

  it('reserves bottom padding that clears the fixed MobileNav', () => {
    const { container } = render(
      <PageWrapper>
        <p>content</p>
      </PageWrapper>
    )

    const main = container.querySelector('main')
    const classes = main?.className.split(/\s+/).filter(Boolean) ?? []
    const mobilePadding = classes.find((c) => c.startsWith('pb-'))

    expect(mobilePadding).toBe('pb-20')
    expect(classes).toContain('md:pb-12')
    expect(TAILWIND_SPACING_PX[mobilePadding!]).toBeGreaterThanOrEqual(
      MOBILE_NAV_HEIGHT_PX + 8
    )
  })

  it('uses no banned utility, undefined token, raw colour or gradient', () => {
    const { container } = render(
      <PageWrapper background="grid">
        <p>content</p>
      </PageWrapper>
    )

    const offenders = renderedClasses(container).filter(
      (cls) => BANNED_SUBSTRINGS.some((b) => cls.includes(b)) || BANNED_PATTERN.test(cls)
    )
    expect(offenders).toEqual([])
  })
})
