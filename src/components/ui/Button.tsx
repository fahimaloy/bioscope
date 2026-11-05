'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { StickerPeel } from '@/components/decorative/DoodleElements'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'doodle' | 'doodle-secondary' | 'doodle-outline' | string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const sizeStyles = {
  sm: 'px-4 py-2 text-base',
  md: 'px-6 py-3 text-lg',
  lg: 'px-8 py-4 text-xl',
  xl: 'px-10 py-5 text-2xl',
}

const variantStyles = {
  primary: 'bg-[var(--primary)] text-white border-[var(--ink)] shadow-btn hover:shadow-btn-hover active:shadow-btn-active',
  secondary: 'bg-[var(--accent)] text-[var(--ink)] border-[var(--ink)] shadow-btn hover:shadow-btn-hover active:shadow-btn-active',
  outline: 'bg-transparent border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--primary)] hover:text-white hover:border-primary',
  ghost: 'bg-transparent border-transparent text-[var(--ink)] hover:bg-[var(--light)]',
  destructive: 'bg-[var(--error)] text-white border-[var(--error)] shadow-btn hover:shadow-btn-hover active:shadow-btn-active',
  doodle: 'bg-[var(--primary)] text-white border-[var(--ink)] shadow-btn hover:shadow-btn-hover active:shadow-btn-active relative overflow-hidden',
  'doodle-secondary': 'bg-[var(--accent)] text-[var(--ink)] border-[var(--ink)] shadow-btn hover:shadow-btn-hover active:shadow-btn-active relative overflow-hidden',
  'doodle-outline': 'bg-transparent border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--primary)] hover:text-white hover:border-primary relative overflow-hidden',
}

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
    const isDisabled = disabled || loading
    const isDoodleVariant = variant === 'doodle' || variant === 'doodle-secondary' || variant === 'doodle-outline'

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-display transition-all duration-300',
          'rounded-pill border-3',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
          'active:translate-x-[4px] active:translate-y-[4px]',
          sizeStyles[size],
          (variantStyles as Record<string, string>)[variant] ?? variantStyles.primary,
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-5 w-5"
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
        {icon && iconPosition === 'left' && !loading && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === 'right' && !loading && <span className="flex-shrink-0">{icon}</span>}
        {isDoodleVariant && <StickerPeel />}
      </button>
    )
  }
)

Button.displayName = 'Button'