// @vitest-environment jsdom
//
// E1 — the forgot/reset password pages must exist and drive the real API
// envelopes: ok({ message, devToken? }) / { success:false, error, code }.
// fetch is stubbed with those exact shapes (ledger pitfall: mocking the
// page's assumption instead of the route's payload proves nothing).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams('token=tok-123'),
  fetch: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mocks.router,
  useSearchParams: () => mocks.searchParams,
  usePathname: () => '/reset-password',
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import ForgotPasswordPage from '@/app/(customer)/forgot-password/page'
import ResetPasswordPage from '@/app/(customer)/reset-password/page'

const ok = (data: unknown) =>
  ({ ok: true, status: 200, json: async () => ({ success: true, data }) }) as Response
const fail = (status: number, body: Record<string, unknown>) =>
  ({ ok: false, status, json: async () => ({ success: false, ...body }) }) as Response

beforeEach(() => {
  vi.clearAllMocks()
  mocks.searchParams = new URLSearchParams('token=tok-123')
  mocks.fetch.mockResolvedValue(ok({ message: 'If that email exists, a reset link has been issued' }))
  vi.stubGlobal('fetch', mocks.fetch)
  // jsdom lacks these; framer-motion / primitives probe them.
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ForgotPasswordPage', () => {
  it('renders the email form and posts the real payload', async () => {
    const { container } = render(<ForgotPasswordPage />)
    const email = within(container).getByPlaceholderText('you@example.com')
    fireEvent.change(email, { target: { value: 'user@example.com' } })
    fireEvent.submit(within(container).getByRole('button', { name: /send reset link/i }).closest('form')!)
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1))
    const [url, init] = mocks.fetch.mock.calls[0]
    expect(url).toBe('/api/auth/forgot-password')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ email: 'user@example.com' })
  })

  it('shows the success panel and the dev-token shortcut when the API returns devToken', async () => {
    mocks.fetch.mockResolvedValue(ok({ message: 'sent', devToken: 'dev-tok-9' }))
    const { container } = render(<ForgotPasswordPage />)
    fireEvent.change(within(container).getByPlaceholderText('you@example.com'), { target: { value: 'user@example.com' } })
    fireEvent.submit(within(container).getByRole('button', { name: /send reset link/i }).closest('form')!)
    await waitFor(() => expect(within(container).getByTestId('forgot-success')).toBeInTheDocument())
    const link = within(container).getByTestId('dev-token-panel').querySelector('a')
    expect(link?.getAttribute('href')).toBe('/reset-password?token=dev-tok-9')
  })

  it('hides the dev panel when no devToken is returned (production shape)', async () => {
    const { container } = render(<ForgotPasswordPage />)
    fireEvent.change(within(container).getByPlaceholderText('you@example.com'), { target: { value: 'user@example.com' } })
    fireEvent.submit(within(container).getByRole('button', { name: /send reset link/i }).closest('form')!)
    await waitFor(() => expect(within(container).getByTestId('forgot-success')).toBeInTheDocument())
    expect(within(container).queryByTestId('dev-token-panel')).not.toBeInTheDocument()
  })

  it('surfaces a 429 as a friendly retry message', async () => {
    mocks.fetch.mockResolvedValue(fail(429, { error: 'Rate limited', code: 'RATE_LIMITED' }))
    const { container } = render(<ForgotPasswordPage />)
    fireEvent.change(within(container).getByPlaceholderText('you@example.com'), { target: { value: 'user@example.com' } })
    fireEvent.submit(within(container).getByRole('button', { name: /send reset link/i }).closest('form')!)
    await waitFor(() => expect(within(container).getByRole('alert')).toHaveTextContent(/too many attempts/i))
  })

  it('blocks an invalid email client-side (no fetch)', async () => {
    const { container } = render(<ForgotPasswordPage />)
    fireEvent.change(within(container).getByPlaceholderText('you@example.com'), { target: { value: 'not-an-email' } })
    fireEvent.submit(within(container).getByRole('button', { name: /send reset link/i }).closest('form')!)
    await waitFor(() => expect(within(container).getByText(/valid email/i)).toBeInTheDocument())
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
})

describe('ResetPasswordPage', () => {
  const fill = (container: HTMLElement, password: string, confirm: string) => {
    fireEvent.change(within(container).getByPlaceholderText(/at least 8 characters/i), { target: { value: password } })
    fireEvent.change(within(container).getByPlaceholderText(/repeat your new password/i), { target: { value: confirm } })
    fireEvent.submit(within(container).getByRole('button', { name: /reset password/i }).closest('form')!)
  }

  it('without a token: explains the link requirement, no form', () => {
    mocks.searchParams = new URLSearchParams('')
    const { container } = render(<ResetPasswordPage />)
    expect(within(container).getByTestId('reset-missing-token')).toBeInTheDocument()
    expect(within(container).queryByRole('button', { name: /reset password/i })).not.toBeInTheDocument()
  })

  it('posts { token, password } — confirmPassword never leaves the client', async () => {
    const { container } = render(<ResetPasswordPage />)
    fill(container, 'NewPass123', 'NewPass123')
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1))
    const [url, init] = mocks.fetch.mock.calls[0]
    expect(url).toBe('/api/auth/reset-password')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ token: 'tok-123', password: 'NewPass123' })
  })

  it('mismatched confirmation blocks submission client-side', async () => {
    const { container } = render(<ResetPasswordPage />)
    fill(container, 'NewPass123', 'Different123')
    await waitFor(() => expect(within(container).getByText(/passwords do not match/i)).toBeInTheDocument())
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('success panel after a valid reset', async () => {
    mocks.fetch.mockResolvedValue(ok({ message: 'Password has been reset' }))
    const { container } = render(<ResetPasswordPage />)
    fill(container, 'NewPass123', 'NewPass123')
    await waitFor(() => expect(within(container).getByTestId('reset-success')).toBeInTheDocument())
  })

  it('INVALID_TOKEN shows the expired-link error with a request-new link', async () => {
    mocks.fetch.mockResolvedValue(fail(400, { error: 'Reset link is invalid or has expired', code: 'INVALID_TOKEN' }))
    const { container } = render(<ResetPasswordPage />)
    fill(container, 'NewPass123', 'NewPass123')
    await waitFor(() => expect(within(container).getByRole('alert')).toHaveTextContent(/invalid or has expired/i))
    expect(within(container).getByRole('link', { name: /request a new reset link/i })).toHaveAttribute('href', '/forgot-password')
  })
})