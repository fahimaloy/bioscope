'use client'

import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PromoCode } from './PromoCode'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMotionVariants } from '@/lib/motion'
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
  const variants = useMotionVariants()
  const deliveryRemaining = Math.max(0, freeDeliveryThreshold - subtotal)
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100)
  // Ruling 6: the checkout control is a real navigation — `/checkout` when
  // authenticated, `/login?redirect=/checkout` when anonymous. The anonymous
  // control must stay operable, so it is a link rather than a disabled button
  // (a disabled button swallows the click and cannot navigate).
  const checkoutHref = isAuthenticated ? '/checkout' : '/login?redirect=/checkout'

  return (
    <Card
      variant="outlined"
      elevation="raised"
      padding="lg"
      className={cn('space-y-6 sticky top-24 border-dashed', className)}
    >
      <motion.div variants={variants.fadeInUp} initial="initial" animate="animate">
        <h3 className="font-display text-xl text-[var(--brand)] mb-4">Order Summary</h3>

        {/* Promo Code */}
        <PromoCode onApply={onPromoApply} discountAmount={discountAmount} />

        {/* Line Items — dashed separators, receipt-styled */}
        <div className="space-y-4 border-t border-dashed border-[color-mix(in_srgb,var(--ink)_15%,transparent)] pt-4">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Subtotal</span>
            <span className="font-display text-[var(--brand)]">{formatCurrency(subtotal, currency)}</span>
          </div>

          {/* Discount */}
          {discountAmount > 0 && (
            <div className="flex justify-between text-[var(--success)]">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Discount
              </span>
              <span className="font-display">-{formatCurrency(discountAmount, currency)}</span>
            </div>
          )}

          {/* Tax */}
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)] flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Tax
            </span>
            <span className="font-display text-[var(--brand)]">{formatCurrency(taxAmount, currency)}</span>
          </div>

          {/* Delivery */}
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)] flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Delivery
            </span>
            <span className="font-display text-[var(--brand)]">
              {deliveryCharge > 0 ? formatCurrency(deliveryCharge, currency) : 'Free'}
            </span>
          </div>

          {/* Free Delivery Progress Bar */}
          {deliveryCharge > 0 && deliveryRemaining > 0 && (
            <motion.div
              variants={variants.fadeInUp}
              initial="initial"
              animate="animate"
              className="space-y-2"
            >
              <p className="text-sm text-[var(--text-subtle)] text-center">
                Add <span className="font-medium text-[var(--brand)]">{formatCurrency(deliveryRemaining, currency)}</span> more for free delivery!
              </p>
              <div className="w-full h-3 bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--brand)] rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: freeDeliveryProgress / 100 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-subtle)]">
                <span>0</span>
                <span>{formatCurrency(freeDeliveryThreshold, currency)}</span>
              </div>
            </motion.div>
          )}

          {/* Total */}
          <div className="flex justify-between text-lg font-display border-t border-[var(--ink)] pt-4 mt-2">
            <span className="text-[var(--text)]">Total</span>
            <span className="text-[var(--brand)]">{formatCurrency(total, currency)}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dashed border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
          <div className="flex flex-col items-center gap-1 text-center text-sm text-[var(--text-subtle)]">
            <Package className="w-5 h-5 text-[var(--brand)]" />
            <span>Free delivery over {formatCurrency(freeDeliveryThreshold, currency)}</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center text-sm text-[var(--text-subtle)]">
            <Tag className="w-5 h-5 text-[var(--brand)]" />
            <span>Easy returns</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center text-sm text-[var(--text-subtle)]">
            <Shield className="w-5 h-5 text-[var(--brand)]" />
            <span>Secure payment</span>
          </div>
        </div>

        {/* Checkout CTA — a real link, not a dead button (Ruling 6) */}
        <Link href={checkoutHref} className="block">
          <Button variant="primary" size="xl" className="w-full" onClick={onCheckout}>
            {isAuthenticated ? (
              <>Proceed to Checkout <span className="ml-2">- {formatCurrency(total, currency)}</span></>
            ) : (
              <>Login to Checkout</>
            )}
          </Button>
        </Link>

        {total > 0 && (
          <p className="text-xs text-center text-[var(--text-subtle)]">
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
    <Card variant="outlined" elevation="raised" padding="md" className={cn('space-y-3 border-dashed', className)}>
      <div className="flex justify-between">
        <span className="text-[var(--text-muted)]">Subtotal</span>
        <span className="font-display text-[var(--brand)]">{formatCurrency(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between text-lg font-display border-t border-[var(--ink)] pt-3">
        <span className="text-[var(--text)]">Total</span>
        <span className="text-[var(--brand)]">{formatCurrency(total, currency)}</span>
      </div>
      <Button variant="primary" size="lg" className="w-full" onClick={onCheckout}>
        Checkout - {formatCurrency(total, currency)}
      </Button>
    </Card>
  )
}
