'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, Truck, Clock, MapPin, CreditCard, Share2, Download, RotateCcw } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order } from '@/types'

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
    BANK_TRANSFER: 'Bank Transfer',
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-display text-3xl text-primary mb-2">Order Confirmed!</h1>
        <p className="text-body text-[var(--ink)]/60">Thank you for your order. We'll notify you when it ships.</p>
      </div>

      {/* Order Number */}
      <div className="bg-primary/10 border-2 border-primary rounded-card p-4 text-center">
        <p className="text-sm text-[var(--ink)]/60 uppercase tracking-wider">Order Number</p>
        <p className="font-display text-2xl text-primary">{order.orderNumber}</p>
        <p className="text-sm text-[var(--ink)]/50 mt-1">Placed on {formatDate(order.createdAt)}</p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="primary" size="lg">
          {statusLabels[order.status] || order.status}
        </Badge>
      </div>

      {/* Order Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <div className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
          <h3 className="font-display text-lg text-primary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </h3>
          <div className="space-y-1 text-[var(--ink)]/70">
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
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
          <h3 className="font-display text-lg text-primary mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--ink)]/60">Method</span>
              <span className="font-medium">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink)]/60">Status</span>
              <span className="font-medium capitalize">{order.paymentStatus.toLowerCase()}</span>
            </div>
            {order.transactionId && (
              <div className="flex justify-between">
                <span className="text-[var(--ink)]/60">Transaction ID</span>
                <span className="font-mono text-sm">{order.transactionId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-card border-3 border-[var(--ink)] shadow-card overflow-hidden">
        <div className="p-4 border-b border-[var(--light)]">
          <h3 className="font-display text-lg text-primary">Order Items</h3>
        </div>
        <div className="divide-y divide-light">
          {order.items.map((item) => (
            <div key={item.id} className="p-4 flex gap-4">
              <img
                src={item.productImage}
                alt={item.productName}
                className="w-16 h-16 rounded-input object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-body text-[var(--ink)] truncate">{item.productName}</p>
                <p className="text-sm text-[var(--ink)]/60">{item.width} × {item.height} cm</p>
                <p className="text-sm text-[var(--ink)]/50">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-primary">{formatCurrency(item.totalPrice)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
        <h3 className="font-display text-lg text-primary mb-4">Price Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-body">
            <span className="text-[var(--ink)]/70">Subtotal</span>
            <span className="font-display text-primary">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-body">
            <span className="text-[var(--ink)]/70">Tax</span>
            <span className="font-display text-primary">{formatCurrency(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-body">
            <span className="text-[var(--ink)]/70">Delivery</span>
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
      </div>

      {/* Next Steps */}
      <div className="bg-[var(--light)] rounded-input p-6 border-2 border-[var(--ink)]">
        <h3 className="font-display text-lg text-primary mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          What Happens Next?
        </h3>
        <ol className="space-y-3 text-[var(--ink)]/70">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0">1</span>
            <span>We'll confirm your order within 24 hours</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0">2</span>
            <span>Your stickers will be printed and prepared for shipping</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0">3</span>
            <span>You'll receive tracking info once shipped</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0">4</span>
            <span>Delivery within {order.deliveryZone === 'INSIDE_DHAKA' ? '2-3' : '3-5'} business days</span>
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
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
      </div>
    </div>
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
    <div className="bg-white rounded-card border-3 border-[var(--ink)] p-4 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-display text-lg text-primary">{order.orderNumber}</p>
          <p className="text-sm text-[var(--ink)]/50">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={getStatusVariant(order.status)} size="md">
          {statusLabels[order.status] || order.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--ink)]/60">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
        <span className="font-display text-primary">{formatCurrency(order.total)}</span>
      </div>

      <Button variant="outline" className="w-full mt-3" onClick={onViewDetails}>
        View Details
      </Button>
    </div>
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