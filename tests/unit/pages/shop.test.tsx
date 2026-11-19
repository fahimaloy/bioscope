// @vitest-environment jsdom
//
// Task 2.2 — Shop page and ProductGrid.
//
// Pins the brief's contract for `/shop`: a real `h1`, the fetched products,
// a category filter that refetches with `categoryId=…` and changes the
// rendered set, a working pager, and a grid whose column classes are real
// Tailwind utilities. The `grid-cols-${n}` template string is invisible to
// Tailwind's source scanner and is the defect under repair — the grid
// rendered one column at every viewport.
//
// The source scan pins the brief's legacy class/token/emoji table and the
// no-`grid-cols-${…}`-interpolation rule for `ProductCard.tsx`.
//
// `next/link` and `next/image` are mocked so the tree mounts outside the App
// Router; `fetch` is stubbed, so the page's own effect-driven data flow runs
// its real code path.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ShopPage from '@/app/(customer)/shop/page'
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
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}))

// E10 — ProductSearchBox uses useRouter; mount outside the App Router.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/shop',
  useSearchParams: () => new URLSearchParams(),
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
function makeProduct(id: string, name: string, categoryId: string, basePrice: number): Product {
  return {
    id,
    name,
    slug: id,
    description: null,
    basePrice,
    compareAtPrice: null,
    images: [`/${id}.png`],
    categoryId,
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

const CATEGORY = { id: 'cat-vinyl', name: 'Vinyl', slug: 'vinyl' }

/**
 * The catalog the stubbed `/api/products` serves. Two products belong to the
 * "Vinyl" category, so filtering visibly changes the rendered set.
 */
const CATALOG = [
  makeProduct('p-general', 'General Sticker', 'cat-general', 200),
  makeProduct('p-vinyl-1', 'Vinyl Only Sticker', 'cat-vinyl', 300),
  makeProduct('p-vinyl-2', 'Vinyl Second Sticker', 'cat-vinyl', 400),
]

function json(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response
}

/**
 * Stubs `fetch` with the real `/api/products` + `/api/categories` envelopes
 * (`ok()` → `{ success, data: { data, pagination } }`). `totalPages` is always
 * 2 so the pager renders.
 */
function stubFetch() {
  const fetchMock = vi.fn(async (input: string | URL | Request): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url.includes('/api/categories')) {
      return json({
        success: true,
        data: { data: [CATEGORY], pagination: { page: 1, limit: 100, total: 1 } },
      })
    }

    if (url.includes('/api/products')) {
      const params = new URLSearchParams(url.split('?')[1] ?? '')
      const categoryId = params.get('categoryId')
      const data = categoryId ? CATALOG.filter((p) => p.categoryId === categoryId) : CATALOG
      return json({
        success: true,
        data: {
          data,
          pagination: {
            page: 1,
            limit: 12,
            total: data.length,
            totalPages: 2,
            hasNext: true,
            hasPrev: false,
          },
        },
      })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Renders the app chrome the page's cards expect: session + query client. */
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

describe('Shop page', () => {
  it('renders a real h1 and the fetched products', async () => {
    const fetchMock = stubFetch()
    renderWithProviders(<ShopPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Our Stickers' })).toBeInTheDocument()
    expect(await screen.findByText('General Sticker')).toBeInTheDocument()
    expect(screen.getByText('Vinyl Only Sticker')).toBeInTheDocument()
    expect(screen.getByText('Vinyl Second Sticker')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/products'))
  })

  it('refetches with categoryId and changes the rendered set when a category pill is clicked', async () => {
    const fetchMock = stubFetch()
    renderWithProviders(<ShopPage />)
    expect(await screen.findByText('General Sticker')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Vinyl' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes('categoryId=cat-vinyl')),
      ).toBe(true)
    })

    expect(await screen.findByText('Vinyl Only Sticker')).toBeInTheDocument()
    expect(screen.getByText('Vinyl Second Sticker')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('General Sticker')).not.toBeInTheDocument()
    })
  })

  it('renders pagination with a page-2 control', async () => {
    stubFetch()
    renderWithProviders(<ShopPage />)
    expect(await screen.findByText('General Sticker')).toBeInTheDocument()

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
  })

  it('uses real Tailwind grid utilities, not a computed grid-cols string', async () => {
    stubFetch()
    renderWithProviders(<ShopPage />)
    expect(await screen.findByText('General Sticker')).toBeInTheDocument()

    const grid = screen.getByText('General Sticker').closest('.grid')
    expect(grid).not.toBeNull()
    expect(grid?.className).toContain('grid-cols-2')
    expect(grid?.className).toContain('sm:grid-cols-3')
    expect(grid?.className).toContain('lg:grid-cols-4')
  })
})

/** Legacy classes/tokens from the brief's table (Ruling 4) plus the shim set. */
const LEGACY_CLASSES = [
  'bg-[var(--bg-color)]',
  'bg-white',
  'border-[var(--light)]',
  'bg-[var(--light)]',
  'text-primary',
  'hover:text-primary',
  'rounded-input',
  'bg-dark',
  'text-white',
  'staggered-title',
  'section-title',
  'subtitle',
  'doodle-outline',
  'variant="doodle"',
  'DoodleBackground',
  'DoodleShape',
  'DoodleElements',
]

const LEGACY_TOKENS = ['var(--bg-color)', 'var(--light)']

/** Emoji are not icons (Ruling 6, spec §5.6). */
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u

const OWNED_FILES = [
  'src/app/(customer)/shop/page.tsx',
  'src/components/product/ProductCard.tsx',
  'src/components/ui/GlobalLoading.tsx',
]

describe('Owned source files', () => {
  it('leave no legacy class, undefined token or emoji behind', () => {
    for (const file of OWNED_FILES) {
      const source = readFileSync(file, 'utf8')

      for (const legacy of LEGACY_CLASSES) {
        expect(source, `${file} contains ${legacy}`).not.toContain(legacy)
      }
      for (const token of LEGACY_TOKENS) {
        expect(source, `${file} contains ${token}`).not.toContain(token)
      }
      expect(source, `${file} contains emoji`).not.toMatch(EMOJI_PATTERN)
    }
  })

  it('build the ProductGrid columns from static literals, never a template string', () => {
    const source = readFileSync('src/components/product/ProductCard.tsx', 'utf8')
    expect(source).not.toContain('`grid-cols-${')
  })
})
