'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

const variantStyles = {
  default: 'bg-[var(--paper-deep)] border-3 border-[var(--ink)] shadow-card hover:shadow-card-hover',
  elevated: 'bg-[var(--paper-deep)] border-3 border-[var(--ink)] shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)]',
  outlined: 'bg-[var(--paper-deep)] border-3 border-[var(--ink)] shadow-none',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = true, padding = 'lg', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-card transition-all duration-400',
          'overflow-hidden',
          variantStyles[variant],
          hover && variant === 'default' && 'hover:-translate-y-[10px] hover:scale-[1.02]',
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-display text-primary mb-2', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-body text-[var(--ink)]/70 leading-relaxed', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 pt-4 border-t border-[var(--light)] flex items-center gap-2', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export const CardIcon = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg' }>(
  ({ className, size = 'lg', children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'text-3xl',
      md: 'text-5xl',
      lg: 'text-7xl',
    }
    return (
      <div
        ref={ref}
        className={cn('mb-4 transition-transform duration-300', sizeStyles[size], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardIcon.displayName = 'CardIcon'