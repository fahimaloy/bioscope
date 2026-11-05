'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PromoCode } from './PromoCode'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { Truck, Tag, Shield, Package } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100)

  return (
    <Card
      variant="doodle"
      padding="lg"
      className={cn('space-y-6 sticky top-24', className)}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="font-display text-xl text-primary mb-4">Order Summary</h3>

        {/* Promo Code */}
        <PromoCode onApply={onPromoApply} discountAmount={discountAmount} />

        {/* Line Items */}
        <div className="space-y-4 border-t border-[var(--light)] pt-4">
          {/* Subtotal */}
          <div className="flex justify-between text-body">
            <span className="text-[var(--ink)]/70">Subtotal</span>
            <span className="font-display text-primary">{formatCurrency(subtotal, currency)}</span>
          </div>

          {/* Discount */}
          {discountAmount > 0 && (
            <div className="flex justify-between text-body text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Discount
              </span>
              <span className="font-display">-{formatCurrency(discountAmount, currency)}</span>
            </div>
          )}

          {/* Tax */}
          <div className="flex justify-between text-body">
            <span className="text-[var(--ink)]/70 flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Tax
            </span>
            <span className="font-display text-primary">{formatCurrency(taxAmount, currency)}</span>
          </div>

          {/* Delivery */}
          <div className="flex justify-between text-body">
            <span className="text-[var(--ink)]/70 flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Delivery
            </span>
            <span className="font-display text-primary">
              {deliveryCharge > 0 ? formatCurrency(deliveryCharge, currency) : 'Free'}
            </span>
          </div>

          {/* Free Delivery Progress Bar */}
          {deliveryCharge > 0 && deliveryRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <p className="text-sm text-[var(--ink)]/50 text-center">
                Add <span className="font-medium text-primary">{formatCurrency(deliveryRemaining, currency)}</span> more for free delivery!
              </p>
              <div className="w-full h-3 bg-[var(--light)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${freeDeliveryProgress}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--ink)]/40">
                <span>0</span>
                <span>{formatCurrency(freeDeliveryThreshold, currency)}</span>
              </div>
            </motion.div>
          )}

          {/* Total */}
          <div className="flex justify-between text-lg font-display border-t border-[var(--ink)] pt-4 mt-2">
            <span className="text-[var(--ink)]">Total</span>
            <span className="text-primary">{formatCurrency(total, currency)}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--light)]">
          <div className="flex flex-col items-center gap-1 text-center text-sm text-[var(--ink)]/60">
            <Package className="w-5 h-5 text-primary" />
            <span>Free delivery over {formatCurrency(freeDeliveryThreshold, currency)}</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center text-sm text-[var(--ink)]/60">
            <Tag className="w-5 h-5 text-primary" />
            <span>Easy returns</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center text-sm text-[var(--ink)]/60">
            <Shield className="w-5 h-5 text-primary" />
            <span>Secure payment</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          variant="doodle"
          size="xl"
          className="w-full"
          onClick={onCheckout}
          disabled={!isAuthenticated}
        >
          {isAuthenticated ? (
            <>Proceed to Checkout <span className="ml-2">- {formatCurrency(total, currency)}</span></>
          ) : (
            <>Login to Checkout</>
          )}
        </Button>

        {total > 0 && (
          <p className="text-xs text-center text-[var(--ink)]/50">
            Delivery calculated at checkout. Tax included where applicable.
          </p>
        )}
      </motion.div>
    </Card>
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
    <Card variant="doodle" padding="md" className={cn('space-y-3', className)}>
      <div className="flex justify-between text-body">
        <span className="text-[var(--ink)]/70">Subtotal</span>
        <span className="font-display text-primary">{formatCurrency(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between text-lg font-display border-t border-[var(--ink)] pt-3">
        <span className="text-[var(--ink)]">Total</span>
        <span className="text-primary">{formatCurrency(total, currency)}</span>
      </div>
      <Button variant="doodle" size="lg" className="w-full" onClick={onCheckout}>
        Checkout - {formatCurrency(total, currency)}
      </Button>
    </Card>
  )
}