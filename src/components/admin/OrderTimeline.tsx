'use client'

import { cn } from '@/lib/utils'
import { OrderStatusBadge } from './OrderStatusBadge'
import type { Order } from '@/types'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/order-status'

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

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl text-[var(--text)]">Order Timeline</h3>
        <div className="flex items-center gap-2 text-sm text-[var(--text-subtle)]">
          <span className="font-medium">Current Status:</span>
          <OrderStatusBadge status={order.status} size="sm" />
        </div>
      </div>

      {/* Ruling 6: a vertical dashed connector with ink dots. The history array
          above is unchanged — only its presentation is. */}
      <ol className="relative">
        {history.map((entry, index) => {
          const isLast = index === history.length - 1

          return (
            <li key={index} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute left-3 top-4 bottom-0 w-0 -translate-x-1/2 border-l-2 border-dashed border-[color-mix(in_srgb,var(--ink)_30%,transparent)]"
                />
              )}
              <div className="relative w-6 flex-shrink-0">
                <span className="absolute left-1/2 top-1 block h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--ink)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[var(--text)]">
                    {ORDER_STATUS_LABELS[entry.status] || entry.status}
                  </span>
                  <time className="text-sm text-[var(--text-subtle)]">
                    {new Date(entry.timestamp).toLocaleString()}
                  </time>
                </div>
                {entry.note && <p className="text-sm text-[var(--text-subtle)]">{entry.note}</p>}
                {entry.updatedBy && (
                  <p className="text-xs text-[var(--text-subtle)]">Updated by {entry.updatedBy}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// Simple status badge for lists — delegates to the shared component so there is
// one status→variant mapping, not two.
export function SimpleOrderStatusBadge({ status }: { status: string }) {
  return <OrderStatusBadge status={status as OrderStatus} size="sm" />
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
        <div className="w-12 h-12 mx-auto mb-2 bg-[var(--error)] rounded-full flex items-center justify-center">
          <span className="text-xl text-[var(--on-red)]">✕</span>
        </div>
        <p className="font-medium text-[var(--error)]">Order {currentStatus === 'CANCELLED' ? 'Cancelled' : 'Refunded'}</p>
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
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  isCompleted
                    ? 'bg-[var(--pink-strong)] text-[var(--on-pink-strong)]'
                    : isCurrent
                      ? 'border-2 border-[var(--pink-strong)] bg-[color-mix(in_srgb,var(--pink-strong)_10%,transparent)] text-[var(--pink-strong)]'
                      : 'bg-[var(--paper-deep)] text-[var(--text-subtle)]'
                )}
              >
                {isCompleted ? '✓' : isCurrent ? (index + 1) : ''}
              </div>
              {isCurrent && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-[var(--pink-strong)] whitespace-nowrap">
                  Current
                </div>
              )}
            </div>
            <div
              className={cn(
                'text-center min-w-[70px]',
                index <= currentIndex ? 'text-[var(--text)]' : 'text-[var(--text-subtle)]'
              )}
            >
              <p className="text-xs font-medium truncate">{step.label}</p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn('w-10 h-1 mx-2', index < currentIndex ? 'bg-[var(--pink-strong)]' : 'bg-[var(--paper-deep)]')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
