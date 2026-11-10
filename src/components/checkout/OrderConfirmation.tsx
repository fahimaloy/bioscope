'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { CheckCircle, Truck, Clock, MapPin, CreditCard, Share2, Download, RotateCcw, Sparkles } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/types'
import { motion } from 'framer-motion'
import { DoodleShape } from '@/components/decorative/DoodleElements'
import { StickerPeel } from '@/components/decorative/DoodleElements'

interface OrderConfirmationProps {
  order: Order
  onPrint?: () => void
  onDownloadInvoice?: () => void
  onShare?: () => void
  className?: string
}

export function OrderConfirmation({ order, onPrint, onDownloadInvoice, onShare, className }: OrderConfirmationProps) {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('space-y-6', className)}
    >
      {/* Celebration Animation */}
      <CelebrationOverlay />

      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.175, 0.885, 0.32, 1.275] }}
        className="text-center py-8 relative"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
          className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[var(--success)] to-[var(--secondary)] rounded-full flex items-center justify-center shadow-card"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="font-display text-4xl text-primary mb-2"
        >
          Order Confirmed!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-body text-[color-mix(in_srgb,var(--ink)_60%,transparent)]"
        >
          Thank you for your order. We'll notify you when it ships.
        </motion.p>
      </motion.div>

      {/* Order Number */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
        className="relative"
      >
        <Card variant="doodle" padding="lg" className="relative text-center border-primary">
          <StickerPeel />
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-block"
          >
            <p className="text-sm text-[color-mix(in_srgb,var(--ink)_60%,transparent)] uppercase tracking-wider mb-2">Order Number</p>
            <p className="font-display text-4xl text-primary tracking-wide">{order.orderNumber}</p>
            <p className="text-sm text-[color-mix(in_srgb,var(--ink)_50%,transparent)] mt-1">Placed on {formatDate(order.createdAt)}</p>
          </motion.div>
        </Card>
      </motion.div>

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        className="flex items-center justify-center gap-2"
      >
        <Badge variant="primary" size="lg" className="animate-pulse-soft">
          {statusLabels[order.status] || order.status}
        </Badge>
      </motion.div>

      {/* Order Details */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Shipping Address */}
        <Card variant="doodle" padding="lg" className="relative">
          <StickerPeel />
          <h3 className="font-display text-lg text-primary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </h3>
          <div className="space-y-1 text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
            <p className="font-medium">{order.shippingName}</p>
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
          <StickerPeel />
          <h3 className="font-display text-lg text-primary mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Method</span>
              <span className="font-medium">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Status</span>
              <span className="font-medium capitalize">{order.paymentStatus.toLowerCase()}</span>
            </div>
            {order.transactionId && (
              <div className="flex justify-between">
                <span className="text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Transaction ID</span>
                <span className="font-mono text-sm">{order.transactionId}</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Order Items */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <Card variant="doodle" padding="none" className="relative overflow-hidden">
          <StickerPeel />
          <div className="p-4 border-b border-[var(--light)] bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)]">
            <h3 className="font-display text-lg text-primary">Order Items</h3>
          </div>
          <div className="divide-y divide-[var(--light)]">
            {order.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                className="p-4 flex gap-4"
              >
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-16 h-16 rounded-input object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-body text-[var(--ink)] truncate">{item.productName}</p>
                  <p className="text-sm text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">{item.width} × {item.height} cm</p>
                  <p className="text-sm text-[color-mix(in_srgb,var(--ink)_50%,transparent)]">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-primary">{formatCurrency(item.totalPrice)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Price Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
      >
        <Card variant="doodle" padding="lg" className="relative">
          <StickerPeel />
          <h3 className="font-display text-lg text-primary mb-4">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-body">
              <span className="text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">Subtotal</span>
              <span className="font-display text-primary">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-body">
              <span className="text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">Tax</span>
              <span className="font-display text-primary">{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-body">
              <span className="text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">Delivery</span>
              <span className="font-display text-primary">
                {order.deliveryCharge > 0 ? formatCurrency(order.deliveryCharge) : 'Free'}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-body text-green-600">
                <span>Discount</span>
                <span className="font-display">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-display border-t border-[var(--ink)] pt-3 mt-2">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        <Card variant="outlined" padding="lg" className="border-[color-mix(in_srgb,var(--ink)_30%,transparent)] relative">
          <StickerPeel />
          <h3 className="font-display text-lg text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            What Happens Next?
          </h3>
          <ol className="space-y-3 text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
            {[
              'We\'ll confirm your order within 24 hours',
              'Your stickers will be printed and prepared for shipping',
              'You\'ll receive tracking info once shipped',
              `Delivery within ${order.deliveryZone === 'INSIDE_DHAKA' ? '2-3' : '3-5'} business days`,
            ].map((step, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <span className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0 font-display">
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4 }}
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
        <Button variant="doodle" size="lg" onClick={() => window.location.href = '/shop'}>
          <Sparkles className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>
      </motion.div>
    </motion.div>
  )
}

// Celebration overlay with confetti and floating shapes
function CelebrationOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {/* Confetti burst */}
      <ConfettiBurst />
      
      {/* Floating doodle shapes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.15, 0], 
            scale: [0, 1, 0],
            y: [0, -200],
            x: [-100, 100],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2, 
            delay: Math.random() * 0.5,
            ease: 'easeOut'
          }}
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: '100%',
            position: 'absolute',
          }}
        >
          <DoodleShape 
            size={['sm', 'md', 'lg'][Math.floor(Math.random() * 3)] as 'sm' | 'md' | 'lg'} 
            color={['primary', 'secondary', 'accent', 'ink'][Math.floor(Math.random() * 4)] as 'primary' | 'secondary' | 'accent' | 'ink'}
            animation="none"
          />
        </motion.div>
      ))}
    </div>
  )
}

// CSS-based confetti burst
function ConfettiBurst() {
  const colors = [
    'var(--primary)', 
    'var(--secondary)', 
    'var(--accent)', 
    'var(--pink)', 
    'var(--purple)',
    'var(--success)'
  ]

  return (
    <>
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            scale: 1,
            y: 0,
            x: 0,
            rotate: 0
          }}
          animate={{ 
            opacity: 0, 
            scale: 0,
            y: 300 + Math.random() * 200,
            x: (Math.random() - 0.5) * 400,
            rotate: Math.random() * 720
          }}
          transition={{ 
            duration: 1 + Math.random() * 1.5, 
            ease: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            delay: Math.random() * 0.3
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '20%',
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transformOrigin: 'center',
            transform: 'translate(-50%, -50%)',
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
          <p className="font-display text-lg text-primary">{order.orderNumber}</p>
          <p className="text-sm text-[color-mix(in_srgb,var(--ink)_50%,transparent)]">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={getStatusVariant(order.status)} size="md">
          {statusLabels[order.status] || order.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
        <span className="font-display text-primary">{formatCurrency(order.total)}</span>
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