// @vitest-environment jsdom
//
// C2 — about/contact rebuild. About: fabricated stats/team removed (ruling 2),
// token rebuild, real destinations. Contact: FAQ accordion actually works (was
// a dead onClick), the fake newsletter is gone, emoji removed, and the form
// still posts the real /api/contact route (frozen).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), toastSuccess: vi.fn(), toastError: vi.fn() }))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }))

import AboutPage from '@/app/(customer)/about/page'
import ContactPage from '@/app/(customer)/contact/page'

const LEGACY = /\btext-primary\b|\btext-body\b|\bborder-3\b|\brounded-input\b|\brounded-card\b|DoodleBackground|DoodleShape|DoodleScribble/

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mocks.fetch)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver
  window.matchMedia = window.matchMedia ?? ((q: string) => ({
    matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('AboutPage', () => {
  it('renders the hero and sections with real destinations', () => {
    render(<AboutPage />)
    // StaggeredText splits the headline into per-letter spans; match ignoring whitespace.
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent?.replace(/\s/g, '')).toMatch(/ABOUTUS/i)
    expect(screen.getByText(/our story/i)).toBeInTheDocument()
    expect(screen.getByText(/our materials/i)).toBeInTheDocument()
    expect(screen.getByText(/our values/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /shop now/i })).toHaveAttribute('href', '/shop')
    expect(screen.getByRole('link', { name: /design custom/i })).toHaveAttribute('href', '/custom-sticker')
  })

  it('removed the fabricated marketing numbers and invented team (ruling 2)', () => {
    const { container } = render(<AboutPage />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Happy Customers|Projects Done|Awards Won|500\+ Clients/)
    expect(text).not.toMatch(/Sarah Ahmed|Rahman Khan|Fatima Begum|Karim Hassan/)
  })

  it('uses no legacy classes or deprecated decor', () => {
    const { container } = render(<AboutPage />)
    expect(container.innerHTML).not.toMatch(LEGACY)
  })
})

describe('ContactPage', () => {
  it('renders the form and removes the fake newsletter + emoji', () => {
    const { container } = render(<ContactPage />)
    expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    // fake newsletter gone
    expect(container.textContent).not.toMatch(/Stay Updated|Subscribed!/)
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument()
    // no emoji decoration (spec §5.6)
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
    expect(container.innerHTML).not.toMatch(LEGACY)
  })

  it('FAQ accordion expands to reveal the answer (was a dead onClick)', async () => {
    render(<ContactPage />)
    const q = screen.getByRole('button', { name: /how long does delivery take/i })
    expect(q).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/Inside Dhaka: 2-3 business days/i)).not.toBeInTheDocument()
    fireEvent.click(q)
    await waitFor(() => expect(screen.getByText(/Inside Dhaka: 2-3 business days/i)).toBeInTheDocument())
    expect(q).toHaveAttribute('aria-expanded', 'true')
    // collapse again
    fireEvent.click(q)
    await waitFor(() => expect(screen.queryByText(/Inside Dhaka: 2-3 business days/i)).not.toBeInTheDocument())
  })

  it('submits the real /api/contact route (frozen behaviour)', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) } as Response)
    render(<ContactPage />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 't@example.com' } })
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'A question' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'This is a sufficiently long message.' } })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' })))
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled())
  })
})
