// @vitest-environment jsdom
//
// C6 — global states onto tokens + the global-error html/body requirement.
// not-found: token rebuild, one decor accent, working destinations, no legacy
// classes. global-error: MUST render its own <html>/<body> (it replaces the
// root layout) and the retry fallback. loading: token skeleton grid renders.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

import NotFound from '@/app/not-found'
import GlobalError from '@/app/global-error'
import Loading from '@/app/loading'

beforeEach(() => {
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver
  window.matchMedia = window.matchMedia ?? ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

afterEach(() => cleanup())

describe('NotFound', () => {
  it('renders the heading and working destinations', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { name: /page wandered off/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /browse stickers/i })).toHaveAttribute('href', '/shop')
    expect(screen.getByAltText(/lost sticker character/i)).toBeInTheDocument()
  })

  it('uses no legacy border-3 / bg-white / text-primary classes', () => {
    const { container } = render(<NotFound />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bborder-3\b/)
    expect(html).not.toMatch(/\bbg-white\b/)
    expect(html).not.toMatch(/\btext-primary\b/)
    expect(html).not.toMatch(/\btext-body\b/)
  })
})

describe('GlobalError', () => {
  it('renders its own <html> and <body> (replaces the root layout)', () => {
    const { container } = render(<GlobalError error={new Error('boom')} reset={() => {}} />)
    expect(container.querySelector('html')).not.toBeNull()
    expect(container.querySelector('body')).not.toBeNull()
  })

  it('shows the fallback and wires retry to reset', () => {
    const reset = vi.fn()
    render(<GlobalError error={new Error('boom')} reset={reset} />)
    expect(screen.getByRole('heading', { name: /something stuck/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})

describe('Loading', () => {
  it('renders the token skeleton grid without crashing', () => {
    const { container } = render(<Loading />)
    expect(container.querySelector('.container-custom')).not.toBeNull()
    // static grid classes (no dynamic interpolation)
    expect(container.innerHTML).toMatch(/grid-cols-2/)
  })
})
