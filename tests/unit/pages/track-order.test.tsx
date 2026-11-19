// @vitest-environment jsdom
//
// C4 — track-order page: form → result transition must actually render.
// fetch is stubbed with the REAL route envelope (ok({ ...TrackedOrder }) and
// { success:false, error, code }). Regression guard for the AnimatePresence
// mode="wait" stuck-exit bug: setResult fired but the result never mounted.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import TrackOrderPage from '@/app/(customer)/track-order/page'

const tracked = {
  orderNumber: 'ORD-20261119-0001',
  status: 'SHIPPED',
  placedAt: '2026-11-19T10:00:00.000Z',
  shippedAt: '2026-11-20T09:00:00.000Z',
  deliveredAt: null,
  trackingNumber: 'TRK-123',
  total: 480,
  currency: 'BDT',
  items: [{ name: 'Kraft Paper Label Stickers', quantity: 2, width: 4, height: 4, totalPrice: 160 }],
}

const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) }) as Response
const fail = (status: number, body: Record<string, unknown>) =>
  ({ ok: false, status, json: async () => ({ success: false, ...body }) }) as Response

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mocks.fetch)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver
  // framer-motion useReducedMotion probes matchMedia; jsdom lacks it.
  window.matchMedia = window.matchMedia ?? ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/order number/i), { target: { value: 'ORD-20261119-0001' } })
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'buyer@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: /track order/i }))
}

describe('TrackOrderPage', () => {
  it('renders the form initially', () => {
    render(<TrackOrderPage />)
    expect(screen.getByTestId('track-form')).toBeInTheDocument()
    expect(screen.queryByTestId('track-result')).not.toBeInTheDocument()
  })

  it('shows the result card after a successful lookup', async () => {
    mocks.fetch.mockResolvedValue(ok(tracked))
    render(<TrackOrderPage />)
    fillAndSubmit()
    await waitFor(() => expect(screen.getByTestId('track-result')).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByText('ORD-20261119-0001')).toBeInTheDocument()
    expect(screen.getByText(/Kraft Paper Label Stickers/)).toBeInTheDocument()
    expect(screen.getByText('TRK-123', { exact: false })).toBeInTheDocument()
    // form is gone once the result is shown
    expect(screen.queryByTestId('track-form')).not.toBeInTheDocument()
  })

  it('shows the generic error on a 404 miss and keeps the form', async () => {
    mocks.fetch.mockResolvedValue(fail(404, { error: 'No order found with those details.', code: 'ORDER_NOT_FOUND' }))
    render(<TrackOrderPage />)
    fillAndSubmit()
    await waitFor(() => expect(screen.getByTestId('track-error')).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByTestId('track-error')).toHaveTextContent(/No order found/)
    expect(screen.getByTestId('track-form')).toBeInTheDocument()
  })

  it('shows a wait message on 429', async () => {
    mocks.fetch.mockResolvedValue(fail(429, { error: 'Rate limited', code: 'RATE_LIMITED' }))
    render(<TrackOrderPage />)
    fillAndSubmit()
    await waitFor(() => expect(screen.getByTestId('track-error')).toHaveTextContent(/Too many lookups/i), { timeout: 3000 })
  })

  it('returns to the form via "Track another order"', async () => {
    mocks.fetch.mockResolvedValue(ok(tracked))
    render(<TrackOrderPage />)
    fillAndSubmit()
    await waitFor(() => expect(screen.getByTestId('track-result')).toBeInTheDocument(), { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: /track another order/i }))
    await waitFor(() => expect(screen.getByTestId('track-form')).toBeInTheDocument(), { timeout: 3000 })
  })
})
