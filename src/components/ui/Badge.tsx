'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'success'
    | 'warning'
    | 'error'
    | 'outline'
    | 'info'
    | 'doodle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
  dotColor?: string;
}

/**
 * Every filled variant pairs its accent with its AA-safe on-token (spec §5.2).
 * `default` is the inverted pairing: paper text on the ink fill.
 */
const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[var(--ink)] text-[var(--paper-raised)]',
  primary: 'bg-[var(--pink-strong)] text-[var(--on-pink-strong)]',
  secondary: 'bg-[var(--violet)] text-[var(--on-violet)]',
  accent: 'bg-[var(--gold)] text-[var(--on-gold)]',
  success: 'bg-[var(--green-strong)] text-[var(--on-green-strong)]',
  warning: 'bg-[var(--orange)] text-[var(--on-orange)]',
  error: 'bg-[var(--red)] text-[var(--on-red)]',
  info: 'bg-[var(--blue)] text-[var(--on-blue)]',
  outline: 'border-[var(--ink)] bg-transparent text-[var(--ink)]',
  doodle:
    '-rotate-2 border-[var(--ink)] bg-[var(--pink-strong)] text-[var(--on-pink-strong)] shadow-ink-1',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border-2 border-transparent font-medium',
          'transition-colors duration-fast',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: dotColor || 'currentColor' }}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status badge with predefined variants
export const StatusBadge = ({
  status,
  size = 'md',
  className,
}: {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const statusConfig: Record<
    string,
    { variant: BadgeProps['variant']; label: string; dotColor?: string }
  > = {
    PENDING: { variant: 'warning', label: 'Pending', dotColor: 'var(--warning)' },
    CONFIRMED: { variant: 'info', label: 'Confirmed', dotColor: 'var(--info)' },
    PROCESSING: { variant: 'primary', label: 'Processing', dotColor: 'var(--pink-strong)' },
    PRINTING: { variant: 'primary', label: 'Printing', dotColor: 'var(--pink-strong)' },
    READY_TO_SHIP: { variant: 'secondary', label: 'Ready to Ship', dotColor: 'var(--violet)' },
    SHIPPED: { variant: 'secondary', label: 'Shipped', dotColor: 'var(--violet)' },
    DELIVERED: { variant: 'success', label: 'Delivered', dotColor: 'var(--green-strong)' },
    CANCELLED: { variant: 'error', label: 'Cancelled', dotColor: 'var(--error)' },
    REFUNDED: { variant: 'error', label: 'Refunded', dotColor: 'var(--error)' },
    APPROVED: { variant: 'success', label: 'Approved', dotColor: 'var(--green-strong)' },
    REJECTED: { variant: 'error', label: 'Rejected', dotColor: 'var(--error)' },
    PRICED: { variant: 'accent', label: 'Priced', dotColor: 'var(--accent)' },
    ORDERED: { variant: 'primary', label: 'Ordered', dotColor: 'var(--pink-strong)' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot
      dotColor={config.dotColor}
      className={className}
    >
      {config.label}
    </Badge>
  );
};

// Payment status badge
export const PaymentStatusBadge = ({
  status,
  size = 'md',
  className,
}: {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const statusConfig: Record<
    string,
    { variant: BadgeProps['variant']; label: string; dotColor?: string }
  > = {
    PENDING: { variant: 'warning', label: 'Pending', dotColor: 'var(--warning)' },
    PAID: { variant: 'success', label: 'Paid', dotColor: 'var(--green-strong)' },
    FAILED: { variant: 'error', label: 'Failed', dotColor: 'var(--error)' },
    REFUNDED: { variant: 'error', label: 'Refunded', dotColor: 'var(--error)' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot
      dotColor={config.dotColor}
      className={className}
    >
      {config.label}
    </Badge>
  );
};
