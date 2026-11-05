'use client'

import { cn } from '@/lib/utils'
import { OrderStatusTimeline } from './OrderStatusBadge'
import type { Order } from '@/types'
import { Clock, User, Package, Truck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface OrderTimelineProps {
  order: Order
  className?: string
}

export function OrderTimeline({ order, className }: OrderTimelineProps) {
  // Build history from order timestamps
  const history = [
    {
      status: 'PENDING' as const,
      timestamp: order.createdAt,
      note: 'Order placed',
      updatedBy: 'Customer',
    },
    ...(order.status !== 'PENDING' ? [{
      status: 'CONFIRMED' as const,
      timestamp: order.createdAt, // Would be actual confirmation time
      note: 'Order confirmed by admin',
      updatedBy: 'Admin',
    }] : []),
    ...(order.status !== 'PENDING' && order.status !== 'CONFIRMED' ? [{
      status: 'PROCESSING' as const,
      timestamp: order.createdAt,
      note: 'Order sent to production',
      updatedBy: 'System',
    }] : []),
    ...(order.status === 'PRINTING' || order.status === 'READY_TO_SHIP' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? [{
      status: 'PRINTING' as const,
      timestamp: order.createdAt,
      note: 'Stickers sent to print',
      updatedBy: 'Production',
    }] : []),
    ...(order.status === 'READY_TO_SHIP' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? [{
      status: 'READY_TO_SHIP' as const,
      timestamp: order.createdAt,
      note: 'Printing complete, ready for dispatch',
      updatedBy: 'Warehouse',
    }] : []),
    ...(order.status === 'SHIPPED' || order.status === 'DELIVERED' ? [{
      status: 'SHIPPED' as const,
      timestamp: order.shippedAt || order.createdAt,
      note: order.trackingNumber ? `Shipped with tracking: ${order.trackingNumber}` : 'Dispatched for delivery',
      updatedBy: 'Logistics',
    }] : []),
    ...(order.status === 'DELIVERED' ? [{
      status: 'DELIVERED' as const,
      timestamp: order.deliveredAt || order.createdAt,
      note: 'Delivered to customer',
      updatedBy: 'Delivery Agent',
    }] : []),
    ...(order.status === 'CANCELLED' ? [{
      status: 'CANCELLED' as const,
      timestamp: order.createdAt,
      note: order.notes || 'Order cancelled',
      updatedBy: 'Admin',
    }] : []),
    ...(order.status === 'REFUNDED' ? [{
      status: 'REFUNDED' as const,
      timestamp: order.createdAt,
      note: 'Refund processed',
      updatedBy: 'Admin',
    }] : []),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

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

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    CONFIRMED: CheckCircle,
    PROCESSING: Loader2,
    PRINTING: Package,
    READY_TO_SHIP: Package,
    SHIPPED: Truck,
    DELIVERED: CheckCircle,
    CANCELLED: AlertCircle,
    REFUNDED: AlertCircle,
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl text-primary">Order Timeline</h3>
        <div className="flex items-center gap-2 text-sm text-[var(--ink)]/60">
          <span className="font-medium">Current Status:</span>
          <span className="font-display text-primary">{statusLabels[order.status] || order.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        {history.map((entry, index) => {
          const isLast = index === history.length - 1
          const Icon = statusIcons[entry.status] || Clock

          return (
            <div key={index} className="flex gap-4">
              <div className="relative flex-shrink-0">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                  entry.status === 'DELIVERED' ? 'bg-green-500 text-white' :
                  entry.status === 'CANCELLED' || entry.status === 'REFUNDED' ? 'bg-red-500 text-white' :
                  'bg-primary text-white'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                {!isLast && (
                  <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-[var(--light)]" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-body text-[var(--ink)]">{statusLabels[entry.status] || entry.status}</span>
                  <time className="text-sm text-[var(--ink)]/50">
                    {new Date(entry.timestamp).toLocaleString()}
                  </time>
                </div>
                {entry.note && (
                  <p className="text-sm text-[var(--ink)]/60">{entry.note}</p>
                )}
                {entry.updatedBy && (
                  <p className="text-xs text-[var(--ink)]/40">Updated by {entry.updatedBy}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Simple status badge for lists
export function SimpleOrderStatusBadge({ status }: { status: string }) {
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

  const variants: Record<string, 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'outline'> = {
    PENDING: 'warning',
    CONFIRMED: 'secondary',
    PROCESSING: 'primary',
    PRINTING: 'primary',
    READY_TO_SHIP: 'secondary',
    SHIPPED: 'secondary',
    DELIVERED: 'success',
    CANCELLED: 'error',
    REFUNDED: 'error',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
      variants[status] === 'success' && 'bg-green-100 text-green-800',
      variants[status] === 'error' && 'bg-red-100 text-red-800',
      variants[status] === 'warning' && 'bg-yellow-100 text-yellow-800',
      variants[status] === 'primary' && 'bg-primary/10 text-primary',
      variants[status] === 'secondary' && 'bg-secondary/10 text-secondary',
      variants[status] === 'accent' && 'bg-accent/20 text-accent',
      variants[status] === 'default' && 'bg-[var(--light)] text-[var(--ink)]/70',
    )}>
      {statusLabels[status] || status}
    </span>
  )
}

// Status progress indicator
export function OrderStatusProgress({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'PRINTING', label: 'Printing' },
    { key: 'READY_TO_SHIP', label: 'Ready to Ship' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
  ]

  const currentIndex = steps.findIndex((s) => s.key === currentStatus)
  const isCancelled = ['CANCELLED', 'REFUNDED'].includes(currentStatus)

  if (isCancelled) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-600 text-xl">✕</span>
        </div>
        <p className="text-red-600 font-medium">Order {currentStatus === 'CANCELLED' ? 'Cancelled' : 'Refunded'}</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <div className="relative">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                isCompleted ? 'bg-primary text-white' : isCurrent ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-[var(--light)] text-[var(--ink)]/40'
              )}>
                {isCompleted ? '✓' : isCurrent ? (index + 1) : ''}
              </div>
              {isCurrent && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-primary whitespace-nowrap">
                  Current
                </div>
              )}
            </div>
            <div className={cn(
              'text-center min-w-[70px]',
              index <= currentIndex ? 'text-[var(--ink)]' : 'text-[var(--ink)]/40'
            )}>
              <p className="text-xs font-medium truncate">{step.label}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                'w-10 h-1 mx-2',
                index < currentIndex ? 'bg-primary' : 'bg-[var(--light)]'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}