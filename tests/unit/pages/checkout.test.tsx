// @vitest-environment jsdom
//
// Task 2.5 — Checkout page, AddressForm, CheckoutProgressStepper, OrderSummary,
// PaymentMethod, OrderConfirmation.
//
// Pins the brief's contract for `/checkout`: the four-step flow advances only
// when the current step is valid, the confirmation step renders the order
// number, the settings-driven tax is passed through (not recomputed by hand),
// and the anonymous branch keeps the `callbackUrl` login convention.
//
// The source scan pins the brief's legacy class/token/gradient tables over the
// six owned files.
//
// `next/link`, `next/image`, `next/navigation`, `@/lib/hooks/useAuth`,
// `@/lib/actions/order` and `@/lib/actions/settings` are mocked so the tree
// mounts outside the App Router and the frozen action calls are deterministic.
// `useAuth` is mocked for the same reason the cart test mocks it: the real hook
// reads a NextAuth session, and the checkout page has both an authenticated and
// an anonymous branch that must be reachable from a unit test.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CheckoutPage from '@/app/(customer)/checkout/page'
import { useCartStore } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { createOrder } from '@/lib/actions/order'
import { getSettings } from '@/lib/actions/settings'
import { formatCurrency } from '@/lib/utils'
import type { Address, CartItem, Order, Product } from '@/types'

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
  usePathname: () => '/checkout',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: vi.fn() }))

vi.mock('@/lib/actions/order', () => ({ createOrder: vi.fn() }))

vi.mock('@/lib/actions/settings', () => ({ getSettings: vi.fn() }))

const mockUseAuth = vi.mocked(useAuth)
const mockCreateOrder = vi.mocked(createOrder)
const mockGetSettings = vi.mocked(getSettings)

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

/** A saved address for the authenticated user. */
function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 'addr-1',
    userId: 'u1',
    name: 'Aisha Rahman',
    phone: '+8801712345678',
    addressLine1: 'House 12, Road 5',
    addressLine2: null,
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'Dhaka',
    postalCode: '1212',
    country: 'Bangladesh',
    isDefault: true,
    deliveryZone: 'INSIDE_DHAKA',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

/** A placed order, as `createOrder` resolves it. */
function makeOrder(overrides: Partial<Order> = {}): Order {
  const product = makeProduct('pskull', 'Skull Sticker', 200)
  return {
    id: 'order-1',
    orderNumber: 'BS-1001',
    userId: 'u1',
    status: 'PENDING',
    subtotal: 200,
    taxAmount: 10,
    deliveryCharge: 60,
    discountAmount: 0,
    total: 270,
    currency: 'BDT',
    shippingName: 'Aisha Rahman',
    shippingPhone: '+8801712345678',
    shippingAddress: 'House 12, Road 5',
    shippingCity: 'Dhaka',
    shippingDistrict: 'Dhaka',
    shippingDivision: 'Dhaka',
    shippingPostalCode: '1212',
    deliveryZone: 'INSIDE_DHAKA',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    transactionId: null,
    trackingNumber: null,
    shippedAt: null,
    deliveredAt: null,
    notes: null,
    adminNotes: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    items: [
      {
        id: 'oi-1',
        orderId: 'order-1',
        productId: 'pskull',
        product,
        productName: 'Skull Sticker',
        productSlug: 'pskull',
        productImage: '/pskull.png',
        width: 5,
        height: 5,
        quantity: 1,
        unitPrice: 200,
        totalPrice: 200,
        taxPercent: 5,
        taxAmount: 10,
        customization: null,
      },
    ],
    ...overrides,
  }
}

/**
 * The settings `getSettings()` actually returns: a flat map keyed by the
 * database key (snake_case), with NUMBER values parsed to numbers and BOOLEAN
 * values to booleans (`parseSettingValue`). Mocking the camelCase shape the
 * page used to read would hide a regression to the wrong keys, so this must
 * mirror the action's payload exactly.
 */
const SETTINGS = {
  global_tax_percent: 5,
  delivery_enabled: true,
  free_delivery_threshold: 2000,
  delivery_inside_dhaka_charge: 60,
}

/** An authenticated user with one saved address. */
function authenticatedUser(addresses: Address[] = [makeAddress()]) {
  return {
    user: {
      id: 'u1',
      email: 'aisha@example.com',
      name: 'Aisha',
      role: 'CUSTOMER',
      image: null,
      addresses,
    },
    isAuthenticated: true,
  } as never
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
  // Radix's `RadioGroupItem` measures itself with `@radix-ui/react-use-size`,
  // which constructs a `ResizeObserver` in a layout effect. jsdom has none, so
  // the payment step would throw `ResizeObserver is not defined`.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false } as never)
  mockGetSettings.mockResolvedValue(SETTINGS)
  mockCreateOrder.mockReset()
  window.localStorage.clear()
  useCartStore.getState().clearCart()
})

afterEach(() => {
  vi.unstubAllGlobals()
  useCartStore.getState().clearCart()
  window.localStorage.clear()
})

