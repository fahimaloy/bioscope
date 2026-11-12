'use client'

import { cn } from '@/lib/utils'
import { CartSummary } from '@/components/cart/CartSummary'
import { CheckoutCartItem } from '@/components/cart/CartItem'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from '@/types'
import { Card } from '@/components/ui/Card'
import { TornEdge } from '@/components/decorative'
import { motion } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'

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

/** Shared receipt header: a solid brand torn edge + dashed separators. */
function ReceiptEdge({ className }: { className?: string }) {
  return <TornEdge position="top" color="pink" className={cn('h-2 -mx-8 -mt-8', className)} />
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
      <ReceiptEdge />
      <h3 className="font-display text-xl text-[var(--brand)] mb-6">Order Summary</h3>

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
  const variants = useMotionVariants()
  const deliveryRemaining = Math.max(0, freeDeliveryThreshold - subtotal)

  return (
    <Card variant="doodle" padding="lg" className={cn('sticky top-24 space-y-4', className)}>
      <ReceiptEdge />
      <h3 className="font-display text-lg text-[var(--brand)]">Order Summary</h3>

      {/* Items List — dashed separators between the lines. */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {items.map((item) => (
          <motion.div
            key={`${item.productId}-${item.width}-${item.height}`}
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)] rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--ink)_40%,transparent)] transition-colors"
          >
            <img
              src={item.productImage || '/images/sticker-placeholder.svg'}
              alt={item.productName}
              className="w-14 h-14 rounded-[var(--radius-md)] object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)] truncate">{item.productName}</p>
              <p className="text-xs text-[var(--text-subtle)]">{item.width} × {item.height} cm • Qty: {item.quantity}</p>
            </div>
            <span className="font-display text-[var(--brand)] whitespace-nowrap">{formatCurrency(item.unitPrice * item.quantity, currency)}</span>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-dashed border-[color-mix(in_srgb,var(--ink)_15%,transparent)] pt-3 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <span className="font-display text-[var(--brand)]">{formatCurrency(subtotal, currency)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-[var(--success)]">
            <span>Discount</span>
            <span className="font-display">-{formatCurrency(discountAmount, currency)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Tax</span>
          <span className="font-display text-[var(--brand)]">{formatCurrency(taxAmount, currency)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Delivery</span>
          <span className="font-display text-[var(--brand)]">
            {deliveryCharge > 0 ? formatCurrency(deliveryCharge, currency) : 'Free'}
          </span>
        </div>

        {deliveryCharge > 0 && deliveryRemaining > 0 && (
          <motion.p
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            className="text-xs text-[var(--text-subtle)] text-center bg-[color-mix(in_srgb,var(--gold)_50%,transparent)] rounded-[var(--radius-md)] p-2 border border-[color-mix(in_srgb,var(--gold)_30%,transparent)]"
          >
            Add {formatCurrency(deliveryRemaining, currency)} more for free delivery!
          </motion.p>
        )}

        <div className="flex justify-between font-display border-t border-[var(--ink)] pt-3 mt-2">
          <span className="text-[var(--text)]">Total</span>
          <span className="text-[var(--brand)]">{formatCurrency(total, currency)}</span>
        </div>
      </div>
    </Card>
  )
}
