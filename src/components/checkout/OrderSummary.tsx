'use client'

import { cn } from '@/lib/utils'
import { CartSummary } from '@/components/cart/CartSummary'
import { CheckoutCartItem } from '@/components/cart/CartItem'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from '@/types'
import { Card } from '@/components/ui/Card'
import { TornEdge } from '@/components/decorative/DoodleElements'
import { motion } from 'framer-motion'

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
    <Card variant="doodle" padding="lg" className={cn('sticky top-24', className)}>
      <TornEdge position="top" className="h-2 bg-[var(--accent)] -mx-8 -mt-8" />
      <h3 className="font-display text-xl text-primary mb-6">Order Summary</h3>

      {/* Items */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
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
    </Card>
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
    <Card variant="doodle" padding="lg" className={cn('sticky top-24 space-y-4', className)}>
      <TornEdge position="top" className="h-2 bg-gradient-to-r from-[var(--accent)] to-[var(--pink)] -mx-8 -mt-8" />
      <h3 className="font-display text-lg text-primary">Order Summary</h3>

      {/* Items List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {items.map((item) => (
          <motion.div
            key={`${item.productId}-${item.width}-${item.height}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)] rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--ink)_40%,transparent)] transition-colors"
          >
            <img
              src={item.productImage || '/images/sticker-placeholder.svg'}
              alt={item.productName}
              className="w-14 h-14 rounded-input object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--ink)] truncate">{item.productName}</p>
              <p className="text-xs text-[color-mix(in_srgb,var(--ink)_50%,transparent)]">{item.width} × {item.height} cm • Qty: {item.quantity}</p>
            </div>
            <span className="font-display text-primary whitespace-nowrap">{formatCurrency(item.unitPrice * item.quantity)}</span>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-[var(--light)] pt-3 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">Subtotal</span>
          <span className="font-display text-primary">{formatCurrency(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="font-display">-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">Tax</span>
          <span className="font-display text-primary">{formatCurrency(taxAmount)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">Delivery</span>
          <span className="font-display text-primary">
            {deliveryCharge > 0 ? formatCurrency(deliveryCharge) : 'Free'}
          </span>
        </div>

        {deliveryCharge > 0 && deliveryRemaining > 0 && (
          <motion.p
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            style={{ transformOrigin: 'top' }}
            className="text-xs text-[color-mix(in_srgb,var(--ink)_50%,transparent)] text-center bg-[color-mix(in_srgb,var(--accent)_50%,transparent)] rounded-input p-2 border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
          >
            Add {formatCurrency(deliveryRemaining)} more for free delivery!
          </motion.p>
        )}

        <div className="flex justify-between font-display border-t border-[var(--ink)] pt-3 mt-2">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>
    </Card>
  )
}