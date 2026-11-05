'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { CompactQuantitySelector } from '@/components/product/QuantitySelector'
import { useCartStore, useCartItems, useCartIsOpen, useCartActions } from '@/lib/stores/cartStore'
import { X, Trash2, ShoppingCart, Tag, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from '@/types'

export function CartDrawer() {
  const isOpen = useCartIsOpen()
  const items = useCartItems()
  const subtotal = useCartStore((state) => state.subtotal)
  const { closeCart, removeItem, updateQuantity, clearCart, getItemQuantity, getItemTotal } = useCartActions()
  const asideRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    document.addEventListener('keydown', handleKey)
    asideRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, closeCart])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="fixed right-0 top-16 bottom-0 z-50 w-full max-w-md bg-white border-l-3 border-[var(--ink)] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col animate-slide-in"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--light)]">
          <h2 id="cart-drawer-title" className="font-display text-xl text-primary">Shopping Cart</h2>
          <Button variant="ghost" size="sm" onClick={closeCart} aria-label="Close cart">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-[var(--ink)]/20 mx-auto mb-4" />
              <p className="text-body text-[var(--ink)]/60 mb-2">Your cart is empty</p>
              <Link href="/shop">
                <Button variant="primary" className="mt-4">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <CartDrawerItem key={`${item.productId}-${item.width}-${item.height}`} item={item} />
              ))}

              {/* Subtotal */}
              <div className="border-t border-[var(--light)] pt-4 mt-4 space-y-3">
                <div className="flex justify-between text-body">
                  <span className="text-[var(--ink)]/70">Subtotal</span>
                  <span className="font-display text-primary">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--ink)]/60">
                  <span>Estimated Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--ink)]/60">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--light)] space-y-3">
          {items.length > 0 && (
            <>
              <Link href="/cart" onClick={closeCart}>
                <Button variant="secondary" className="w-full">
                  View Cart
                </Button>
              </Link>
              <Link href="/checkout" onClick={closeCart}>
                <Button variant="primary" className="w-full" size="lg">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Checkout - {formatCurrency(subtotal)}
                </Button>
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

function CartDrawerItem({ item }: { item: CartItem }) {
  const { getItemQuantity, updateQuantity, removeItem } = useCartActions()
  const quantity = getItemQuantity(item.productId, item.width, item.height)

  return (
    <div className="flex gap-3 p-3 bg-[var(--light)] rounded-input border border-[var(--ink)]/20">
      <div className="relative w-20 h-20 flex-shrink-0 rounded-input overflow-hidden border border-[var(--ink)]/20">
        {item.product.images[0] && (
          <Image
            src={item.product.images[0]}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="80px"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/shop/${item.productSlug}`} className="block">
          <h4 className="font-medium text-body text-[var(--ink)] truncate">{item.productName}</h4>
        </Link>
        <div className="flex items-center gap-2 mt-1 text-sm text-[var(--ink)]/60">
          <Tag className="w-3 h-3" />
          <span>{item.width} × {item.height} cm</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-display text-primary">{formatCurrency(item.unitPrice * quantity)}</span>
          <CompactQuantitySelector
            quantity={quantity}
            onChange={(q) => updateQuantity(item.productId, item.width, item.height, q)}
            min={1}
            max={999}
          />
        </div>
      </div>
      <button
        onClick={() => removeItem(item.productId, item.width, item.height)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[var(--ink)]/40 hover:text-red-500 transition-colors"
        aria-label="Remove item"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}