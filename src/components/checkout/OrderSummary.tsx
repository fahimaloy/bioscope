'use client'

import { cn } from '@/lib/utils'
import { CartSummary } from '@/components/cart/CartSummary'
import { CheckoutCartItem } from '@/components/cart/CartItem'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from '@/types'

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  taxAmount: number
  deliveryCharge: number
  discountAmount: number
  total: number
  currency?: string
  freeDeliveryThreshold?: number
  className?: string
}

export function OrderSummary({
  items,
  subtotal,
  taxAmount,
  deliveryCharge,
  discountAmount,
  total,
  currency = 'BDT',
  freeDeliveryThreshold = 2000,
  className,
}: OrderSummaryProps) {
  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card p-6 space-y-6 sticky top-24', className)}>
      <h3 className="font-display text-xl text-primary">Order Summary</h3>

      {/* Items */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <CheckoutCartItem key={`${item.productId}-${item.width}-${item.height}`} item={item} />
        ))}
      </div>

      {/* Summary */}
      <CartSummary
        subtotal={subtotal}
        taxAmount={taxAmount}
        deliveryCharge={deliveryCharge}
        discountAmount={discountAmount}
        total={total}
        currency={currency}
        freeDeliveryThreshold={freeDeliveryThreshold}
        onPromoApply={() => {}}
        onCheckout={() => {}}
      />
    </div>
  )
}

// Simplified version for checkout page
export function CheckoutOrderSummary({
  items,
  subtotal,
  taxAmount,
  deliveryCharge,
  discountAmount,
  total,
  currency = 'BDT',
  freeDeliveryThreshold = 2000,
  className,
}: OrderSummaryProps) {
  const deliveryRemaining = Math.max(0, freeDeliveryThreshold - subtotal)

  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card p-6 space-y-4', className)}>
      <h3 className="font-display text-lg text-primary">Order Summary</h3>

      {/* Items List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={`${item.productId}-${item.width}-${item.height}`} className="flex items-center gap-3 p-2 bg-[var(--light)] rounded-input">
            <img src={item.productImage || '/images/sticker-placeholder.svg'} alt={item.productName} className="w-12 h-12 rounded-input object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--ink)] truncate">{item.productName}</p>
              <p className="text-xs text-[var(--ink)]/50">{item.width} × {item.height} cm • Qty: {item.quantity}</p>
            </div>
            <span className="font-medium text-primary">{formatCurrency(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--light)] pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--ink)]/70">Subtotal</span>
          <span className="font-medium text-primary">{formatCurrency(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-[var(--ink)]/70">Tax</span>
          <span className="font-medium text-primary">{formatCurrency(taxAmount)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[var(--ink)]/70">Delivery</span>
          <span className="font-medium text-primary">
            {deliveryCharge > 0 ? formatCurrency(deliveryCharge) : 'Free'}
          </span>
        </div>

        {deliveryCharge > 0 && deliveryRemaining > 0 && (
          <p className="text-xs text-[var(--ink)]/50 text-center">
            Add {formatCurrency(deliveryRemaining)} more for free delivery!
          </p>
        )}

        <div className="flex justify-between font-display border-t border-[var(--ink)] pt-2">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}