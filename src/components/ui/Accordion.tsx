'use client';

import { forwardRef, useId, useState } from 'react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FOCUS_VISIBLE } from './shared';

interface AccordionProps {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
  className?: string;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (
    { type = 'single', collapsible = false, value, onValueChange, children, className, ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string | string[]>(
      value ?? (type === 'multiple' ? [] : '')
    );

    const handleValueChange = (newValue: string | string[]) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          // `valueProp` is the accordion's own state; the item keeps its own
          // `value`. Cloning `value` here used to overwrite the item's
          // identity, so `isOpen` could never be true.
          return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
            type,
            collapsible,
            valueProp: internalValue,
            onValueChange: handleValueChange,
            index,
          });
        })}
      </div>
    );
  }
);
Accordion.displayName = 'Accordion';

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  valueProp?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  index?: number;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, children, className, type, collapsible, valueProp, onValueChange, ...props }, ref) => {
    const isOpen = Array.isArray(valueProp) ? valueProp.includes(value) : valueProp === value;

    const handleToggle = () => {
      if (type === 'single') {
        if (isOpen && collapsible) {
          onValueChange?.('');
        } else {
          onValueChange?.(value);
        }
      } else {
        const currentValues = (valueProp as string[]) || [];
        if (isOpen) {
          onValueChange?.(currentValues.filter((v) => v !== value));
        } else {
          onValueChange?.([...currentValues, value]);
        }
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden rounded-[var(--radius-lg)] border-2 border-[var(--ink)]',
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          return React.cloneElement(child as React.ReactElement<AccordionTriggerProps | AccordionContentProps>, {
            isOpen,
            onToggle: handleToggle,
            disabled: type === 'single' && !collapsible && isOpen,
          });
        })}
      </div>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

interface AccordionTriggerProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  className?: string;
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
          'flex w-full items-center justify-between px-4 py-3 font-display text-lg text-[var(--ink)]',
          'bg-[var(--surface-raised)] transition-colors duration-fast hover:bg-[var(--paper-deep)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          FOCUS_VISIBLE,
          className
        )}
        aria-expanded={isOpen}
        {...props}
      >
        {children}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="ml-4 flex-shrink-0 text-[var(--text-muted)]"
        >
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </motion.div>
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

interface AccordionContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, isOpen, className, ...props }, ref) => {
    const id = useId();
    // Contract §4: the reveal collapses to nothing under reduced motion.
    const shouldReduceMotion = useReducedMotion();

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            id={id}
            initial={shouldReduceMotion ? false : { scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { scaleY: 0, opacity: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }
            }
            style={{ transformOrigin: 'top' }}
            className={cn('overflow-hidden bg-[var(--paper-deep)]', className)}
            {...props}
          >
            <div className="pb-4 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';
