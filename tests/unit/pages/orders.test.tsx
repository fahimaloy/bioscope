// @vitest-environment jsdom
//
// Task 2.7 — customer orders list and detail.
//
// Pins the brief's Step 1 contract:
//   1. the list renders one card per order, each carrying a status badge;
//   2. the detail renders the order number, its items and the timeline steps
//      derived from the order timestamps;
//   3. the four owned files use real tokens — no `var(--primary)` /
//      `var(--secondary)` / `--bg-color`, no `text-primary`, no gradient, and
//      none of the duplicated `STATUS_DOT_COLOR` / `STATUS_BADGE_VARIANT`
//      maps — and the list renders its statuses through the shared
//      `StatusBadge`.
//
// `next/link`, `next/image` and `next/navigation` are mocked so both pages
// mount outside the App Router. `fetch` is stubbed with the **real** API
// envelopes (`ok(...)` in `src/lib/api-utils.ts`): `/api/orders` answers
// `data: { data, pagination }` and `/api/orders/[id]` answers
// `data: { order }`. A stub that mocks the page's assumption instead of the
// route's actual payload would prove nothing.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrdersPage from '@/app/(customer)/orders/page'
import OrderDetailPage from '@/app/(customer)/orders/[id]/page'
import { formatCurrency } from '@/lib/utils'

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

const ORDER_ID = 'ord-1'

// `useRouter` must return a STABLE object. Both pages put `router` in the
// dependency array of a `useCallback` that a `useEffect` re-runs, so a fresh
// object per render makes the effect re-fire forever and the page flip back to
// its loading skeletons after the data arrives.
const { mockRouter } = vi.hoisted(() => ({
  mockRouter: { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/orders',
  useParams: () => ({ id: ORDER_ID }),
  useSearchParams: () => new URLSearchParams(),
}))

/** A minimal `Response` double — the pages only read `ok`, `status` and `json()`. */
function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response
}

/** The list page's item shape (`OrderListItem['items'][number]`). */
interface ListItem {
  productName: string
  productSlug: string
  productImage: string | null
  quantity: number
  unitPrice: number
  width: number
  height: number
}

interface ListOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: ListItem[]
}

const LIST_ORDERS: ListOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'BS-1001',
    status: 'PENDING',
    total: 800,
    createdAt: '2026-01-05T10:00:00.000Z',
    items: [
      {
        productName: 'Skull Sticker',
        productSlug: 'skull-sticker',
        productImage: null,
        quantity: 2,
        unitPrice: 400,
        width: 5,
        height: 5,
      },
    ],
  },
  {
    id: 'ord-2',
    orderNumber: 'BS-1002',
    status: 'SHIPPED',
    total: 1200,
    createdAt: '2026-01-06T10:00:00.000Z',
    items: [
      {
        productName: 'Flower Sticker',
        productSlug: 'flower-sticker',
        productImage: null,
        quantity: 3,
        unitPrice: 400,
        width: 6,
        height: 4,
      },
    ],
  },
]

/** The detail page's own `Order` shape. */
interface DetailOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  taxAmount: number
  deliveryCharge: number
  discountAmount: number
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
  trackingNumber: string | null
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingDivision: string
  shippingPostalCode: string
  paymentMethod: string
  paymentStatus: string
  notes: string | null
  items: Array<{
    id: string
    productId: string
    productName: string
    productSlug: string
    productImage: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
    width: number
    height: number
  }>
}

// `SHIPPED` is the deepest non-terminal status, so the page's own history
// builder emits every step from `PENDING` through `SHIPPED`.
const DETAIL_ORDER: DetailOrder = {
  id: ORDER_ID,
  orderNumber: 'BS-2001',
  status: 'SHIPPED',
  total: 1260,
  subtotal: 1200,
  taxAmount: 60,
  deliveryCharge: 0,
  discountAmount: 0,
  createdAt: '2026-01-05T10:00:00.000Z',
  shippedAt: '2026-01-07T10:00:00.000Z',
  deliveredAt: null,
  trackingNumber: 'TRACK-999',
  shippingName: 'Aisha Rahman',
  shippingPhone: '01700000000',
  shippingAddress: '12 Rose Lane',
  shippingCity: 'Dhaka',
  shippingDivision: 'Dhaka',
  shippingPostalCode: '1205',
  paymentMethod: 'bKash',
  paymentStatus: 'PAID',
  notes: null,
  items: [
    {
      id: 'item-1',
      productId: 'p1',
      productName: 'Skull Sticker',
      productSlug: 'skull-sticker',
      productImage: null,
      quantity: 2,
      unitPrice: 400,
      totalPrice: 800,
      width: 5,
      height: 5,
    },
    {
      id: 'item-2',
      productId: 'p2',
      productName: 'Flower Sticker',
      productSlug: 'flower-sticker',
      productImage: null,
      quantity: 1,
      unitPrice: 400,
      totalPrice: 400,
      width: 6,
      height: 4,
    },
  ],
}