describe('Checkout page', () => {
  it('advances only when the current step is valid', () => {
    mockUseAuth.mockReturnValue(authenticatedUser())
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200))])

    renderWithProviders(<CheckoutPage />)

    // The address step is first.
    expect(screen.getByRole('heading', { name: 'Address' })).toBeInTheDocument()

    // Continue with no address selected: the step does not advance.
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByRole('heading', { name: 'Address' })).toBeInTheDocument()

    // Select the address, then Continue: the step advances to Payment.
    fireEvent.click(screen.getAllByRole('button', { name: 'Select' })[0])
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByRole('heading', { name: 'Payment' })).toBeInTheDocument()
  })

  it('renders the order number on the confirmation step', async () => {
    mockUseAuth.mockReturnValue(authenticatedUser())
    mockCreateOrder.mockResolvedValue({ success: true, order: makeOrder() as unknown as Awaited<ReturnType<typeof createOrder>>['order'] })
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200))])

    renderWithProviders(<CheckoutPage />)

    // address -> payment -> review -> confirmation
    fireEvent.click(screen.getAllByRole('button', { name: 'Select' })[0])
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => {
      expect(screen.getByText('BS-1001')).toBeInTheDocument()
    })
    // The frozen `createOrder` call is wired to the form values, and the
    // review step's Place Order submits exactly once.
    expect(mockCreateOrder).toHaveBeenCalledTimes(1)
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ addressId: 'addr-1', paymentMethod: 'COD' }),
    )
  })

  it('computes tax and delivery from the snake_case settings getSettings returns', async () => {
    mockUseAuth.mockReturnValue(authenticatedUser())
    mockGetSettings.mockResolvedValue(SETTINGS)
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200), { quantity: 2 })])

    renderWithProviders(<CheckoutPage />)

    // Subtotal 400: 5% tax = 20; below the 2000 threshold, delivery = 60.
    // A regression to the camelCase keys would render Tax 0 / Delivery Free.
    await waitFor(() => {
      expect(summaryRowText('Tax')).toContain(formatCurrency(20))
    })
    expect(summaryRowText('Tax')).not.toContain(formatCurrency(0))
    expect(summaryRowText('Delivery')).toContain(formatCurrency(60))
    expect(summaryRowText('Total')).toContain(formatCurrency(480))
  })

  it('renders Delivery Free at or above the free-delivery threshold', async () => {
    mockUseAuth.mockReturnValue(authenticatedUser())
    mockGetSettings.mockResolvedValue(SETTINGS)
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200), { quantity: 10 })])

    renderWithProviders(<CheckoutPage />)

    // Subtotal 2000: 5% tax = 100; at the threshold, delivery is free.
    await waitFor(() => {
      expect(summaryRowText('Delivery')).toContain('Free')
    })
    expect(summaryRowText('Tax')).toContain(formatCurrency(100))
    expect(summaryRowText('Total')).toContain(formatCurrency(2100))
  })

  it('links the sign-in card to /login?callbackUrl=/checkout', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false } as never)
    useCartStore
      .getState()
      .setItems([makeCartItem(makeProduct('pskull', 'Skull Sticker', 200))])

    renderWithProviders(<CheckoutPage />)

    // Ruling 3: the login page reads `callbackUrl`, not `redirect`. The
    // checkout page must keep the one convention that works.
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/login?callbackUrl=/checkout')
    expect(link.getAttribute('href')).not.toContain('redirect')
  })
})

/** The six files this task owns. */
const OWNED_FILES = [
  'src/app/(customer)/checkout/page.tsx',
  'src/components/checkout/AddressForm.tsx',
  'src/components/checkout/CheckoutProgressStepper.tsx',
  'src/components/checkout/OrderSummary.tsx',
  'src/components/checkout/PaymentMethod.tsx',
  'src/components/checkout/OrderConfirmation.tsx',
]

/** Legacy classes/tokens from the brief's tables (Ruling 4) and Step 1. */
const LEGACY_CLASSES = [
  // Undefined / renamed tokens
  'bg-[var(--bg-color)]',
  'bg-[var(--light)]',
  'border-[var(--light)]',
  'text-primary',
  'hover:text-primary',
  'border-primary',
  'fill-primary',
  'text-body',
  'text-secondary',
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
  'bg-green-50',
  'border-green-200',
  'focus:ring-primary',
  'font-body',
  // Gradients are banned (contract §5 / Ruling 6)
  'bg-gradient-to-r',
  'bg-gradient-to-br',
  'from-[var(--primary)]',
  'to-[var(--secondary)]',
  'from-[var(--accent)]',
  'to-[var(--pink)]',
  // The deprecated decor shim and its shapes (Ruling 7)
  'DoodleElements',
  'DoodleBackground',
  'DoodleShape',
]

const LEGACY_TOKENS = [
  'var(--bg-color)',
  'var(--light)',
  'var(--primary)',
  'var(--secondary)',
  'var(--accent)',
  'var(--dark)',
]

/** `Button` has no `doodle` variant (Ruling 4 mapping); `Card` does. */
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
