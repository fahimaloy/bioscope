// @vitest-environment jsdom
//
// E3 — review submission (revived ReviewForm). Guests get a sign-in CTA with
// callbackUrl back to the product; signed-in users post the real /api/reviews
// route; rating is required; success refreshes + toasts; API errors surface.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  isAuthenticated: true,
  router: { refresh: vi.fn(), push: vi.fn() },
  pathname: '/shop/test-sticker',
  fetch: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: mocks.isAuthenticated, user: { id: 'u1' } }) }))
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router, usePathname: () => mocks.pathname }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a>,
}))
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }))

import { ReviewForm } from '@/components/product/ReviewForm'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.isAuthenticated = true
  vi.stubGlobal('fetch', mocks.fetch)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver
  window.matchMedia = window.matchMedia ?? ((q: string) => ({
    matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('ReviewForm', () => {
  it('guests get a sign-in CTA returning to the product', () => {
    mocks.isAuthenticated = false
    render(<ReviewForm productId="p1" />)
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/login?callbackUrl=%2Fshop%2Ftest-sticker')
    expect(screen.queryByRole('button', { name: /post review/i })).not.toBeInTheDocument()
  })

  it('requires a rating before posting', async () => {
    render(<ReviewForm productId="p1" />)
    fireEvent.click(screen.getByRole('button', { name: /post review/i }))
    expect(await screen.findByText(/please choose a rating/i)).toBeInTheDocument()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('posts the real /api/reviews route and refreshes on success', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({ success: true, data: { review: { id: 'r1' } } }) } as Response)
    render(<ReviewForm productId="p1" />)
    fireEvent.click(screen.getByRole('radio', { name: /4 stars/i }))
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Great' } })
    fireEvent.change(screen.getByLabelText(/your review/i), { target: { value: 'Loved the quality.' } })
    fireEvent.click(screen.getByRole('button', { name: /post review/i }))
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/reviews', expect.objectContaining({ method: 'POST' })))
    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body)
    expect(body).toMatchObject({ productId: 'p1', rating: 4, title: 'Great', comment: 'Loved the quality.' })
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled())
    expect(mocks.router.refresh).toHaveBeenCalled()
  })

  it('surfaces an API error message', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ success: false, error: 'Something went wrong' }) } as Response)
    render(<ReviewForm productId="p1" />)
    fireEvent.click(screen.getByRole('radio', { name: /5 stars/i }))
    fireEvent.click(screen.getByRole('button', { name: /post review/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
    expect(mocks.router.refresh).not.toHaveBeenCalled()
  })
})