/** CANCELLED order — timeline ends at CANCELLED, no "Current" badge on last step. */
const CANCELLED_ORDER: DetailOrder = {
  ...DETAIL_ORDER,
  id: 'ord-cancelled',
  orderNumber: 'BS-3001',
  status: 'CANCELLED',
  shippedAt: null,
  notes: 'Customer requested cancellation',
}

/** REFUNDED order — timeline ends at REFUNDED. */
const REFUNDED_ORDER: DetailOrder = {
  ...DETAIL_ORDER,
  id: 'ord-refunded',
  orderNumber: 'BS-4001',
  status: 'REFUNDED',
  shippedAt: '2026-01-07T10:00:00.000Z',
  deliveredAt: '2026-01-09T10:00:00.000Z',
  notes: 'Refund processed after return',
}

/** Stubs `GET /api/orders?…` with the real `ok(result)` envelope. */
function stubOrdersList(orders: ListOrder[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.startsWith('/api/orders?')) {
      return jsonResponse({
        success: true,
        data: {
          data: orders,
          pagination: {
            page: 1,
            limit: 10,
            total: orders.length,
            totalPages: 1,
            hasNext: false,
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

/** Stubs `GET /api/orders/:id` with the real `ok({ order })` envelope. */
function stubOrderDetail(order: DetailOrder) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url === `/api/orders/${ORDER_ID}`) {
      return jsonResponse({ success: true, data: { order } })
    }
    throw new Error(`Unexpected fetch: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Renders the app chrome the pages expect: session + query client. */
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

beforeAll(() => {
  // jsdom has no IntersectionObserver, and framer-motion's `whileInView`
  // creates one on mount. The stub never fires, so in-view sections stay at
  // their initial variant — the assertions below are text queries, which the
  // resulting opacity does not affect.
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
})

beforeEach(() => {
  // Re-stubbed because `afterEach` calls `vi.unstubAllGlobals()`.
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
})

afterEach(() => {
  // Without `cleanup` the rendered trees accumulate across tests, and a later
  // test's `screen` queries see an earlier test's DOM — which made the detail
  // test fail only when the whole file ran.
  cleanup()
  vi.unstubAllGlobals()
})

describe('Orders list page', () => {
  it('renders one card per order with a status badge', async () => {
    stubOrdersList(LIST_ORDERS)

    const { container } = renderWithProviders(<OrdersPage />)

    // One card per order: both order numbers render. Queries are scoped to this
    // test's own container — `screen` sees every mounted tree, and the list and
    // detail tests interfere when they share it.
    await waitFor(() => expect(within(container).getByText('BS-1001')).toBeInTheDocument())
    expect(within(container).getByText('BS-1002')).toBeInTheDocument()

    // Each card carries its own order lines and its status label. The status
    // tab bar renders the same words as the badges, so scope to the badge's
    // `span` — an unscoped `getByText('Pending')` matches two elements.
    expect(within(container).getByText(/Skull Sticker/)).toBeInTheDocument()
    expect(within(container).getByText(/Flower Sticker/)).toBeInTheDocument()
    expect(within(container).getByText('Pending', { selector: 'span' })).toBeInTheDocument()
    expect(within(container).getByText('Shipped', { selector: 'span' })).toBeInTheDocument()
  })
})

describe('Order detail page', () => {
  it('renders the order number, its items and the timeline steps for SHIPPED', async () => {
    stubOrderDetail(DETAIL_ORDER)

    const { container } = renderWithProviders(<OrderDetailPage />)

    // Scoped to this test's own container — see the list test's note.
    await waitFor(() => expect(within(container).getByText('BS-2001')).toBeInTheDocument())

    // The items card lists every item, with the frozen `formatCurrency`
    // output read from raw `textContent` (it emits a non-breaking space).
    const skullRow = within(container).getByText(/Skull Sticker/).closest('a')
    expect(skullRow?.textContent).toContain('Skull Sticker')
    expect(skullRow?.textContent).toContain(formatCurrency(800))
    expect(within(container).getByText(/Flower Sticker/)).toBeInTheDocument()

    // The timeline is the history the page builds from the order timestamps:
    // PENDING → CONFIRMED → PROCESSING → PRINTING → READY_TO_SHIP → SHIPPED.
    const timelineCard = within(container).getByText('Timeline').closest('div')
    expect(timelineCard).not.toBeNull()
    const timeline = within(timelineCard as HTMLElement)
    for (const label of [
      'Order Placed',
      'Confirmed',
      'Processing',
      'Printing',
      'Ready to Ship',
      'Shipped',
    ]) {
      expect(timeline.getByText(label)).toBeInTheDocument()
    }

    // The price breakdown is rendered, not stubbed out.
    const totalRow = screen.getByText('Total').closest('div')
    expect(totalRow?.textContent).toContain(formatCurrency(1260))
  })

  it('renders CANCELLED timeline without "Current" badge on final step', async () => {
    stubOrderDetail(CANCELLED_ORDER)

    const { container } = renderWithProviders(<OrderDetailPage />)

    await waitFor(() => expect(within(container).getByText('BS-3001')).toBeInTheDocument())

    const timelineCard = within(container).getByText('Timeline').closest('div')
    expect(timelineCard).not.toBeNull()
    const timeline = within(timelineCard as HTMLElement)

    // Timeline includes PENDING → CONFIRMED → CANCELLED (short-circuited).
    expect(timeline.getByText('Order Placed')).toBeInTheDocument()
    expect(timeline.getByText('Confirmed')).toBeInTheDocument()
    expect(timeline.getByText('Cancelled')).toBeInTheDocument()

    // No "Current" badge on the CANCELLED step (isCancelled = true).
    expect(timeline.queryByText('Current')).not.toBeInTheDocument()
  })

  it('renders REFUNDED timeline — page only shows steps up to current status', async () => {
    stubOrderDetail(REFUNDED_ORDER)

    const { container } = renderWithProviders(<OrderDetailPage />)

    await waitFor(() => expect(within(container).getByText('BS-4001')).toBeInTheDocument())

    const timelineCard = within(container).getByText('Timeline').closest('div')
    expect(timelineCard).not.toBeNull()
    const timeline = within(timelineCard as HTMLElement)

    // buildHistory() only includes steps based on order.status.
    // For REFUNDED it shows: PENDING → CONFIRMED → PROCESSING → REFUNDED
    // (it does not retroactively add PRINTING/SHIPPED/DELIVERED steps).
    for (const label of [
      'Order Placed',
      'Confirmed',
      'Processing',
      'Refunded',
    ]) {
      expect(timeline.getByText(label)).toBeInTheDocument()
    }

    // No "Current" badge on the REFUNDED step.
    expect(timeline.queryByText('Current')).not.toBeInTheDocument()
  })
})

/** The four files this task owns. */
const OWNED_FILES = [
  'src/app/(customer)/orders/page.tsx',
  'src/app/(customer)/orders/[id]/page.tsx',
  'src/components/admin/OrderStatusBadge.tsx',
  'src/components/admin/OrderTimeline.tsx',
]

/**
 * Banned source strings: the brief's Step 1 item 3 list, plus the Ruling 4
 * rename table so a regression to any legacy class/token fails here.
 */
const BANNED_STRINGS = [
  // Step 1 item 3 — undefined tokens and the duplicated status maps.
  'var(--primary)',
  'var(--secondary)',
  '--bg-color',
  'text-primary',
  'bg-gradient',
  'STATUS_DOT_COLOR',
  'STATUS_BADGE_VARIANT',
  // Ruling 4 — the legacy class/token rename table.
  'bg-[var(--light)]',
  'border-[var(--light)]',
  'hover:text-primary',
  'border-primary',
  'fill-primary',
  'bg-primary',
  'bg-secondary',
  'text-body',
  'text-secondary',
  'bg-white',
  'rounded-card',
  'rounded-input',
  'border-3',
  'shadow-card',
  'text-red-500',
  'hover:text-red-500',
  'bg-red-50',
  'text-green-600',
  'from-[var(--primary)]',
  'to-[var(--secondary)]',
]

/** Raw Tailwind palette colours are banned outside the token system (contract §1). */
const RAW_PALETTE_RE =
  /(?:text|bg|border|fill|from|to|ring)-(?:red|green|yellow|blue|pink|violet|orange|teal|gold|lime|gray|slate|zinc|neutral|stone|amber|emerald|cyan|sky|indigo|purple|fuchsia|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/

/** Ad-hoc ink opacity on *text* is banned (contract §2); `color-mix` is for borders/fills. */
const INK_OPACITY_TEXT_RE = /text-\[color-mix\(in_srgb,\s*var\(--ink\)_\d+%,transparent\)\]/

describe('Owned source files', () => {
  it('use real tokens — no undefined token, legacy class, gradient or duplicated map', () => {
    for (const file of OWNED_FILES) {
      const source = readFileSync(file, 'utf8')

      for (const banned of BANNED_STRINGS) {
        expect(source, `${file} contains ${banned}`).not.toContain(banned)
      }
      expect(source, `${file} uses a raw Tailwind palette colour`).not.toMatch(RAW_PALETTE_RE)
      expect(source, `${file} puts ad-hoc ink opacity on text`).not.toMatch(INK_OPACITY_TEXT_RE)
    }
  })

  it('renders order statuses through the shared StatusBadge, not a local map', () => {
    const source = readFileSync('src/app/(customer)/orders/page.tsx', 'utf8')
    expect(source).toContain('<StatusBadge')
  })
})
