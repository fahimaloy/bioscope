// @vitest-environment jsdom
//
// Task 2.4 — Cart page, CartItem, CartSummary, PromoCode.
//
// Pins the brief's contract for `/cart`: the empty state (a real `h1`, one
// decor accent, a shop link), the items rendered from the frozen cart store
// with the store's own subtotal, a quantity stepper that recomputes the
// totals, tax read from `/api/settings/public` (the pre-rebuild page
// hardcoded 10%), and a checkout CTA that is a real link — `/checkout` when
// authenticated, `/login?redirect=/checkout` when anonymous — instead of the
// dead `onCheckout={() => {}}` button.
//
// The source scan pins the brief's legacy class/token table, the no-gradient
// rule, the Button-only `doodle` ban, and the `hidden`/`visible` motion
// state names.
//
// `next/link`, `next/image` and `next/navigation` are mocked so the tree
// mounts outside the App Router; `fetch` is stubbed, so the page's real
// settings effect runs its real code path.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CartPage from '@/app/(customer)/cart/page'
import { useCartStore, useCartSubtotal } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import type { CartItem, Product } from '@/types'

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

vi.mock('next/navigation', () => ({
  usePathname: () => '/cart',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

// `useAuth` is mocked so the authenticated branch of the checkout CTA is
// deterministic; the anonymous branch is the default return value.
vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: vi.fn() }))

const mockUseAuth = vi.mocked(useAuth)

const DIMENSION = {
  id: 'd1',
  width: 5,
  height: 5,
  label: '5×5cm',
  priceMultiplier: 1,
  isDefault: true,
  sortOrder: 0,
}

/** A minimal product that satisfies the `Product` type. */
function makeProduct(id: string, name: string, basePrice: number): Product {
  return {
    id,
    name,
    slug: id,
    description: null,
    basePrice,
    compareAtPrice: null,
    images: [`/${id}.png`],
    categoryId: 'cat-vinyl',
    allowedDimensions: [DIMENSION],
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
}

/** A cart item; `unitPrice` defaults to the product's base price. */
function makeCartItem(product: Product, overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: `ci-${product.id}`,
    cartId: 'local',
    productId: product.id,
    product,
    productName: product.name,
    productSlug: product.slug,
    productImage: product.images[0] ?? null,
    unitPrice: product.basePrice,
    width: DIMENSION.width,
    height: DIMENSION.height,
    quantity: 1,
    customization: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

function json(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response
}

/** The server's own defaults (`src/lib/actions/settings.ts`). */
const DEFAULT_SETTINGS = {
  global_tax_percent: 5,
  delivery_inside_dhaka_charge: 60,
  free_delivery_threshold: 2000,
}

/** Stubs `fetch` with the real `/api/settings/public` envelope (`ok(settings)`). */
function stubSettings(overrides: Record<string, unknown> = {}) {
  const fetchMock = vi.fn(async () =>
    json({ success: true, data: { ...DEFAULT_SETTINGS, ...overrides } }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Renders the app chrome the page expects: session + query client. */
function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return render(
    <SessionProvider session={null}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </SessionProvider>,
  )
}

/** Renders the store's `useCartSubtotal()` value next to the page. */
function SubtotalProbe() {
  const subtotal = useCartSubtotal()
  return <span data-testid="probe-subtotal">{subtotal}</span>
}

/**
 * The raw `textContent` of the summary row labelled `label`.
 *
 * `formatCurrency` emits a non-breaking space (`BDT 800`), and Testing Library
 * normalises the node's text but not a string matcher, so a plain
 * `getByText(formatCurrency(…))` never matches. Reading the row's raw
 * `textContent` (the brief's "assert raw textContent for money") is exact.
 */
function summaryRowText(label: string): string | null {
  const labelEl = screen.queryByText(label)
  return labelEl?.closest('div')?.textContent ?? null
}

beforeEach(() => {
  // jsdom has no IntersectionObserver, and framer-motion's `whileInView`
  // creates one on mount. The stub never fires, so in-view sections stay at
  // their initial variant — the assertions below are text/role queries, which
  // are not affected by the resulting opacity.
  class IntersectionObserverStub {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false } as never)
  window.localStorage.clear()
  useCartStore.getState().clearCart()
})

afterEach(() => {
  vi.unstubAllGlobals()
  useCartStore.getState().clearCart()
  window.localStorage.clear()
})

describe('Cart page', () => {
  it('renders the empty state with one decor accent and a shop link', () => {
    stubSettings()
    const { container } = renderWithProviders(<CartPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Your cart is empty' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue shopping/i })).toHaveAttribute('href', '/shop')
    // Contract §3: one decor accent per section. The pre-rebuild empty state
    // stacked three `DoodleShape`s here. (`:not(.lucide)` excludes the UI
    // icon set, which is chrome, not decor.)
    expect(container.querySelectorAll('svg[aria-hidden="true"]:not(.lucide)')).toHaveLength(1)
  })

  it('renders the seeded items and the store subtotal', () => {
    stubSettings()
    const skull = makeProduct('pskull', 'Skull Sticker', 200)
    const flower = makeProduct('pflower', 'Flower Sticker', 300)
    useCartStore.getState().setItems([
      makeCartItem(skull, { quantity: 1, unitPrice: 200 }),
      makeCartItem(flower, { quantity: 2, unitPrice: 300 }),
    ])

    renderWithProviders(
      <>
        <CartPage />
        <SubtotalProbe />
      </>,
    )

    expect(screen.getByText('Skull Sticker')).toBeInTheDocument()
    expect(screen.getByText('Flower Sticker')).toBeInTheDocument()

    // 200×1 + 300×2 = 800, read from the store's own subtotal selector.
    const subtotal = Number(screen.getByTestId('probe-subtotal').textContent)
    expect(subtotal).toBe(800)
    expect(summaryRowText('Subtotal')).toContain(formatCurrency(subtotal))
  })

  it('recomputes the totals when a quantity stepper changes', () => {
    stubSettings()
    const skull = makeProduct('pskull', 'Skull Sticker', 200)
    const flower = makeProduct('pflower', 'Flower Sticker', 300)
    useCartStore.getState().setItems([
      makeCartItem(skull, { quantity: 1, unitPrice: 200 }),
      makeCartItem(flower, { quantity: 2, unitPrice: 300 }),
    ])

    renderWithProviders(
      <>
        <CartPage />
        <SubtotalProbe />
      </>,
    )
    expect(Number(screen.getByTestId('probe-subtotal').textContent)).toBe(800)

    fireEvent.click(screen.getAllByRole('button', { name: 'Increase quantity' })[0])

    // 200×2 + 300×2 = 1000.
    expect(Number(screen.getByTestId('probe-subtotal').textContent)).toBe(1000)
    expect(summaryRowText('Subtotal')).toContain(formatCurrency(1000))
  })

  it('charges the settings tax rate, not a hardcoded 10%', async () => {
    const fetchMock = stubSettings({ global_tax_percent: 5 })
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200))])

    renderWithProviders(<CartPage />)

    expect(fetchMock).toHaveBeenCalledWith('/api/settings/public')
    // 5% of 200 = 10. The pre-rebuild page hardcoded 10% and rendered 20.
    await waitFor(() => {
      expect(summaryRowText('Tax')).toContain(formatCurrency(10))
    })
    expect(summaryRowText('Tax')).not.toContain(formatCurrency(20))
  })

  it('follows /api/settings/public when it returns a non-default tax rate', async () => {
    stubSettings({ global_tax_percent: 8 })
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200))])

    renderWithProviders(<CartPage />)

    // The fallback is 5% (10 BDT); once the settings resolve the page must
    // show 8% (16 BDT) — proof the value is fetched, not a constant.
    await waitFor(() => {
      expect(summaryRowText('Tax')).toContain(formatCurrency(16))
    })
    expect(summaryRowText('Tax')).not.toContain(formatCurrency(10))
  })

  it('links the checkout CTA to /checkout when authenticated', () => {
    stubSettings()
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200))])
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'aisha@example.com', name: 'Aisha', role: 'CUSTOMER', image: null },
      isAuthenticated: true,
    } as never)

    renderWithProviders(<CartPage />)

    expect(screen.getByRole('link', { name: /proceed to checkout/i })).toHaveAttribute(
      'href',
      '/checkout',
    )
  })

  it('links the checkout CTA to /login?redirect=/checkout when anonymous', () => {
    stubSettings()
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200))])
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false } as never)

    renderWithProviders(<CartPage />)

    expect(screen.getByRole('link', { name: /login to checkout/i })).toHaveAttribute(
      'href',
      '/login?redirect=/checkout',
    )
  })
})

