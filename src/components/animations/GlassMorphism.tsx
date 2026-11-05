'use client'

import { HTMLAttributes, forwardRef, ReactNode, CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface GlassMorphismProps extends HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  opacity?: number
  border?: boolean
  className?: string
}

const blurStyles = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
}

export const GlassMorphism = forwardRef<HTMLDivElement, GlassMorphismProps>(
  ({ blur = 'md', opacity = 0.9, border = true, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white/90',
          blurStyles[blur],
          'shadow-glass',
          border && 'border border-[var(--ink)]/10',
          className
        )}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        } as CSSProperties}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassMorphism.displayName = 'GlassMorphism'

// Glass card with hover effect
interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  className?: string
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

export function GlassCard({
  children,
  padding = 'lg',
  hover = true,
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'bg-white/90 backdrop-blur-md shadow-glass border border-[var(--ink)]/10 rounded-card',
        'transition-all duration-400',
        paddingStyles[padding],
        hover && 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:-translate-y-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Glass navbar
export function GlassNavbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50',
      'bg-white/90 backdrop-blur-md shadow-glass',
      className
    )}>
      {children}
    </nav>
  )
}

// Glass modal overlay
export function GlassModalOverlay({ className }: { className?: string }) {
  return (
    <div className={cn(
      'fixed inset-0 z-40',
      'bg-black/50 backdrop-blur-sm',
      className
    )} />
  )
}

// Glass tooltip/popover
interface GlassPopoverProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function GlassPopover({ children, className, ...props }: GlassPopoverProps) {
  return (
    <div
      className={cn(
        'bg-white/95 backdrop-blur-lg shadow-[0_25px_50px_rgba(0,0,0,0.25)]',
        'border-3 border-[var(--ink)] rounded-card',
        'animate-scale-in',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}