// @vitest-environment jsdom
//
// C1 — login/register visual rebuild onto tokens, auth logic FROZEN.
// Asserts: no legacy classes/deprecated decor; the signIn('credentials') flow,
// rememberMe passthrough, admin-rejection (signOut + toast), the A8 ?redirect=
// convention, and register's fetch→auto-signIn are all preserved.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  toastError: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ signIn: mocks.signIn, signOut: mocks.signOut }))
vi.mock('next/navigation', () => ({
  useRouter: () => mocks.router,
  useSearchParams: () => mocks.searchParams,
  usePathname: () => '/login',
}))
vi.mock('sonner', () => ({ toast: { error: mocks.toastError, success: vi.fn() } }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import LoginPage from '@/app/(customer)/login/page'
import RegisterPage from '@/app/(customer)/register/page'

const session = (role: string) =>
  ({ ok: true, status: 200, json: async () => ({ user: { role } }) }) as Response

beforeEach(() => {
  vi.clearAllMocks()
  mocks.searchParams = new URLSearchParams()
  mocks.signIn.mockResolvedValue({ ok: true, error: null })
  mocks.signOut.mockResolvedValue(undefined)
  vi.stubGlobal('fetch', mocks.fetch)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver
  window.matchMedia = window.matchMedia ?? ((q: string) => ({
    matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const LEGACY = /\btext-primary\b|\btext-body\b|\btext-success\b|\brounded-input\b|DoodleBackground/

describe('LoginPage', () => {
  it('renders the token rebuild with working auth links and no legacy classes', () => {
    const { container } = render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register')
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
    expect(container.innerHTML).not.toMatch(LEGACY)
  })

  it('signs in via credentials with rememberMe and redirect:false', async () => {
    mocks.fetch.mockResolvedValue(session('CUSTOMER'))
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByLabelText(/remember me/i))
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
      email: 'user@example.com', password: 'password123', rememberMe: true, redirect: false,
    })))
  })

  it('rejects an admin sign-in: signOut to /admin/login + toast (frozen behaviour)', async () => {
    mocks.fetch.mockResolvedValue(session('ADMIN'))
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: '/admin/login' }))
    expect(mocks.toastError).toHaveBeenCalledWith('Admin users must sign in at /admin/login')
    expect(mocks.router.push).not.toHaveBeenCalled()
  })

  it('honours the A8 ?redirect= alias for the post-login destination', async () => {
    mocks.searchParams = new URLSearchParams('redirect=/checkout')
    mocks.fetch.mockResolvedValue(session('CUSTOMER'))
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith('/checkout'))
  })
})

describe('RegisterPage', () => {
  it('renders the token rebuild with no legacy classes', () => {
    const { container } = render(<RegisterPage />)
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
    expect(container.innerHTML).not.toMatch(LEGACY)
  })

  it('registers then auto-signs-in via credentials (frozen flow), lands on /', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({ success: true, data: { id: 'u1' } }) } as Response)
    render(<RegisterPage />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' })))
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
      email: 'new@example.com', password: 'Password123', redirect: false,
    })))
    await waitFor(() => expect(mocks.router.push).toHaveBeenCalledWith('/'))
  })
})
