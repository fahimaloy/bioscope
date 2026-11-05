'use client'

import { forwardRef, useState, useContext, createContext, ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  defaultValue: string
  value?: string
  onChange?: (value: string) => void
  children: ReactNode
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  children: ReactNode
  className?: string
}

export function Tabs({ defaultValue, value, onChange, children, className, variant = 'default' }: TabsProps) {
  const [activeValue, setActiveValue] = useState(value || defaultValue)

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setActiveValue(newValue)
    }
    onChange?.(newValue)
  }

  const contextValue = {
    value: activeValue,
    onChange: handleChange,
    variant,
  }

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsContext = createContext<{
  value: string
  onChange: (value: string) => void
  variant: 'default' | 'pills' | 'underline'
} | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs compounds must be used within Tabs')
  }
  return context
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, ...props }, ref) => {
    const { variant } = useTabsContext()

    const variantStyles = {
      default: 'bg-[var(--light)] rounded-card p-1',
      pills: '',
      underline: 'border-b-3 border-[var(--light)]',
    }

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation="horizontal"
        className={cn('flex gap-1', variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, disabled, className, ...props }, ref) => {
    const { value: activeValue, onChange, variant } = useTabsContext()
    const isActive = activeValue === value

    const variantStyles = {
      default: cn(
        'px-4 py-2 rounded-[30px] text-body font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isActive
          ? 'bg-white text-primary shadow-btn'
          : 'text-[var(--ink)]/70 hover:text-[var(--ink)] hover:bg-white/50',
        disabled && 'opacity-50 cursor-not-allowed'
      ),
      pills: cn(
        'px-6 py-3 rounded-card text-body font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isActive
          ? 'bg-primary text-white shadow-btn'
          : 'text-[var(--ink)]/70 bg-[var(--light)] hover:bg-dark/10',
        disabled && 'opacity-50 cursor-not-allowed'
      ),
      underline: cn(
        'px-4 py-3 border-b-3 -mb-px text-body font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-[var(--ink)]/70 hover:text-[var(--ink)]',
        disabled && 'opacity-50 cursor-not-allowed'
      ),
    }

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabs-content-${value}`}
        id={`tabs-trigger-${value}`}
        disabled={disabled}
        onClick={() => !disabled && onChange(value)}
        className={cn(variantStyles[variant], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, children, className, ...props }, ref) => {
    const { value: activeValue } = useTabsContext()
    const isActive = activeValue === value

    if (!isActive) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabs-content-${value}`}
        aria-labelledby={`tabs-trigger-${value}`}
        className={cn('animate-fade-in', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = 'TabsContent'