'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, ShoppingCart, Trash2 } from 'lucide-react'
import { useCartItems, useCartStore, useCartSubtotal } from '@/lib/stores/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMotionVariants } from '@/lib/motion'
import { DoodleArrow } from '@/components/decorative'
import { Button } from '@/components/ui/Button'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'

/**
 * The server's own defaults (`getPricingSettings()` in
 * `src/lib/actions/settings.ts`). They are the fallback until
 * `/api/settings/public` resolves, and when it fails.
 */
const DEFAULT_TAX_PERCENT = 5
const DEFAULT_DELIVERY_CHARGE = 60
const DEFAULT_FREE_DELIVERY_THRESHOLD = 2000

/** The public settings the summary needs (`GET /api/settings/public`). */
interface PublicSettings {
  global_tax_percent?: number | string
  delivery_inside_dhaka_charge?: number | string
  free_delivery_threshold?: number | string
}

/** Coerce a setting to a finite number, falling back to the server default. */
function toNumber(value: number | string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function CartPage() {
  const items = useCartItems()
  const subtotal = useCartSubtotal()
  const { removeItem, updateQuantity, clearCart } = useCartStore()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const variants = useMotionVariants()

  const [taxPercent, setTaxPercent] = useState(DEFAULT_TAX_PERCENT)
  const [deliveryChargeSetting, setDeliveryChargeSetting] = useState(DEFAULT_DELIVERY_CHARGE)
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(
    DEFAULT_FREE_DELIVERY_THRESHOLD,
  )

  // Tax and delivery are settings-driven (Ruling 5). The pre-rebuild page
  // hardcoded a 10% tax and never read `/api/settings/public`.
  useEffect(() => {
    let cancelled = false

    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/public')
        if (!response.ok) return
        const body = await response.json()
        const settings = (body?.data ?? {}) as PublicSettings
        if (cancelled) return
        setTaxPercent(toNumber(settings.global_tax_percent, DEFAULT_TAX_PERCENT))
        setDeliveryChargeSetting(
          toNumber(settings.delivery_inside_dhaka_charge, DEFAULT_DELIVERY_CHARGE),
        )
        setFreeDeliveryThreshold(
          toNumber(settings.free_delivery_threshold, DEFAULT_FREE_DELIVERY_THRESHOLD),
        )
      } catch {
        // Keep the server defaults when the settings endpoint is unreachable.
      }
    }

    loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  const taxAmount = Math.round((subtotal * taxPercent) / 100)
  // Inside-Dhaka is the estimate; the summary keeps the "calculated at
  // checkout" note so the estimate is never presented as final.
  const deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : deliveryChargeSetting
  const discountAmount = 0
  const total = subtotal + taxAmount + deliveryCharge - discountAmount

  // Ruling 6: the checkout CTA is a real navigation, not a dead button.
  const checkoutHref = isAuthenticated ? '/checkout' : '/login?redirect=/checkout'

  if (items.length === 0) {
    return (
   <div className="min-h-screen px-4 pb-12 pt-24">
        <div className="mx-auto max-w-2xl py-16 text-center">
          <motion.div
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            className="relative mb-8"
          >
            {/* One decor accent per section (contract §3): a single DoodleArrow. */}
            <DoodleArrow size={64} color="pink" animation="float" className="mx-auto mb-6" />
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[var(--paper-deep)] shadow-ink-3">
              <ShoppingCart className="h-16 w-16 text-[var(--text-subtle)]" />
            </div>
          </motion.div>

          <motion.h1
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-4xl text-[var(--text)] mb-4"
          >
            Your cart is empty
          </motion.h1>

          <motion.p
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
            className="text-[var(--text-muted)] mb-8 text-lg"
          >
            Looks like you haven&apos;t added any stickers yet.
          </motion.p>

          <motion.div
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <Link href="/shop">
              <Button variant="primary" size="xl">
                <Package className="w-6 h-6 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen px-4 pb-12 pt-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={variants.fadeInUp}
          initial="initial"
          animate="animate"
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--text)]">Shopping Cart</h1>
            <p className="text-[var(--text-muted)]">
              {items.length} item{items.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={clearCart}
            className="text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)]"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear Cart
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div variants={variants.staggerContainer} initial="initial" animate="animate">
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
            </motion.div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              subtotal={subtotal}
              taxAmount={taxAmount}
              deliveryCharge={deliveryCharge}
              discountAmount={discountAmount}
              total={total}
              freeDeliveryThreshold={freeDeliveryThreshold}
              onCheckout={() => router.push(checkoutHref)}
            />
          </div>
        </div>

        {/* Continue Shopping */}
        <motion.div
          variants={variants.fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <Link href="/shop">
            <Button variant="secondary" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
