'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PageTransitionProps {
  children: ReactNode
  mode?: 'wait' | 'popLayout' | 'sync'
  className?: string
}

export function PageTransition({ children, mode = 'wait', className }: PageTransitionProps) {
  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={typeof window !== 'undefined' ? window.location.pathname : '/'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Layout transition for shared elements
export function LayoutTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={typeof window !== 'undefined' ? window.location.pathname : '/'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Staggered container for children
interface StaggerContainerProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function StaggerContainer({ children, delay = 0.1, className }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}

// Staggered item
interface StaggerItemProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function StaggerItem({ children, className, delay }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.175, 0.885, 0.32, 1.275],
          },
        },
      }}
      style={{ transitionDelay: delay ? `${delay}s` : undefined }}
    >
      {children}
    </motion.div>
  )
}

// Page transition wrapper for Next.js App Router
export function PageTransitionWrapper({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={typeof window !== 'undefined' ? window.location.pathname : '/'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.175, 0.885, 0.32, 1.275],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}