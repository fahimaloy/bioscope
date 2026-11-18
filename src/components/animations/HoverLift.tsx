'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HoverLiftProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  lift?: number
  scale?: number
  className?: string
  asChild?: boolean
}

export function HoverLift({
  children,
  lift = -8,
  scale = 1.02,
  className,
  asChild = false,
  ...props
}: HoverLiftProps) {
  const Component = asChild ? motion.span : motion.div

  return (
    <Component
      whileHover={{ y: lift, scale, transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] } }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={cn('transition-all duration-300', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

// Card hover effect with icon animation
interface HoverCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  className?: string
}

export function HoverCard({ children, className, ...props }: HoverCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -10,
        scale: 1.02,
        boxShadow: '12px 12px 0px var(--primary)',
        transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] },
      }}
      className={cn(
        'bg-white p-10 rounded-card border-3 border-[var(--ink)] shadow-card',
        'transition-all duration-400',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Button hover with press effect
interface HoverButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode
  className?: string
}

export function HoverButton({ children, className, ...props }: HoverButtonProps) {
  return (
    <motion.button
      whileHover={{
        y: -4,
        boxShadow: '6px 8px 0px var(--dark)',
        transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] },
      }}
      whileTap={{
        y: 4,
        x: 4,
        boxShadow: '0px 0px 0px var(--dark)',
        transition: { duration: 0.1 },
      }}
      className={cn(
        'btn',
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Scale on hover for images/cards
interface ScaleOnHoverProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  scale?: number
  className?: string
}

export function ScaleOnHover({ children, scale = 1.05, className, ...props }: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{
        scale,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      className={cn('transition-all duration-300', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Rotate on hover for icons
interface RotateOnHoverProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  degrees?: number
  className?: string
}

export function RotateOnHover({ children, degrees = 10, className, ...props }: RotateOnHoverProps) {
  return (
    <motion.div
      whileHover={{
        rotate: degrees,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      className={cn('transition-all duration-300', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}