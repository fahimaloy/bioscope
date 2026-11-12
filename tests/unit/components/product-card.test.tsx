// @vitest-environment jsdom
//
// Task 2.1 — ProductCard (Clean sheet) and the landing page.
//
// Pins the brief's contract for `<ProductCard />`: the product name, the price
// formatted with the BDT symbol, an add-to-cart control, the 1:1 image area
// with the default sticker image when `product.images` is empty, and the
// Clean-sheet surface (flat 2px ink border, `--shadow-color` offset shadow,
// no rotation, no die-cut outline).
//
// Pins the landing page's Editorial hero: a real `h1` containing "stick",
// featured products that come from `featuredProductsOptions()`, and the
// rebuild's hard requirements from docs/DESIGN_CONTRACT.md §1 (token-only
// colour), §2 (text from the three text roles — no ad-hoc `--ink` opacity),
// §3 (one decor accent per section) and the task's Ruling 1 (no legacy class
// name survives in the two owned files) / Ruling 4 (no emoji) / Ruling 5
// (decor from `@/components/decorative`, not the `DoodleElements` shim).
//
// `next/link` and `next/image` are mocked so the tree mounts outside the App
// Router; the featured-products query is served from a real QueryClient with
// the data seeded, so `useQuery` runs its actual code path.

import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductCard } from '@/components/product/ProductCard'
import HomePage from '@/app/page'
import { featuredProductsOptions } from '@/lib/queries/products'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

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

beforeAll(() => {
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

const DEFAULT_DIMENSION = {
  id: 'd1',
  width: 5,
  height: 5,
  label: '5×5cm',
  priceMultiplier: 1,
  isDefault: true,
  sortOrder: 0,
}

/** A minimal product that satisfies the `Product` type. */
const product: Product = {
  id: 'p1',
  name: 'Test Sticker',
  slug: 'test-sticker',
  description: null,
  basePrice: 250,
  compareAtPrice: null,
  images: ['/test-sticker.png'],
  categoryId: 'c1',
  allowedDimensions: [DEFAULT_DIMENSION],
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

/** The featured product the seeded query returns to the landing page. */
const LANDING_FEATURED: Product = {
  ...product,
  id: 'f1',
  name: 'Landing Feature Sticker',
  slug: 'landing-feature-sticker',
  basePrice: 420,
  isFeatured: true,
}

/** Renders the app chrome the components expect: session + query client. */
function renderWithProviders(ui: ReactNode, withQueryData = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  if (withQueryData) {
    queryClient.setQueryData(featuredProductsOptions().queryKey, {
      success: true,
      data: { data: [LANDING_FEATURED], pagination: { page: 1, limit: 8, total: 1 } },
    })
  }
  return render(
    <SessionProvider session={null}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </SessionProvider>,
  )
}

/** Every class token in the rendered tree. */
function renderedClasses(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[class]')).flatMap((el) =>
    (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean),
  )
}

/** Legacy utility classes the token pipeline never defined (Ruling 1 + Task 1.x). */
const LEGACY_CLASSES = [
  'text-primary',
  'bg-primary',
  'border-primary',
  'hover:border-primary',
  'fill-primary',
  'rounded-card',
  'rounded-input',
  'text-red-500',
  'hover:bg-red-50',
  'bg-dark',
  'bg-white',
  'text-body',
  'border-3',
  'shadow-glass',
  // Tailwind compiles `shadow-[var(--shadow-*)]` into a rule with no
  // `box-shadow` declaration (only `--tw-shadow-color`/`--tw-shadow`), so the
  // shadow silently never renders. The config-mapped `shadow-*` utilities work.
  'shadow-[var(--shadow-',
]

/** Undefined colour tokens — Ruling 2 and the Task 1.7 fix rounds. */
const LEGACY_TOKENS = [
  'var(--bg-color)',
  'var(--primary)',
  'var(--secondary)',
  'var(--tertiary)',
  'var(--light)',
  'var(--purple)',
  'var(--dark)',
]

/** Deprecated decor shim and the CSS-only title animation (Ruling 5 / Ruling 6). */
const LEGACY_DECOR = ['DoodleBackground', 'DoodleElements', 'staggered-title', 'floating-emojis']

/** Ad-hoc `--ink`/`--paper` opacity used as a text colour (Contract §2, Ruling 3). */
const LEGACY_TEXT_OPACITY = [
  'text-[color-mix(in_srgb,var(--ink)_',
  'text-[color-mix(in_srgb,var(--paper)_',
]

/** Emoji are not icons (Ruling 4, spec §5.6). */
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u

const OWNED_FILES = ['src/app/page.tsx', 'src/components/product/ProductCard.tsx']

describe('ProductCard', () => {
  it('renders the product name', () => {
    renderWithProviders(<ProductCard product={product} />)
    expect(screen.getByText('Test Sticker')).toBeInTheDocument()
  })

  it('renders the price formatted with the BDT symbol', () => {
    renderWithProviders(<ProductCard product={product} />)
    // `formatCurrency` emits a non-breaking space (BDT 250); match the raw
    // text node so the query is not defeated by the whitespace normaliser.
    const matches = screen.getAllByText(
      (_content, el) => el?.textContent === formatCurrency(250),
    )
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders an add-to-cart control', () => {
    renderWithProviders(<ProductCard product={product} />)
    expect(screen.getByRole('button', { name: /to cart/i })).toBeInTheDocument()
  })

  it('uses the Clean-sheet surface: 2px ink border, colored offset shadow, 1:1 image', () => {
    const { container } = renderWithProviders(<ProductCard product={product} />)
    const classes = renderedClasses(container)

    expect(classes).toContain('border-2')
    expect(classes).toContain('border-[var(--ink)]')
    expect(classes).toContain('shadow-color')
    expect(classes).toContain('aspect-square')
    // The pre-rebuild `featured` variant used a 4:5 image area.
    expect(classes).not.toContain('aspect-[4/5]')
    expect(classes).not.toContain('rotate-')
  })

  it('falls back to the default sticker image when the product has no images', () => {
    const { container } = renderWithProviders(
      <ProductCard product={{ ...product, images: [] }} />,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/images/stickers/skull_sticker.png',
    )
  })
})

describe('Landing page', () => {
  it('renders a real h1 containing "stick"', () => {
    renderWithProviders(<HomePage />, true)
    expect(screen.getByRole('heading', { level: 1, name: /stick/i })).toBeInTheDocument()
  })

  it('renders the featured products from the query', () => {
    renderWithProviders(<HomePage />, true)
    expect(screen.getByText('Landing Feature Sticker')).toBeInTheDocument()
  })

  it('leaves no legacy class, undefined token, shim, emoji or ink-opacity text', () => {
    for (const file of OWNED_FILES) {
      const source = readFileSync(file, 'utf8')

      for (const legacy of LEGACY_CLASSES) {
        expect(source, `${file} contains ${legacy}`).not.toContain(legacy)
      }
      for (const token of LEGACY_TOKENS) {
        expect(source, `${file} contains ${token}`).not.toContain(token)
      }
      for (const decor of LEGACY_DECOR) {
        expect(source, `${file} contains ${decor}`).not.toContain(decor)
      }
      for (const text of LEGACY_TEXT_OPACITY) {
        expect(source, `${file} contains ${text}`).not.toContain(text)
      }
      expect(source, `${file} contains emoji`).not.toMatch(EMOJI_PATTERN)
    }
  })
})
