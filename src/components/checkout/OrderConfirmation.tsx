'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { CheckCircle, Clock, MapPin, CreditCard, Share2, Download, RotateCcw, Sparkles } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/types'
import { motion, useReducedMotion } from 'framer-motion'
import { DoodleScatter, StickerPeel } from '@/components/decorative'
import { useMotionVariants } from '@/lib/motion'

interface OrderConfirmationProps {
  order: Order
  onPrint?: () => void
  onDownloadInvoice?: () => void
  onShare?: () => void
  className?: string
}

export function OrderConfirmation({ order, onPrint, onDownloadInvoice, onShare, className }: OrderConfirmationProps) {
  const variants = useMotionVariants()
  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    PRINTING: 'Printing',
    READY_TO_SHIP: 'Ready to Ship',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }

  const paymentMethodLabels = {
    COD: 'Cash on Delivery',
    BANK_TRANSFER: 'Online Payment',
  }

  return (
    <motion.div
      variants={variants.fadeIn}
      initial="initial"
      animate="animate"
      className={cn('space-y-6', className)}
    >
      {/* Celebration Animation */}
      <CelebrationOverlay />

      {/* Success Header */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
        className="text-center py-8 relative"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
          className="w-24 h-24 mx-auto mb-4 bg-[var(--success)] rounded-full flex items-center justify-center shadow-ink-3 border-[3px] border-[var(--ink)]"
        >
          <CheckCircle className="w-12 h-12 text-[var(--on-green)]" />
        </motion.div>

        <motion.h1
          variants={variants.fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
          className="font-display text-4xl text-[var(--brand)] mb-2"
        >
          Order Confirmed!
        </motion.h1>
        <motion.p
          variants={variants.fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
          className="text-[var(--text-muted)]"
        >
          Thank you for your order. We&apos;ll notify you when it ships.
        </motion.p>
      </motion.div>

      {/* Order Number */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.6 }}
        className="relative"
      >
        <Card variant="doodle" padding="lg" className="relative text-center border-[var(--brand)]">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-block"
          >
            <p className="text-sm text-[var(--text-subtle)] uppercase tracking-wider mb-2">Order Number</p>
            <p className="font-display text-4xl text-[var(--brand)] tracking-wide">{order.orderNumber}</p>
            <p className="text-sm text-[var(--text-subtle)] mt-1">Placed on {formatDate(order.createdAt)}</p>
          </motion.div>
        </Card>
      </motion.div>

      {/* Status Badge */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.7 }}
        className="flex items-center justify-center gap-2"
      >
        <Badge variant="primary" size="lg" className="animate-pulse-soft">
          {statusLabels[order.status] || order.status}
        </Badge>
      </motion.div>

      {/* Order Details */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.8 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Shipping Address */}
        <Card variant="doodle" padding="lg" className="relative">
          <h3 className="font-display text-lg text-[var(--brand)] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </h3>
          <div className="space-y-1 text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text)]">{order.shippingName}</p>
            <p>{order.shippingPhone}</p>
            <p>{order.shippingAddress}</p>
            <p>{order.shippingCity}, {order.shippingDistrict}, {order.shippingDivision}</p>
            {order.shippingPostalCode && <p>{order.shippingPostalCode}</p>}
            <p className="text-sm">
              <Badge variant="outline" size="sm">
                {order.deliveryZone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}
              </Badge>
            </p>
          </div>
        </Card>

        {/* Payment Info */}
        <Card variant="doodle" padding="lg" className="relative">
          <h3 className="font-display text-lg text-[var(--brand)] mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-subtle)]">Method</span>
              <span className="font-medium text-[var(--text)]">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-subtle)]">Status</span>
              <span className="font-medium text-[var(--text)] capitalize">{order.paymentStatus.toLowerCase()}</span>
            </div>
            {order.transactionId && (
              <div className="flex justify-between">
                <span className="text-[var(--text-subtle)]">Transaction ID</span>
                <span className="font-mono text-sm text-[var(--text)]">{order.transactionId}</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Order Items */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.9 }}
      >
        <Card variant="doodle" padding="none" className="relative overflow-hidden">
          <div className="p-4 border-b border-dashed border-[color-mix(in_srgb,var(--ink)_15%,transparent)] bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)]">
            <h3 className="font-display text-lg text-[var(--brand)]">Order Items</h3>
          </div>
          <div>
            {order.items.map((item, index) => (
              <motion.div
                key={item.id}
                variants={variants.slideInLeft}
                initial="initial"
                animate="animate"
                transition={{ delay: 1 + index * 0.1 }}
                className={cn(
                  'p-4 flex gap-4',
                  index < order.items.length - 1 &&
                    'border-b border-dashed border-[color-mix(in_srgb,var(--ink)_15%,transparent)]'
                )}
              >
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-16 h-16 rounded-[var(--radius-md)] object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text)] truncate">{item.productName}</p>
                  <p className="text-sm text-[var(--text-subtle)]">{item.width} × {item.height} cm</p>
                  <p className="text-sm text-[var(--text-subtle)]">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[var(--brand)]">{formatCurrency(item.totalPrice)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Price Breakdown */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 1.1 }}
      >
        <Card variant="doodle" padding="lg" className="relative">
          <h3 className="font-display text-lg text-[var(--brand)] mb-4">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[var(--text)]">
              <span className="text-[var(--text-muted)]">Subtotal</span>
              <span className="font-display text-[var(--brand)]">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--text)]">
              <span className="text-[var(--text-muted)]">Tax</span>
              <span className="font-display text-[var(--brand)]">{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-[var(--text)]">
              <span className="text-[var(--text-muted)]">Delivery</span>
              <span className="font-display text-[var(--brand)]">
                {order.deliveryCharge > 0 ? formatCurrency(order.deliveryCharge) : 'Free'}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[var(--success)]">
                <span>Discount</span>
                <span className="font-display">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display border-t border-[var(--ink)] pt-3 mt-2">
              <span className="text-[var(--text)]">Total</span>
              <span className="text-[var(--brand)]">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 1.2 }}
      >
        <Card variant="outlined" padding="lg" className="border-[color-mix(in_srgb,var(--ink)_30%,transparent)] relative">
          <h3 className="font-display text-lg text-[var(--brand)] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            What Happens Next?
          </h3>
          <ol className="space-y-3 text-[var(--text-muted)]">
            {[
              'We\'ll confirm your order within 24 hours',
              'Your stickers will be printed and prepared for shipping',
              'You\'ll receive tracking info once shipped',
              `Delivery within ${order.deliveryZone === 'INSIDE_DHAKA' ? '2-3' : '3-5'} business days`,
            ].map((step, index) => (
              <motion.li
                key={index}
                variants={variants.slideInLeft}
                initial="initial"
                animate="animate"
                transition={{ delay: 1.3 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="w-7 h-7 rounded-full bg-[var(--brand)] text-[var(--text)] text-xs flex items-center justify-center flex-shrink-0 font-display">
                  {index + 1}
                </span>
                <span>{step}</span>
              </motion.li>
            ))}
          </ol>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        variants={variants.fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 1.5 }}
        className="flex flex-wrap gap-3 justify-center"
      >
        <Button variant="primary" onClick={onPrint} size="lg">
          <Download className="w-4 h-4 mr-2" />
          Download Invoice
        </Button>
        <Button variant="secondary" onClick={onShare} size="lg">
          <Share2 className="w-4 h-4 mr-2" />
          Share Order
        </Button>
        <Button variant="outline" onClick={onDownloadInvoice} size="lg">
          <RotateCcw className="w-4 h-4 mr-2" />
          Track Order
        </Button>
        <Button variant="primary" size="lg" onClick={() => window.location.href = '/shop'}>
          <Sparkles className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>
      </motion.div>
    </motion.div>
  )
}

