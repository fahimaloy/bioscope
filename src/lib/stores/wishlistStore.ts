'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product } from '@/types'

/**
 * E2 — client-side wishlist (cart-store pattern). Guest wishlist lives in
 * localStorage and survives login (it is not tied to the session). Stores
 * product snapshots so the /wishlist page renders without a refetch; the
 * product detail page and server-side checkout remain the source of truth
 * for live price/stock.
 */
interface WishlistState {
  items: Product[]
  count: number
  toggle: (product: Product) => void
  remove: (productId: string) => void
  has: (productId: string) => boolean
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      toggle: (product) => {
        const exists = get().items.some((p) => p.id === product.id)
        const items = exists
          ? get().items.filter((p) => p.id !== product.id)
          : [...get().items, product]
        set({ items, count: items.length })
      },
      remove: (productId) => {
        const items = get().items.filter((p) => p.id !== productId)
        set({ items, count: items.length })
      },
      has: (productId) => get().items.some((p) => p.id === productId),
      clear: () => set({ items: [], count: 0 }),
    }),
    {
      name: 'bioscope-wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.count = state.items.length
      },
    }
  )
)

// Selectors
export const useWishlistItems = () => useWishlistStore((state) => state.items)
export const useWishlistCount = () => useWishlistStore((state) => state.count)
export const useIsWished = (productId: string) =>
  useWishlistStore((state) => state.items.some((p) => p.id === productId))
export const useWishlistActions = () =>
  useWishlistStore((state) => ({ toggle: state.toggle, remove: state.remove, clear: state.clear }))
