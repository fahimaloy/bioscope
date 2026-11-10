'use client'

import { useCartStore, useCartItems, useCartSubtotal } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/Button'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { Trash2, ShoppingCart, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { motionVariants } from '@/lib/motion'
import { DoodleShape } from '@/components/decorative/DoodleElements'

export default function CartPage() {
  const items = useCartItems()
  const subtotal = useCartSubtotal()
  const { removeItem, updateQuantity, clearCart } = useCartStore()

  // Tax calculation (10% for example)
  const taxAmount = Math.round(subtotal * 0.1)
  // Delivery charge - free over 2000
  const freeDeliveryThreshold = 2000
  const deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : 60
  const discountAmount = 0 // Will be handled by promo code
  const total = subtotal + taxAmount + deliveryCharge - discountAmount

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="relative mb-8"
          >
            <DoodleShape size="xl" color="primary" animation="float" className="mx-auto mb-4 opacity-30" />
            <DoodleShape size="lg" color="secondary" animation="float" className="absolute -top-10 -right-10 opacity-20" style={{ animationDelay: '1s' }} />
            <DoodleShape size="md" color="accent" animation="wobble" className="absolute -bottom-10 -left-10 opacity-20" style={{ animationDelay: '0.5s' }} />
            <div className="relative z-10 w-32 h-32 mx-auto mb-6 bg-[var(--light)] rounded-full flex items-center justify-center shadow-card">
              <ShoppingCart className="w-16 h-16 text-[color-mix(in_srgb,var(--ink)_30%,transparent)]" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl md:text-4xl text-[var(--ink)] mb-4"
          >
            Your cart is empty
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[color-mix(in_srgb,var(--ink)_60%,transparent)] mb-8 text-lg"
          >
            Looks like you haven't added any stickers yet.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/shop">
              <Button variant="doodle" size="xl">
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
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-primary">Shopping Cart</h1>
            <p className="text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" onClick={clearCart} className="text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Cart
            </Button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div variants={motionVariants.staggerContainer}>
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
              onCheckout={() => {}}
            />
          </div>
        </motion.div>

        {/* Continue Shopping */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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