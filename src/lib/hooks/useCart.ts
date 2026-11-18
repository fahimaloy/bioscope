'use client'

import { useCartItems, useCartItemCount, useCartSubtotal, useCartIsOpen, useCartActions } from '@/lib/stores/cartStore'
import type { CartItem, Product } from '@/types'
import { useCallback } from 'react'

export function useCart() {
  const items = useCartItems()
  const itemCount = useCartItemCount()
  const subtotal = useCartSubtotal()
  const isOpen = useCartIsOpen()
  const actions = useCartActions()

  const addItem = useCallback(
    (product: Product, width: number, height: number, quantity: number = 1, customization?: Record<string, unknown>) => {
      // Validate quantity against product's allowed quantities
      const qtyConfig = product.allowedQuantities.find(
        (q) => quantity >= q.minQty && (q.maxQty === null || quantity <= q.maxQty!)
      )
      if (!qtyConfig) {
        throw new Error(`Invalid quantity for this product. Allowed: ${product.allowedQuantities.map(q => q.label).join(', ')}`)
      }

      // Validate dimensions
      const dimConfig = product.allowedDimensions.find(
        (d) => d.width === width && d.height === height
      )
      if (!dimConfig) {
        throw new Error('Invalid dimensions for this product')
      }

    
      actions.addItem({
        productId: product.id,
        product,
        width,
        height,
        quantity,
        customization: customization ?? null,
      })
    },
    [actions]
  )

  const getItemTotal = useCallback(
    (item: CartItem): number => {
      const qtyConfig = item.product.allowedQuantities.find(
        (q) => item.quantity >= q.minQty && (q.maxQty === null || item.quantity <= q.maxQty!)
      )
      const dimConfig = item.product.allowedDimensions.find(
        (d) => d.width === item.width && d.height === item.height
      )
      const pricePerUnit = qtyConfig?.pricePerUnit || item.product.basePrice
      const multiplier = dimConfig?.priceMultiplier || 1
      return pricePerUnit * multiplier * item.quantity
    },
    []
  )

  const getCartTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + getItemTotal(item), 0)
  }, [items, getItemTotal])

  const getTaxAmount = useCallback(
    (taxPercent: number, taxInclusive: boolean = false) => {
      const total = getCartTotal()
      if (taxInclusive) {
        return (total * taxPercent) / (100 + taxPercent)
      }
      return (total * taxPercent) / 100
    },
    [getCartTotal]
  )

  const isInCart = useCallback(
    (productId: string, width: number, height: number) => {
      return items.some((item) => item.productId === productId && item.width === width && item.height === height)
    },
    [items]
  )

  const getItemQuantity = useCallback(
    (productId: string, width: number, height: number) => {
      const item = items.find((item) => item.productId === productId && item.width === width && item.height === height)
      return item?.quantity || 0
    },
    [items]
  )

  return {
    items,
    itemCount,
    subtotal,
    isOpen,
    addItem,
    removeItem: actions.removeItem,
    updateQuantity: actions.updateQuantity,
    updateCustomization: actions.updateCustomization,
    clearCart: actions.clearCart,
    toggleCart: actions.toggleCart,
    openCart: actions.openCart,
    closeCart: actions.closeCart,
    getItemTotal,
    getCartTotal,
    getTaxAmount,
    isInCart,
    getItemQuantity,
  }
}