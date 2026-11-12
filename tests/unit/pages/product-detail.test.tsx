// @vitest-environment jsdom
//
// Task 2.3 — Product detail page, ProductDetail and ReviewList.
//
// Pins the brief's contract: the dimension chips render from the product, the
// displayed unit price comes from the real `priceLine` helper (the old ad-hoc
// `200 * 1.2` rendered `240.00000000000003`), the size upcharge is rounded
// (`+20%`, and no spurious `+0%` on the default size), and ReviewList renders
// the reviewer name and comment.
//
// The source scan pins the brief's legacy class/token table, the Decimal
// compare rule (no relational compare on a raw `product.*` price field) and
// the prop-mutation rule (no `.sort(` applied directly to a `product.*` prop).
//
// `next/link` and `next/image` are mocked so the tree mounts outside the App
// Router; `IntersectionObserver` is stubbed because framer-motion's
// `whileInView` creates one on mount.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductDetail } from '@/components/product/ProductDetail'
import { ReviewList } from '@/components/product/ReviewList'
import type { Product, Review } from '@/types'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({
    fill,
    sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => (
    <img {...props} />
  ),
}))

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
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const DIMENSIONS = [
  { id: 'dim-5x5', width: 5, height: 5, label: '5×5cm', priceMultiplier: 1, isDefault: true, sortOrder: 0 },
  { id: 'dim-6x4', width: 6, height: 4, label: '6×4cm', priceMultiplier: 1.2, isDefault: false, sortOrder: 1 },
  { id: 'dim-8x5', width: 8, height: 5, label: '8×5cm', priceMultiplier: 1.5, isDefault: false, sortOrder: 2 },
]

const QUANTITY_TIERS = [
  { id: 'qty-1-9', minQty: 1, maxQty: 9, pricePerUnit: 200, label: '1–9', sortOrder: 0 },
  { id: 'qty-10-plus', minQty: 10, maxQty: null, pricePerUnit: 180, label: '10+', sortOrder: 1 },
]

