'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'

/** What callers provide; the store fills id/cartId/timestamps and denormalized fields. */
export type CartItemInput = Omit<
  CartItem,
  'id' | 'cartId' | 'createdAt' | 'updatedAt' | 'productName' | 'productSlug' | 'productImage' | 'unitPrice'
>

interface CartState {
  items: CartItem[]
  isOpen: boolean
  itemCount: number
  subtotal: number

  // Actions
  addItem: (item: CartItemInput) => void
  removeItem: (productId: string, width: number, height: number) => void
  updateQuantity: (productId: string, width: number, height: number, quantity: number) => void
  updateCustomization: (productId: string, width: number, height: number, customization: Record<string, any>) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  setItems: (items: CartItem[]) => void
  hydrate: (items: CartItem[]) => void
  getItemQuantity: (productId: string, width: number, height: number) => number
  getItemTotal: (item: CartItem) => number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Client-side preview price; the server re-prices everything at checkout. */
const previewUnitPrice = (product: Product, width: number, height: number, quantity: number): number => {
  const qtyTier = product.allowedQuantities?.find(
    (q) => quantity >= q.minQty && (q.maxQty === null || quantity <= q.maxQty)
  )
  const dim = product.allowedDimensions?.find((d) => d.width === width && d.height === height)
  const base = qtyTier ? qtyTier.pricePerUnit : product.basePrice
  const multiplier = dim ? dim.priceMultiplier : 1
  return round2(base * multiplier)
}

const itemUnitPrice = (item: CartItem): number =>
  typeof item.unitPrice === 'number' ? item.unitPrice : item.product?.basePrice ?? 0

const calculateTotals = (items: CartItem[]) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + round2(itemUnitPrice(item) * item.quantity), 0)
  return { itemCount, subtotal }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      itemCount: 0,
      subtotal: 0,

      addItem: (newItem) => {
        const items = get().items
        const existingIndex = items.findIndex(
          (item) =>
            item.productId === newItem.productId &&
            item.width === newItem.width &&
            item.height === newItem.height
        )

        let updatedItems: CartItem[]

        if (existingIndex >= 0) {
          updatedItems = items.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          )
        } else {
          const cartItem: CartItem = {
            ...newItem,
            id: crypto.randomUUID(),
            cartId: 'local',
            productName: newItem.product.name,
            productSlug: newItem.product.slug,
            productImage: newItem.product.images?.[0] ?? null,
            unitPrice: previewUnitPrice(newItem.product, newItem.width, newItem.height, newItem.quantity),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          updatedItems = [...items, cartItem]
        }

        const { itemCount, subtotal } = calculateTotals(updatedItems)
        set({ items: updatedItems, itemCount, subtotal })
      },

      removeItem: (productId, width, height) => {
        const updatedItems = get().items.filter(
          (item) => !(item.productId === productId && item.width === width && item.height === height)
        )
        const { itemCount, subtotal } = calculateTotals(updatedItems)
        set({ items: updatedItems, itemCount, subtotal })
      },

      updateQuantity: (productId, width, height, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, width, height)
          return
        }

        const updatedItems = get().items.map((item) =>
          item.productId === productId && item.width === width && item.height === height
            ? { ...item, quantity, updatedAt: new Date() }
            : item
        )
        const { itemCount, subtotal } = calculateTotals(updatedItems)
        set({ items: updatedItems, itemCount, subtotal })
      },

      updateCustomization: (productId, width, height, customization) => {
        const updatedItems = get().items.map((item) =>
          item.productId === productId && item.width === width && item.height === height
            ? { ...item, customization, updatedAt: new Date() }
            : item
        )
        set({ items: updatedItems })
      },

      clearCart: () => set({ items: [], itemCount: 0, subtotal: 0 }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      setItems: (items) => {
        const { itemCount, subtotal } = calculateTotals(items)
        set({ items, itemCount, subtotal })
      },

      hydrate: (items) => {
        // Called on client hydration to sync with server
        const { itemCount, subtotal } = calculateTotals(items)
        set({ items, itemCount, subtotal })
      },

      getItemQuantity: (productId, width, height) => {
        const item = get().items.find(
          (i) => i.productId === productId && i.width === width && i.height === height
        )
        return item?.quantity ?? 0
      },

      getItemTotal: (item) => round2(itemUnitPrice(item) * item.quantity),
    }),
    {
      name: 'sticker-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        itemCount: state.itemCount,
        subtotal: state.subtotal,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { itemCount, subtotal } = calculateTotals(state.items)
          state.itemCount = itemCount
          state.subtotal = subtotal
        }
      },
    }
  )
)

// Selectors for performance
export const useCartItems = () => useCartStore((state) => state.items)
export const useCartItemCount = () => useCartStore((state) => state.itemCount)
export const useCartSubtotal = () => useCartStore((state) => state.subtotal)
export const useCartIsOpen = () => useCartStore((state) => state.isOpen)

// Check if item is in cart
export const useIsInCart = (productId: string, width: number, height: number) =>
  useCartStore((state) =>
    state.items.some(
      (item) => item.productId === productId && item.width === width && item.height === height
    )
  )

// Get quantity of specific item in cart
export const useGetItemQuantity = (productId: string, width: number, height: number) =>
  useCartStore((state) => {
    const item = state.items.find(
      (item) => item.productId === productId && item.width === width && item.height === height
    )
    return item?.quantity || 0
  })

export const useCartActions = () =>
  useCartStore((state) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    updateCustomization: state.updateCustomization,
    clearCart: state.clearCart,
    toggleCart: state.toggleCart,
    openCart: state.openCart,
    closeCart: state.closeCart,
    getItemQuantity: state.getItemQuantity,
    getItemTotal: state.getItemTotal,
  }))