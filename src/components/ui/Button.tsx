'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { FOCUS_VISIBLE_INK } from './shared';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual treatment. `primary`, `secondary`, `outline`, `ghost`, and
   * `destructive` are the defined treatments; any other value falls back to
   * `primary`, exactly as the pre-rebuild component did for `text`, `accent`,
   * `rectangular`, and `pills`.
   *
   * The `doodle*` variants were removed in the token rebuild — Paper + Pop is
   * the default brand treatment, not a variant.
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

/**
 * Hit targets stay ≥ 44px (contract §6); only the horizontal padding and the
 * type size step between sizes.
 */
const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-[44px] px-4 py-2 text-base',
  md: 'min-h-[48px] px-6 py-3 text-lg',
  lg: 'min-h-[56px] px-8 py-4 text-xl',
  xl: 'min-h-[64px] px-10 py-5 text-2xl',
};

/**
 * Filled variants pair their accent with its AA-safe on-token (spec §5.2):
 * ink on `--gold`, white on `--pink-strong`, white on `--red`.
 */
const variantStyles: Record<string, string> = {
  primary: 'bg-[var(--gold)] text-[var(--ink)]',
  secondary: 'bg-[var(--pink-strong)] text-[var(--on-pink-strong)]',
  outline: 'bg-transparent text-[var(--ink)] hover:bg-[var(--paper-raised)]',
  ghost:
    'bg-transparent border-transparent text-[var(--ink)] shadow-none hover:bg-[var(--paper-deep)]',
  destructive: 'bg-[var(--red)] text-[var(--on-red)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-display tracking-wide',
          'rounded-pill border-[3px] border-[var(--ink)]',
          'shadow-[var(--shadow-ink-2)] hover:shadow-[var(--shadow-ink-3)]',
          'transition-[transform,box-shadow] duration-fast ease-spring',
          'hover:-translate-y-1 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
          'disabled:cursor-not-allowed disabled:opacity-60',
          FOCUS_VISIBLE_INK,
          sizeStyles[size],
          variantStyles[variant] ?? variantStyles.primary,
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && iconPosition === 'left' && !loading && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {icon && iconPosition === 'right' && !loading && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
