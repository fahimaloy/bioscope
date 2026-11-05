'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'outline' | 'info'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  dot?: boolean
  dotColor?: string
}

const variantStyles = {
  default: 'bg-dark text-white',
  primary: 'bg-[var(--primary)] text-white',
  secondary: 'bg-secondary text-white',
  accent: 'bg-accent text-[var(--ink)]',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-[var(--ink)]',
  error: 'bg-red-500 text-white',
  outline: 'bg-transparent border-2 border-[var(--ink)] text-[var(--ink)]',
  info: 'bg-[var(--primary)] text-white',
}

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-pill',
          'transition-colors duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: dotColor || 'currentColor' }}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Status badge with predefined variants
export const StatusBadge = ({
  status,
  size = 'md',
  className,
}: {
  status: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string; dotColor?: string }> = {
    PENDING: { variant: 'warning', label: 'Pending', dotColor: 'var(--warning)' },
    CONFIRMED: { variant: 'info', label: 'Confirmed', dotColor: 'var(--info)' },
    PROCESSING: { variant: 'primary', label: 'Processing', dotColor: 'var(--primary)' },
    PRINTING: { variant: 'primary', label: 'Printing', dotColor: 'var(--primary)' },
    READY_TO_SHIP: { variant: 'secondary', label: 'Ready to Ship', dotColor: 'var(--secondary)' },
    SHIPPED: { variant: 'secondary', label: 'Shipped', dotColor: 'var(--secondary)' },
    DELIVERED: { variant: 'success', label: 'Delivered', dotColor: 'var(--success)' },
    CANCELLED: { variant: 'error', label: 'Cancelled', dotColor: 'var(--error)' },
    REFUNDED: { variant: 'error', label: 'Refunded', dotColor: 'var(--error)' },
    APPROVED: { variant: 'success', label: 'Approved', dotColor: 'var(--success)' },
    REJECTED: { variant: 'error', label: 'Rejected', dotColor: 'var(--error)' },
    PRICED: { variant: 'accent', label: 'Priced', dotColor: 'var(--accent)' },
    ORDERED: { variant: 'primary', label: 'Ordered', dotColor: 'var(--primary)' },
  }

  const config = statusConfig[status] || { variant: 'default', label: status }

  return (
    <Badge variant={config.variant} size={size} dot dotColor={config.dotColor} className={className}>
      {config.label}
    </Badge>
  )
}

// Payment status badge
export const PaymentStatusBadge = ({
  status,
  size = 'md',
  className,
}: {
  status: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string; dotColor?: string }> = {
    PENDING: { variant: 'warning', label: 'Pending', dotColor: 'var(--warning)' },
    PAID: { variant: 'success', label: 'Paid', dotColor: 'var(--success)' },
    FAILED: { variant: 'error', label: 'Failed', dotColor: 'var(--error)' },
    REFUNDED: { variant: 'error', label: 'Refunded', dotColor: 'var(--error)' },
  }

  const config = statusConfig[status] || { variant: 'default', label: status }

  return (
    <Badge variant={config.variant} size={size} dot dotColor={config.dotColor} className={className}>
      {config.label}
    </Badge>
  )
}