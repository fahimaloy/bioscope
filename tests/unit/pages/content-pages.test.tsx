// @vitest-environment jsdom
//
// C3 / rebuild tasks 2.11–2.12 — content pages so every Footer link resolves.
// ContentPage shell renders title/sections + contact link; coming-soon variant;
// FAQ accordion expands; shipping reads live public settings; all 10 routes
// render. Policy bodies are honest placeholders (no invented legal text).

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

import { ContentPage } from '@/components/content/ContentPage'
import FaqPage from '@/app/(customer)/faq/page'
import ShippingPage from '@/app/(customer)/shipping/page'
import ReturnsPage from '@/app/(customer)/returns/page'
import PrivacyPage from '@/app/(customer)/privacy/page'
import TermsPage from '@/app/(customer)/terms/page'
import AccessibilityPage from '@/app/(customer)/accessibility/page'
import BlogPage from '@/app/(customer)/blog/page'
import CareersPage from '@/app/(customer)/careers/page'
import PressPage from '@/app/(customer)/press/page'
import AffiliatesPage from '@/app/(customer)/affiliates/page'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, data: { delivery_enabled: true, delivery_inside_dhaka_charge: 60, free_delivery_threshold: 2000 } }) } as Response)
  vi.stubGlobal('fetch', mocks.fetch)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver
  window.matchMedia = window.matchMedia ?? ((q: string) => ({
    matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('ContentPage shell', () => {
  it('renders the title, every section heading, and a working contact link', () => {
    render(<ContentPage title="Test Title" eyebrow="Support" sections={[{ heading: 'Section One', body: ['Para one.'] }, { heading: 'Section Two', body: ['Para two.'] }]} />)
    expect(screen.getByRole('heading', { name: /test title/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /section one/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /section two/i })).toBeInTheDocument()
    expect(screen.getByText('Para one.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', '/contact')
  })

  it('renders the coming-soon variant with a contact link', () => {
    render(<ContentPage title="Blog" comingSoon comingSoonNote="Posts are on the way." />)
    expect(screen.getByText(/posts are on the way/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', '/contact')
  })
})

describe('FAQ page', () => {
  it('accordion expands to reveal an answer', async () => {
    render(<FaqPage />)
    const trigger = screen.getByRole('button', { name: /how long does delivery take/i })
    expect(screen.queryByText(/Inside Dhaka: 2-3 business days/i)).not.toBeInTheDocument()
    fireEvent.click(trigger)
    await waitFor(() => expect(screen.getByText(/Inside Dhaka: 2-3 business days/i)).toBeInTheDocument())
  })
})

describe('Shipping page', () => {
  it('reads live delivery charge + threshold from public settings', async () => {
    render(<ShippingPage />)
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/settings/public'))
    await waitFor(() => expect(screen.getByText(/current delivery rates/i)).toBeInTheDocument())
    expect(screen.getByText(/free delivery on orders over/i)).toBeInTheDocument()
  })
})

describe('all content routes render', () => {
  const routes: [string, () => ReactNode][] = [
    ['Returns', ReturnsPage], ['Privacy', PrivacyPage], ['Terms', TermsPage],
    ['Accessibility', AccessibilityPage], ['Blog', BlogPage], ['Careers', CareersPage],
    ['Press', PressPage], ['Affiliates', AffiliatesPage],
  ]
  it.each(routes)('%s page renders a heading + contact link', (_name, Page) => {
    render(<Page />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', '/contact')
  })
})
