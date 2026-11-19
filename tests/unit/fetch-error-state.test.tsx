// @vitest-environment jsdom
//
// E12 — FetchErrorState (doodle language + retry) and the orders page error
// path: a failed load shows a recoverable error, not a misleading empty state.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('next/link', () => ({ default: ({ href, children, ...p }: { href: string; children: ReactNode }) => <a href={href} {...p}>{children}</a> }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import { FetchErrorState } from '@/components/ui/FetchErrorState'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mocks.fetch)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('FetchErrorState', () => {
  it('renders an alert with the message and a retry button', () => {
    const onRetry = vi.fn()
    render(<FetchErrorState message="Could not load." onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load.')
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
  it('omits the retry button when no handler is given', () => {
    render(<FetchErrorState />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('orders page error state', () => {
  it('shows a recoverable error (not "No orders yet") when the fetch fails', async () => {
    mocks.fetch.mockRejectedValue(new Error('network down'))
    const OrdersPage = (await import('@/app/(customer)/orders/page')).default
    render(<OrdersPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load your orders/i)
    expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
