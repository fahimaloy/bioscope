'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { PromoCode } from './PromoCode'
import { useCartStore } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { Truck, Tag, Shield, RotateCcw } from 'lucide-react'

interface CartSummaryProps {
  subtotal: number
  taxAmount: number
  deliveryCharge: number
  discountAmount: number
  total: number
  currency?: string
  freeDeliveryThreshold?: number
  onPromoApply?: (code: string) => void
  onCheckout: () => void
  className?: string
}

export function CartSummary({
  subtotal,
  taxAmount,
  deliveryCharge,
  discountAmount,
  total,
  currency = 'BDT',
  freeDeliveryThreshold = 2000,
  onPromoApply,
  onCheckout,
  className,
}: CartSummaryProps) {
  const { isAuthenticated } = useAuth()
  const deliveryRemaining = Math.max(0, freeDeliveryThreshold - subtotal)

  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card p-6 space-y-6 sticky top-24', className)}>
      <h3 className="font-display text-xl text-primary">Order Summary</h3>

      {/* Promo Code */}
      <PromoCode onApply={onPromoApply} discountAmount={discountAmount} />

      {/* Line Items */}
      <div className="space-y-3 border-t border-[var(--light)] pt-4">
        <div className="flex justify-between text-body">
          <span className="text-[var(--ink)]/70">Subtotal</span>
          <span className="font-display text-primary">{formatCurrency(subtotal, currency)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-body text-green-600">
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              Discount
            </span>
            <span className="font-display">-{formatCurrency(discountAmount, currency)}</span>
          </div>
        )}

        <div className="flex justify-between text-body">
          <span className="text-[var(--ink)]/70 flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Tax
          </span>
          <span className="font-display text-primary">{formatCurrency(taxAmount, currency)}</span>
        </div>

        <div className="flex justify-between text-body">
          <span className="text-[var(--ink)]/70 flex items-center gap-1">
            <Truck className="w-4 h-4" />
            Delivery
          </span>
          <span className="font-display text-primary">
            {deliveryCharge > 0 ? formatCurrency(deliveryCharge, currency) : 'Free'}
          </span>
        </div>

        {deliveryCharge > 0 && deliveryRemaining > 0 && (
          <p className="text-sm text-[var(--ink)]/50 text-center">
            Add {formatCurrency(deliveryRemaining, currency)} more for free delivery!
          </p>
        )}

        <div className="flex justify-between text-lg font-display border-t border-[var(--ink)] pt-4 mt-2">
          <span className="text-[var(--ink)]">Total</span>
          <span className="text-primary">{formatCurrency(total, currency)}</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--light)]">
        <div className="flex items-center gap-2 text-center text-sm text-[var(--ink)]/60">
          <Truck className="w-5 h-5 text-primary" />
          <span>Free delivery over {formatCurrency(freeDeliveryThreshold, currency)}</span>
        </div>
        <div className="flex items-center gap-2 text-center text-sm text-[var(--ink)]/60">
          <Tag className="w-5 h-5 text-primary" />
          <span>Easy returns</span>
        </div>
        <div className="flex items-center gap-2 text-center text-sm text-[var(--ink)]/60">
          <Shield className="w-5 h-5 text-primary" />
          <span>Secure payment</span>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onCheckout}
        disabled={!isAuthenticated}
      >
        {isAuthenticated ? (
          <>Proceed to Checkout - {formatCurrency(total, currency)}</>
        ) : (
          <>Login to Checkout</>
        )}
      </Button>

      {total > 0 && (
        <p className="text-xs text-center text-[var(--ink)]/50">
          Delivery calculated at checkout. Tax included where applicable.
        </p>
      )}
    </div>
  )
}

// Mini Cart Summary for drawer
export function MiniCartSummary({
  subtotal,
  total,
  currency = 'BDT',
  onCheckout,
  className,
}: {
  subtotal: number
  total: number
  currency?: string
  onCheckout: () => void
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card p-4 space-y-3', className)}>
      <div className="flex justify-between text-body">
        <span className="text-[var(--ink)]/70">Subtotal</span>
        <span className="font-display text-primary">{formatCurrency(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between text-lg font-display border-t border-[var(--ink)] pt-3">
        <span className="text-[var(--ink)]">Total</span>
        <span className="text-primary">{formatCurrency(total, currency)}</span>
      </div>
      <Button variant="primary" size="lg" className="w-full" onClick={onCheckout}>
        Checkout - {formatCurrency(total, currency)}
      </Button>
    </div>
  )
}