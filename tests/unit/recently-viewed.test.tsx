// @vitest-environment jsdom
//
// E8 — recently-viewed: store dedupes by id, caps at 8, most-recent first; the
// rail renders only with history beyond the current product and excludes it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <img {...props} alt={String(props.alt ?? '')} /> }))
vi.mock('next/link', () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a> }))

import { useRecentlyViewedStore, type ViewedProduct } from '@/lib/stores/recentlyViewedStore'
import { RecentlyViewed } from '@/components/product/RecentlyViewed'

const vp = (id: string): ViewedProduct => ({ id, slug: `slug-${id}`, name: `Product ${id}`, image: null, basePrice: 100 })

beforeEach(() => {
  useRecentlyViewedStore.setState({ viewed: [] })
  localStorage.clear()
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => cleanup())

describe('recentlyViewedStore', () => {
  it('dedupes by id and puts the most recent first', () => {
    const { addViewed } = useRecentlyViewedStore.getState()
    addViewed(vp('a')); addViewed(vp('b')); addViewed(vp('a'))
    expect(useRecentlyViewedStore.getState().viewed.map((p) => p.id)).toEqual(['a', 'b'])
  })
  it('caps at 8', () => {
    const { addViewed } = useRecentlyViewedStore.getState()
    for (let i = 0; i < 12; i++) addViewed(vp(`p${i}`))
    const viewed = useRecentlyViewedStore.getState().viewed
    expect(viewed).toHaveLength(8)
    expect(viewed[0].id).toBe('p11')
  })
})

describe('RecentlyViewed rail', () => {
  it('renders nothing when there is no history beyond the current product', async () => {
    const { container } = render(<RecentlyViewed current={vp('a')} />)
    await waitFor(() => expect(useRecentlyViewedStore.getState().viewed.some((p) => p.id === 'a')).toBe(true))
    expect(container.querySelector('section')).toBeNull()
  })
  it('renders other recently-viewed products, excluding the current one', async () => {
    useRecentlyViewedStore.setState({ viewed: [vp('b'), vp('c'), vp('a')] })
    render(<RecentlyViewed current={vp('a')} />)
    expect(await screen.findByText('Product b')).toBeInTheDocument()
    expect(screen.getByText('Product c')).toBeInTheDocument()
    expect(screen.queryByText('Product a')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /recently viewed/i })).toBeInTheDocument()
  })
})