/** The four files this task owns. */
const OWNED_FILES = [
  'src/app/(customer)/cart/page.tsx',
  'src/components/cart/CartItem.tsx',
  'src/components/cart/CartSummary.tsx',
  'src/components/cart/PromoCode.tsx',
]

/** Legacy classes/tokens from the brief's tables (Ruling 2) and Step 1. */
const LEGACY_CLASSES = [
  // Undefined / renamed tokens
  'bg-[var(--bg-color)]',
  'bg-[var(--light)]',
  'border-[var(--light)]',
  'text-primary',
  'hover:text-primary',
  'text-body',
  'font-body',
  'bg-white',
  'rounded-card',
  'rounded-input',
  'border-3',
  'shadow-card',
  'text-red-500',
  'hover:text-red-500',
  'hover:bg-red-50',
  'text-green-600',
  'text-green-700',
  'text-green-800',
  'bg-green-50',
  'border-green-200',
  // Gradients are banned (contract §5)
  'bg-gradient-to-r',
  'from-[var(--primary)]',
  'to-[var(--accent)]',
  // Ad-hoc ink opacity on text is banned (contract §2)
  'text-[color-mix(in_srgb,var(--ink)_70%,transparent)]',
  // The deprecated decor shim and its shapes
  'DoodleElements',
  'DoodleShape',
]

const LEGACY_TOKENS = [
  'var(--bg-color)',
  'var(--light)',
  'var(--primary)',
  'var(--accent)',
  'var(--secondary)',
  'var(--dark)',
]

/** `Button` has no `doodle` variant (Ruling 7); `Card` does. */
const BUTTON_DOODLE_RE = /<Button\b[^>]*variant="doodle"/

/** `hidden`/`visible` are not motion state names (`src/lib/motion.ts` defines `initial`/`animate`/`exit`). */
const BAD_MOTION_STATE_RE =
  /(?:initial|animate|exit|whileInView|whileHover|whileTap|whileFocus)="(?:hidden|visible)"/

describe('Owned source files', () => {
  it('leave no legacy class, undefined token, gradient or bad motion state behind', () => {
    for (const file of OWNED_FILES) {
      const source = readFileSync(file, 'utf8')

      for (const legacy of LEGACY_CLASSES) {
        expect(source, `${file} contains ${legacy}`).not.toContain(legacy)
      }
      for (const token of LEGACY_TOKENS) {
        expect(source, `${file} contains ${token}`).not.toContain(token)
      }
      expect(source, `${file} passes variant="doodle" to Button`).not.toMatch(BUTTON_DOODLE_RE)
      expect(source, `${file} uses a hidden/visible motion state`).not.toMatch(BAD_MOTION_STATE_RE)
    }
  })
})
