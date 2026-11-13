'use client'

import { cn } from '@/lib/utils'
import { Badge, type BadgeProps } from '@/components/ui/Badge'

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

interface StatusConfig {
  variant: BadgeProps['variant']
  label: string
  dotColor?: string
  /**
   * `SHIPPED` is the one status the plan maps to `--teal`, and `Badge` has no
   * `teal` variant (the primitive is not extended for this). The override is
   * applied at the `Badge` call site: `cn`/`twMerge` keeps the later class.
   * `--ink` on `--teal` is 4.60:1 (contract §2), so the pair is AA-safe.
   */
  className?: string
}

// Ruling 2: PENDING warning · PROCESSING info · SHIPPED teal · DELIVERED
// success · CANCELLED/REFUNDED error. CONFIRMED, PRINTING and READY_TO_SHIP
// keep their existing variants.
const statusConfig: Record<OrderStatus, StatusConfig> = {
  PENDING: { variant: 'warning', label: 'Pending', dotColor: 'var(--warning)' },
  CONFIRMED: { variant: 'secondary', label: 'Confirmed', dotColor: 'var(--violet)' },
  PROCESSING: { variant: 'info', label: 'Processing', dotColor: 'var(--info)' },
  PRINTING: { variant: 'primary', label: 'Printing', dotColor: 'var(--pink-strong)' },
  READY_TO_SHIP: { variant: 'secondary', label: 'Ready to Ship', dotColor: 'var(--violet)' },
  SHIPPED: {
    variant: 'secondary',
    label: 'Shipped',
    dotColor: 'var(--teal)',
    className: 'bg-[var(--teal)] text-[var(--ink)]',
  },
  DELIVERED: { variant: 'success', label: 'Delivered', dotColor: 'var(--green-strong)' },
  CANCELLED: { variant: 'error', label: 'Cancelled', dotColor: 'var(--error)' },
  REFUNDED: { variant: 'error', label: 'Refunded', dotColor: 'var(--error)' },
}

export function OrderStatusBadge({ status, size = 'md', className }: { status: OrderStatus; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const config: StatusConfig = statusConfig[status] ?? { variant: 'default', label: status }

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot
      dotColor={config.dotColor}
      className={cn(config.className, className)}
    >
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
      className={cn(
        'rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] px-3 py-2 text-[var(--text)] focus:border-[var(--brand)] focus:shadow-input',
        className
      )}
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
                'text-center min-w-[80px]',
                isActive ? 'text-[var(--text)]' : 'text-[var(--text-subtle)]'
              )}
            >
              <p className="text-xs font-medium truncate">{statusConfig[status]?.label || status}</p>
            </div>
            {index < statuses.length - 1 && (
              <div
                className={cn('w-12 h-1 mx-2', isCompleted ? 'bg-[var(--pink-strong)]' : 'bg-[var(--paper-deep)]')}
              />
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
      {history
        .slice()
        .reverse()
        .map((entry, index) => {
          const config = statusConfig[entry.status]
          const isLast = index === history.length - 1

          return (
            <div key={entry.timestamp.toISOString()} className="flex gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-[var(--pink-strong)] text-[var(--on-pink-strong)]">
                  {config.variant === 'success' ? '✓' : config.variant === 'error' ? '✕' : (history.length - index)}
                </div>
                {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-[var(--paper-deep)]" />}
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
                {entry.note && <p className="text-sm text-[var(--text-subtle)]">{entry.note}</p>}
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
