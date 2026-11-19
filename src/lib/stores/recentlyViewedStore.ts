'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** Minimal snapshot persisted for the recently-viewed rail (last 8). */
export interface ViewedProduct {
  id: string
  slug: string
  name: string
  image: string | null
  basePrice: number
}

interface RecentlyViewedState {
  viewed: ViewedProduct[]
  addViewed: (product: ViewedProduct) => void
  clear: () => void
}

const MAX = 8

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      viewed: [],
      addViewed: (product) =>
        set((state) => {
          const rest = state.viewed.filter((p) => p.id !== product.id)
          return { viewed: [product, ...rest].slice(0, MAX) }
        }),
      clear: () => set({ viewed: [] }),
    }),
    {
      name: 'bioscope-recently-viewed',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ viewed: state.viewed }),
    }
  )
)
