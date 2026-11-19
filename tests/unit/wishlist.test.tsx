// @vitest-environment jsdom
//
// E2 — working wishlist. Store toggle/has/remove/clear + persistence; the
// /wishlist page empty + populated states; the ProductCard heart actually
// toggles (was decorative) with aria-pressed + filled state.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import type { Product } from '@/types'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))
vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <img alt="" {...props} /> }))
vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: false, user: null }) }))

import { useWishlistStore } from '@/lib/stores/wishlistStore'
import WishlistPage from '@/app/(customer)/wishlist/page'
import { ProductCard } from '@/components/product/ProductCard'

const product: Product = {
  id: 'p1', name: 'Test Sticker', slug: 'test-sticker', description: null,
  basePrice: 250, compareAtPrice: null, images: ['/test.png'], categoryId: 'c1',
  allowedDimensions: [{ id: 'd1', width: 5, height: 5, label: '5×5cm', priceMultiplier: 1, isDefault: true, sortOrder: 0 }],
  allowedQuantities: [], customizationOptions: null, taxPercent: 0, additionalCharge: 0,
  isTaxInclusive: false, trackInventory: false, stock: 100, lowStockThreshold: 10,
  isActive: true, isFeatured: false, sortOrder: 0, metaTitle: null, metaDescription: null,
  createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-01T00:00:00Z'),
}
const product2 = { ...product, id: 'p2', name: 'Second Sticker', slug: 'second-sticker' }

beforeEach(() => {
  localStorage.clear()
  useWishlistStore.setState({ items: [], count: 0 })
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  global.IntersectionObserver = global.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver
  window.matchMedia = window.matchMedia ?? ((q: string) => ({
    matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

afterEach(() => cleanup())

describe('wishlistStore', () => {
  it('toggle adds then removes, tracking count and has()', () => {
    const s = useWishlistStore.getState()
    s.toggle(product)
    expect(useWishlistStore.getState().count).toBe(1)
    expect(useWishlistStore.getState().has('p1')).toBe(true)
    useWishlistStore.getState().toggle(product)
    expect(useWishlistStore.getState().count).toBe(0)
    expect(useWishlistStore.getState().has('p1')).toBe(false)
  })

  it('does not duplicate; remove and clear work', () => {
    useWishlistStore.getState().toggle(product)
    useWishlistStore.getState().toggle(product2)
    useWishlistStore.getState().toggle(product) // removes p1
    expect(useWishlistStore.getState().items.map((p) => p.id)).toEqual(['p2'])
    useWishlistStore.getState().remove('p2')
    expect(useWishlistStore.getState().count).toBe(0)
    useWishlistStore.getState().toggle(product)
    useWishlistStore.getState().clear()
    expect(useWishlistStore.getState().count).toBe(0)
  })

  it('persists to localStorage under bioscope-wishlist', () => {
    useWishlistStore.getState().toggle(product)
    const raw = localStorage.getItem('bioscope-wishlist')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).state.items[0].id).toBe('p1')
  })
})

describe('WishlistPage', () => {
  it('shows the empty state with a shop link', () => {
    render(<WishlistPage />)
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse stickers/i })).toHaveAttribute('href', '/shop')
  })

  it('renders saved items and removes one', () => {
    useWishlistStore.setState({ items: [product, product2], count: 2 })
    render(<WishlistPage />)
    expect(screen.getByText('Test Sticker')).toBeInTheDocument()
    expect(screen.getByText('Second Sticker')).toBeInTheDocument()
    // Both the page X button and the wished heart remove; click the first (the X).
    fireEvent.click(screen.getAllByRole('button', { name: /remove test sticker from wishlist/i })[0])
    expect(useWishlistStore.getState().has('p1')).toBe(false)
    expect(useWishlistStore.getState().count).toBe(1)
  })
})

describe('ProductCard heart', () => {
  it('toggles the wishlist with aria-pressed (was decorative)', () => {
    render(<ProductCard product={product} />)
    const heart = screen.getByRole('button', { name: /add test sticker to wishlist/i })
    expect(heart).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(heart)
    expect(useWishlistStore.getState().has('p1')).toBe(true)
    const pressed = screen.getByRole('button', { name: /remove test sticker from wishlist/i })
    expect(pressed).toHaveAttribute('aria-pressed', 'true')
  })
})
