'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PRINTING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

const statusConfig: Record<OrderStatus, { variant: BadgeProps['variant']; label: string; icon?: string }> = {
  PENDING: { variant: 'warning', label: 'Pending' },
  CONFIRMED: { variant: 'secondary', label: 'Confirmed' },
  PROCESSING: { variant: 'primary', label: 'Processing' },
  PRINTING: { variant: 'primary', label: 'Printing' },
  READY_TO_SHIP: { variant: 'secondary', label: 'Ready to Ship' },
  SHIPPED: { variant: 'secondary', label: 'Shipped' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  CANCELLED: { variant: 'error', label: 'Cancelled' },
  REFUNDED: { variant: 'error', label: 'Refunded' },
}

interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  dotColor?: string
}

export function OrderStatusBadge({ status, size = 'md', className }: { status: OrderStatus; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const config = statusConfig[status] || { variant: 'default', label: status }

  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {config.label}
    </Badge>
  )
}

// Status selector for admin
export function OrderStatusSelector({
  currentStatus,
  onChange,
  className,
}: {
  currentStatus: OrderStatus
  onChange: (status: OrderStatus) => void
  className?: string
}) {
  const statuses: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PRINTING',
    'READY_TO_SHIP',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]

  return (
    <select
      value={currentStatus}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      className={cn('px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input focus:border-primary focus:shadow-input text-body text-[var(--ink)]', className)}
    >
      {statuses.map((status) => {
        const config = statusConfig[status]
        return (
          <option key={status} value={status}>
            {config.label}
          </option>
        )
      })}
    </select>
  )
}

// Status flow visualization
export function OrderStatusFlow({ currentStatus }: { currentStatus: OrderStatus }) {
  const statuses: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PRINTING',
    'READY_TO_SHIP',
    'SHIPPED',
    'DELIVERED',
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {statuses.map((status, index) => {
        const config = statusConfig[status]
        const isActive = statuses.indexOf(currentStatus) >= index
        const isCurrent = currentStatus === status
        const isCompleted = statuses.indexOf(currentStatus) > index

        return (
          <div key={status} className="flex items-center flex-shrink-0">
            <div className="relative">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                isCompleted ? 'bg-primary text-white' : isCurrent ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-[var(--light)] text-[var(--text-subtle)]'
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
              'text-center min-w-[80px]',
              isActive ? 'text-[var(--ink)]' : 'text-[var(--text-subtle)]'
            )}>
              <p className="text-xs font-medium truncate">{statusConfig[status]?.label || status}</p>
            </div>
            {index < statuses.length - 1 && (
              <div className={cn(
                'w-12 h-1 mx-2',
                isCompleted ? 'bg-primary' : 'bg-[var(--light)]'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Status history timeline
export function OrderStatusTimeline({
  history,
}: {
  history: Array<{
    status: OrderStatus
    timestamp: Date
    note?: string
    updatedBy?: string
  }>
}) {
  return (
    <div className="space-y-4">
      {history.slice().reverse().map((entry, index) => {
        const config = statusConfig[entry.status]
        const isLast = index === history.length - 1

        return (
          <div key={entry.timestamp.toISOString()} className="flex gap-4">
            <div className="relative flex-shrink-0">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                'bg-primary text-white'
              )}>
                {config.variant === 'success' ? '✓' : config.variant === 'error' ? '✕' : (history.length - index)}
              </div>
              {!isLast && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-[var(--light)]" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={config.variant} size="sm">
                  {config.label}
                </Badge>
                <time className="text-sm text-[var(--text-subtle)]">
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
              {entry.note && (
                <p className="text-sm text-[var(--text-subtle)]">{entry.note}</p>
              )}
              {entry.updatedBy && (
                <p className="text-xs text-[var(--text-subtle)]">Updated by {entry.updatedBy}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}