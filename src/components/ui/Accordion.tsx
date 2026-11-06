'use client'

import { forwardRef, useId, useState } from 'react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AccordionProps {
  type?: 'single' | 'multiple'
  collapsible?: boolean
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  children: React.ReactNode
  className?: string
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', collapsible = false, value, onValueChange, children, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState<string | string[]>(value ?? (type === 'multiple' ? [] : ''))
    
    const handleValueChange = (newValue: string | string[]) => {
      setInternalValue(newValue)
      onValueChange?.(newValue)
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child
          return React.cloneElement(child as React.ReactElement<any>, {
            type,
            collapsible,
            value: internalValue,
            onValueChange: handleValueChange,
            index,
          })
        })}
      </div>
    )
  }
)
Accordion.displayName = 'Accordion'

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
  type?: 'single' | 'multiple'
  collapsible?: boolean
  valueProp?: string | string[]
  onValueChange?: (value: string | string[]) => void
  index?: number
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, children, className, type, collapsible, valueProp, onValueChange, ...props }, ref) => {
    const isOpen = Array.isArray(valueProp)
      ? valueProp.includes(value)
      : valueProp === value

    const handleToggle = () => {
      if (type === 'single') {
        if (isOpen && collapsible) {
          onValueChange?.('')
        } else {
          onValueChange?.(value)
        }
      } else {
        const currentValues = (valueProp as string[]) || []
        if (isOpen) {
          onValueChange?.(currentValues.filter((v) => v !== value))
        } else {
          onValueChange?.([...currentValues, value])
        }
      }
    }

    return (
      <div ref={ref} className={cn('border-3 border-[var(--ink)] rounded-card overflow-hidden', className)} {...props}>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            onToggle: handleToggle,
            disabled: type === 'single' && !collapsible && isOpen,
          })
        })}
      </div>
    )
  }
)
AccordionItem.displayName = 'AccordionItem'

interface AccordionTriggerProps {
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: () => void
  disabled?: boolean
  className?: string
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, isOpen, onToggle, disabled, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 font-display text-lg text-[var(--ink)]',
          'bg-white hover:bg-[var(--light)] transition-colors',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        aria-expanded={isOpen}
        {...props}
      >
        {children}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-[var(--ink)]/50 flex-shrink-0 ml-4"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
    )
  }
)
AccordionTrigger.displayName = 'AccordionTrigger'

interface AccordionContentProps {
  children: React.ReactNode
  isOpen?: boolean
  className?: string
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, isOpen, className, ...props }, ref) => {
    const id = useId()

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            id={id}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
            style={{ transformOrigin: 'top' }}
            className={cn('overflow-hidden bg-[var(--paper-deep)]', className)}
            {...props}
          >
            <div className="pt-2 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
AccordionContent.displayName = 'AccordionContent'