/** A product that satisfies the `Product` type, priced so `priceLine` is observable. */
function makeProduct(): Product {
  return {
    id: 'prod-skull',
    name: 'Skull Sticker',
    slug: 'skull-sticker',
    description: 'A die-cut vinyl sticker.',
    basePrice: 200,
    compareAtPrice: 280,
    images: ['/images/stickers/skull_sticker.png'],
    categoryId: 'cat-vinyl',
    allowedDimensions: DIMENSIONS,
    allowedQuantities: QUANTITY_TIERS,
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

const REVIEW: Review = {
  id: 'rev-1',
  userId: 'user-1',
  user: {
    id: 'user-1',
    email: 'aisha@example.com',
    name: 'Aisha Rahman',
    role: 'CUSTOMER',
    phone: null,
    avatar: null,
    emailVerified: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  productId: 'prod-skull',
  rating: 5,
  title: 'Great quality',
  comment: 'The vinyl feels premium and the colours are vivid.',
  images: [],
  isVerifiedPurchase: true,
  isApproved: true,
  helpfulCount: 3,
  createdAt: new Date('2026-01-02T00:00:00Z'),
}

/** Renders the app chrome the components expect: session + query client. */
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

describe('ProductDetail', () => {
  it('renders one chip per allowed dimension, by label', () => {
    renderWithProviders(<ProductDetail product={makeProduct()} />)

    expect(screen.getByRole('radio', { name: /5×5cm/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /6×4cm/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /8×5cm/ })).toBeInTheDocument()
  })

  it('shows the priceLine unit price and rounds the size upcharge', () => {
    renderWithProviders(<ProductDetail product={makeProduct()} />)

    expect(screen.getByTestId('unit-price').textContent).toBe('200 BDT')

    fireEvent.click(screen.getByRole('radio', { name: /6×4cm/ }))

    expect(screen.getByTestId('unit-price').textContent).toBe('240 BDT')
    // The old ad-hoc `unitPrice * dimensionMultiplier` rendered this.
    expect(screen.queryByText('240.00000000000003 BDT')).toBeNull()
  })

  it('rounds the size upcharge and hides it on the default size', () => {
    renderWithProviders(<ProductDetail product={makeProduct()} />)

    const defaultChip = screen.getByRole('radio', { name: /5×5cm/ })
    const upchargeChip = screen.getByRole('radio', { name: /6×4cm/ })

    expect(defaultChip.textContent).not.toContain('%')
    expect(upchargeChip.textContent).toContain('+20%')
  })
})

describe('ReviewList', () => {
  it('renders the reviewer name and comment', () => {
    renderWithProviders(
      <ReviewList
        reviews={[REVIEW]}
        productId="prod-skull"
        averageRating={5}
        totalReviews={1}
        ratingDistribution={{ 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 }}
        canReview={false}
      />,
    )

    expect(screen.getByText('Aisha Rahman')).toBeInTheDocument()
    expect(screen.getByText('The vinyl feels premium and the colours are vivid.')).toBeInTheDocument()
  })
})

/** Legacy classes/tokens from the brief's tables and Ruling 2. */
const LEGACY_CLASSES = [
  // Renamed / undefined tokens
  'bg-[var(--bg-color)]',
  'text-primary',
  'hover:text-primary',
  'border-primary',
  'bg-primary',
  'fill-primary',
  'text-secondary',
  'text-body',
  'bg-[var(--light)]',
  'border-[var(--light)]',
  'rounded-card',
  'rounded-input',
  'border-3',
  'shadow-card',
  'focus:shadow-input',
  'focus:border-primary',
  'bg-dark/10',
  'text-red-500',
  'hover:text-red-500',
  'focus-visible:ring-[var(--accent)]',
  'hover:border-white/50',
  'text-white',
  'hover:text-white',
  // Ruling 5 is Button-scoped: `Badge` keeps its real `doodle` sticker-badge
  // variant (spec §5.8); `Button` does not have one.
  'variant="doodle-outline"',
  'doodle-outline',
  'DoodleElements',
  // Hardcoded colour (contract §1) and ad-hoc ink opacity on text (contract §2)
  'rgba(',
  'text-[color-mix(',
  'text-[var(--ink)]',
  // `prose` is a no-op — no typography plugin is installed
  'prose',
  // Glass is banned (contract §5)
  'bg-black/50',
  'backdrop-blur',
]

const LEGACY_TOKENS = ['var(--bg-color)', 'var(--light)', 'var(--secondary)', 'var(--dark)']

const OWNED_FILES = [
  'src/app/(customer)/shop/[slug]/page.tsx',
  'src/components/product/ProductDetail.tsx',
  'src/components/product/ReviewList.tsx',
]

/**
 * A relational compare is only safe when both operands are coerced. Raw
 * `product.basePrice` / `product.compareAtPrice` access is never safe — a
 * Decimal serialises to a string, so `>` is lexicographic. Bare locals are
 * safe because `ProductDetail` coerces both at the top of the component
 * (`Number(product.basePrice)`, `Number(product.compareAtPrice)`).
 */
const RAW_PRICE_COMPARE_RE =
  /product\.(?:basePrice|compareAtPrice)\s*[<>]=?|[<>]=?\s*product\.(?:basePrice|compareAtPrice)/

/** `.sort(` directly on a `product.*` prop mutates the prop in place. */
const PROP_SORT_RE = /product\.[A-Za-z_][A-Za-z0-9_]*\.sort\(/

/** `Button` has no `doodle` variant (Ruling 5); `Badge` does. */
const BUTTON_DOODLE_RE = /<Button\b[^>]*variant="doodle"/

describe('Owned source files', () => {
  it('leave no legacy class or undefined token behind', () => {
    for (const file of OWNED_FILES) {
      const source = readFileSync(file, 'utf8')

      for (const legacy of LEGACY_CLASSES) {
        expect(source, `${file} contains ${legacy}`).not.toContain(legacy)
      }
      for (const token of LEGACY_TOKENS) {
        expect(source, `${file} contains ${token}`).not.toContain(token)
      }
    }
  })

  it('never compares a raw price field without coercing it', () => {
    for (const file of OWNED_FILES) {
      const source = readFileSync(file, 'utf8')
      expect(source, `${file} compares a raw price field`).not.toMatch(RAW_PRICE_COMPARE_RE)
    }
  })

  it('never sorts a product prop in place', () => {
    for (const file of OWNED_FILES) {
      const source = readFileSync(file, 'utf8')
      expect(source, `${file} sorts a product prop`).not.toMatch(PROP_SORT_RE)
    }
  })

  it('gives Button no doodle variant', () => {
    for (const file of OWNED_FILES) {
      const source = readFileSync(file, 'utf8')
      expect(source, `${file} passes variant="doodle" to Button`).not.toMatch(BUTTON_DOODLE_RE)
    }
  })
})