// Celebration overlay: one-shot confetti plus a single real decor accent.
function CelebrationOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {/* Confetti burst — capped at 60 particles, reduced-motion safe. */}
      <ConfettiBurst />

      {/* One decor accent per section (contract §3), from the real decor set. */}
      <DoodleScatter count={6} seed="order-confirmation" />
    </div>
  )
}

/** Confetti particle ceiling (contract §4 / Ruling 8). */
const CONFETTI_PARTICLES = 60

const CONFETTI_COLORS = [
  'var(--brand)',
  'var(--gold)',
  'var(--pink-strong)',
  'var(--success)',
  'var(--violet)',
  'var(--orange)',
]

// CSS-based confetti burst. Local to this file by design — there is no shared
// ConfettiBurst module, and Task 2.5 does not invent one.
function ConfettiBurst() {
  const reduceMotion = useReducedMotion()

  // One-shot: the particle geometry is computed once, on mount.
  const particles = useMemo(
    () =>
      Array.from({ length: CONFETTI_PARTICLES }, (_, index) => ({
        id: index,
        y: 300 + Math.random() * 200,
        x: (Math.random() - 0.5) * 400,
        rotate: Math.random() * 720,
        duration: 1 + Math.random() * 1.5,
        delay: Math.random() * 0.3,
        size: 4 + Math.random() * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        round: Math.random() > 0.5,
      })),
    [],
  )

  // Ruling 8: `useReducedMotion()` collapses the burst.
  if (reduceMotion) return null

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: 0,
            rotate: 0,
          }}
          animate={{
            opacity: 0,
            scale: 0,
            y: particle.y,
            x: particle.x,
            rotate: particle.rotate,
          }}
          transition={{
            duration: particle.duration,
            ease: [0.175, 0.885, 0.32, 1.275],
            delay: particle.delay,
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '20%',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            marginLeft: `-${particle.size / 2}px`,
            marginTop: `-${particle.size / 2}px`,
            backgroundColor: particle.color,
            borderRadius: particle.round ? '50%' : '2px',
            transformOrigin: 'center',
          }}
        />
      ))}
    </>
  )
}

// Compact version for order history
export function OrderConfirmationCard({ order, onViewDetails }: { order: Order; onViewDetails: () => void }) {
  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    PRINTING: 'Printing',
    READY_TO_SHIP: 'Ready to Ship',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }

  return (
    <Card variant="doodle" padding="md" hover className="relative">
      <StickerPeel />
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-display text-lg text-[var(--brand)]">{order.orderNumber}</p>
          <p className="text-sm text-[var(--text-subtle)]">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={getStatusVariant(order.status)} size="md">
          {statusLabels[order.status] || order.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-subtle)]">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
        <span className="font-display text-[var(--brand)]">{formatCurrency(order.total)}</span>
      </div>

      <Button variant="outline" className="w-full mt-3" onClick={onViewDetails}>
        View Details
      </Button>
    </Card>
  )
}

function getStatusVariant(status: string): 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'DELIVERED':
      return 'success'
    case 'SHIPPED':
    case 'READY_TO_SHIP':
    case 'PROCESSING':
    case 'PRINTING':
      return 'primary'
    case 'CONFIRMED':
      return 'secondary'
    case 'PENDING':
      return 'warning'
    case 'CANCELLED':
    case 'REFUNDED':
      return 'error'
    default:
      return 'default'
  }
}
