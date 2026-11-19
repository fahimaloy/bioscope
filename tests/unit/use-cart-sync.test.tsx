// @vitest-environment jsdom
//
// E7 — useCartSync: on the guest→authenticated transition, local guest items
// are merged into the server cart (mode 'set', no duplicate rows), quantities
// summed + capped by stock, client hydrated; failures leave guest items intact.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { CartItem } from '@/types'

const mocks = vi.hoisted(() => ({ isAuthenticated: false, fetch: vi.fn() }))
vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }) }))

import { useCartSync } from '@/lib/hooks/useCartSync'
import { useCartStore } from '@/lib/stores/cartStore'

function Probe() { useCartSync(); return null }

const product = { id: 'p1', name: 'Sticker', slug: 'sticker', images: ['img.png'], basePrice: 100, trackInventory: false, stock: 0 } as unknown as CartItem['product']
const guest = (productId: string, quantity: number, cartId = 'local'): CartItem => ({
  id: `g-${productId}`, cartId, productId, product, productName: 'Sticker', productSlug: 'sticker',
  productImage: 'img.png', unitPrice: 100, width: 5, height: 5, quantity, customization: null,
  createdAt: new Date(), updatedAt: new Date(),
})
const serverItem = (productId: string, quantity: number, stock?: number) => ({
  id: `s-${productId}`, productId, width: 5, height: 5, quantity, unitPrice: 100, customization: null,
  createdAt: '2026-11-20T10:00:00Z', updatedAt: '2026-11-20T10:00:00Z',
  product: { name: 'Sticker', slug: 'sticker', images: ['img.png'], trackInventory: stock !== undefined, stock: stock ?? 0 },
})
const cartResponse = (items: unknown[]) => ({ ok: true, json: async () => ({ success: true, data: { cart: { id: 'cart1', items } } }) } as Response)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.isAuthenticated = false
  useCartStore.setState({ items: [], itemCount: 0, subtotal: 0 })
  vi.stubGlobal('fetch', mocks.fetch)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('useCartSync', () => {
  it('merges guest items into the server cart on sign-in (summed, mode set)', async () => {
    useCartStore.setState({ items: [guest('p1', 2)] })
    mocks.fetch.mockImplementation((url: string, opts?: RequestInit) =>
      opts?.method === 'POST'
        ? Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response)
        : Promise.resolve(cartResponse([serverItem('p1', 1)])))
    const { rerender } = render(<Probe />) // guest mount (prev null→false)
    mocks.isAuthenticated = true
    rerender(<Probe />)
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/cart', expect.objectContaining({ method: 'POST' })))
    const post = mocks.fetch.mock.calls.find((c) => (c[1] as RequestInit)?.method === 'POST')!
    const body = JSON.parse((post[1] as RequestInit).body as string)
    expect(body).toMatchObject({ productId: 'p1', quantity: 3, mode: 'set' })
    await waitFor(() => expect(useCartStore.getState().items[0].quantity).toBe(3))
    expect(useCartStore.getState().items[0].cartId).toBe('cart1')
  })

  it('caps merged quantity by server stock', async () => {
    useCartStore.setState({ items: [guest('p1', 5)] })
    mocks.fetch.mockImplementation((_url: string, opts?: RequestInit) =>
      opts?.method === 'POST'
        ? Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response)
        : Promise.resolve(cartResponse([serverItem('p1', 1, 2)])))
    const { rerender } = render(<Probe />)
    mocks.isAuthenticated = true
    rerender(<Probe />)
    await waitFor(() => expect(useCartStore.getState().items[0].quantity).toBe(2))
  })

  it('leaves guest items intact when the server fetch fails', async () => {
    useCartStore.setState({ items: [guest('p1', 2)] })
    mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({}) } as Response)
    const { rerender } = render(<Probe />)
    mocks.isAuthenticated = true
    rerender(<Probe />)
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalled())
    expect(useCartStore.getState().items[0].cartId).toBe('local')
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('does not post when there are no local guest items', async () => {
    useCartStore.setState({ items: [guest('p1', 2, 'cart1')] })
    mocks.fetch.mockResolvedValue(cartResponse([]))
    const { rerender } = render(<Probe />)
    mocks.isAuthenticated = true
    rerender(<Probe />)
    await new Promise((r) => setTimeout(r, 30))
    expect(mocks.fetch.mock.calls.some((c) => (c[1] as RequestInit)?.method === 'POST')).toBe(false)
  })
})
