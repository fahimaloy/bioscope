'use client';

import { forwardRef, useState, useContext, createContext, ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { FOCUS_VISIBLE } from './shared';

interface TabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
  className?: string;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { defaultValue, value, onChange, children, className, variant = 'default' },
  ref
) {
  const [activeValue, setActiveValue] = useState(value || defaultValue);

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setActiveValue(newValue);
    }
    onChange?.(newValue);
  };

  const contextValue = {
    value: activeValue,
    onChange: handleChange,
    variant,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div ref={ref} className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

Tabs.displayName = 'Tabs';

const TabsContext = createContext<{
  value: string;
  onChange: (value: string) => void;
  variant: 'default' | 'pills' | 'underline';
} | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compounds must be used within Tabs');
  }
  return context;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, ...props }, ref) => {
    const { variant } = useTabsContext();

    const variantStyles = {
      default: 'rounded-[var(--radius-lg)] bg-[var(--paper-deep)] p-1',
      pills: '',
      underline: 'border-b-[3px] border-[var(--paper-deep)]',
    };

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
    );
  }
);
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, disabled, className, ...props }, ref) => {
    const { value: activeValue, onChange, variant } = useTabsContext();
    const isActive = activeValue === value;

    const variantStyles = {
      default: cn(
        'rounded-pill px-4 py-2 text-body font-medium transition-colors duration-fast',
        isActive
          ? 'bg-[var(--surface-raised)] text-[var(--ink)] shadow-ink-1'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]',
        disabled && 'cursor-not-allowed opacity-50'
      ),
      pills: cn(
        'rounded-[var(--radius-lg)] px-6 py-3 text-body font-medium transition-colors duration-fast',
        isActive
          ? 'bg-[var(--gold)] text-[var(--on-gold)] shadow-ink-1'
          : 'bg-[var(--paper-deep)] text-[var(--text-muted)] hover:bg-[var(--paper-raised)] hover:text-[var(--ink)]',
        disabled && 'cursor-not-allowed opacity-50'
      ),
      underline: cn(
        '-mb-px border-b-[3px] px-4 py-3 text-body font-medium transition-colors duration-fast',
        isActive
          ? 'border-[var(--gold)] text-[var(--ink)]'
          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--ink)]',
        disabled && 'cursor-not-allowed opacity-50'
      ),
    };

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabs-content-${value}`}
        id={`tabs-trigger-${value}`}
        disabled={disabled}
        onClick={() => !disabled && onChange(value)}
        className={cn(variantStyles[variant], FOCUS_VISIBLE, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, children, className, ...props }, ref) => {
    const { value: activeValue } = useTabsContext();
    const isActive = activeValue === value;

    if (!isActive) return null;

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
    );
  }
);
TabsContent.displayName = 'TabsContent';
