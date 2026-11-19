// @vitest-environment jsdom
//
// E8 — FeaturedProduct "Add to Cart" was a dead button (no onClick). It now adds
// the default dimension to the cart (authenticated) or redirects guests to login.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { Product } from '@/types'

const mocks = vi.hoisted(() => ({ isAuthenticated: true, addItem: vi.fn(), openCart: vi.fn(), toastSuccess: vi.fn(), toggle: vi.fn() }))
vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }) }))
vi.mock('@/lib/stores/cartStore', () => ({
  useCartStore: () => ({ addItem: mocks.addItem, openCart: mocks.openCart }),
  useIsInCart: () => false,
  useGetItemQuantity: () => 0,
}))
vi.mock('@/lib/stores/wishlistStore', () => ({ useIsWished: () => false, useWishlistActions: () => ({ toggle: mocks.toggle }) }))
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess } }))
vi.mock('next/image', () => ({ default: (p: Record<string, unknown>) => <img {...p} alt={String(p.alt ?? '')} /> }))

import { FeaturedProduct } from '@/components/product/ProductCard'

const product = {
  id: 'p1', name: 'Sparkle Stickers', slug: 'sparkle-stickers', description: 'Shiny',
  images: ['img.png'], basePrice: 200, compareAtPrice: null,
  category: { name: 'Vinyl' },
  allowedDimensions: [{ id: 'd1', width: 5, height: 5, label: 'Small', priceMultiplier: 1, isDefault: true }],
  allowedQuantities: [],
} as unknown as Product

beforeEach(() => {
  vi.clearAllMocks()
  mocks.isAuthenticated = true
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => cleanup())

describe('FeaturedProduct Add to Cart', () => {
  it('adds the default dimension to the cart and opens the drawer', () => {
    render(<FeaturedProduct product={product} />)
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    expect(mocks.addItem).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p1', width: 5, height: 5, quantity: 1 }))
    expect(mocks.openCart).toHaveBeenCalled()
    expect(mocks.toastSuccess).toHaveBeenCalled()
  })
  it('redirects guests to login with a redirect back to the product', () => {
    mocks.isAuthenticated = false
    const hrefSetter = vi.fn()
    Object.defineProperty(window, 'location', { value: { ...window.location, set href(v: string) { hrefSetter(v) }, get href() { return 'http://localhost/' } }, writable: true })
    render(<FeaturedProduct product={product} />)
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    expect(mocks.addItem).not.toHaveBeenCalled()
    expect(hrefSetter).toHaveBeenCalledWith('/login?redirect=/shop/sparkle-stickers')
  })
})
