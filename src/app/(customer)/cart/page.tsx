'use client'

import { useCartStore, useCartItems, useCartSubtotal } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { formatCurrency } from '@/lib/utils'
import { Trash2, ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function CartPage() {
  const items = useCartItems()
  const subtotal = useCartSubtotal()
  const { removeItem, updateQuantity, clearCart, closeCart } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-[var(--light)] rounded-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-[var(--ink)]/30" />
          </div>
          <h1 className="font-display text-3xl text-[var(--ink)] mb-4">Your cart is empty</h1>
          <p className="text-[var(--ink)]/60 mb-8">Looks like you haven't added any stickers yet.</p>
          <Link href="/shop">
            <Button variant="primary" size="lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Shopping Cart</h1>
            <p className="text-[var(--ink)]/60">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" onClick={clearCart} className="text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Cart
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem
                key={`${item.productId}-${item.width}-${item.height}`}
                item={item}
                onUpdate={(itemId, quantity) => {
                  const [productId, width, height] = itemId.split('-')
                  updateQuantity(productId, parseFloat(width), parseFloat(height), quantity)
                }}
                onRemove={(itemId) => {
                  const [productId, width, height] = itemId.split('-')
                  removeItem(productId, parseFloat(width), parseFloat(height))
                }}
                showEdit
              />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              subtotal={subtotal}
              taxAmount={0}
              deliveryCharge={0}
              discountAmount={0}
              total={subtotal}
              onCheckout={() => {}}
            />
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="mt-8 text-center">
          <Link href="/shop">
            <Button variant="secondary" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
