'use client'

import { forwardRef, useRef, useState, useEffect, ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface DropdownItem {
  value: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  className?: string
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  align?: 'left' | 'right'
  maxHeight?: string
}

export function Dropdown({
  trigger,
  items,
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  align = 'left',
  maxHeight = '240px',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = (itemValue: string) => {
    onChange?.(itemValue)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  const selectedItem = items.find((item) => item.value === value)

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full justify-between"
      >
        <span className={cn('truncate', !selectedItem && !placeholder && 'text-[var(--ink)]/50')}>
          {selectedItem?.label || placeholder || 'Select...'}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 flex-shrink-0 ml-2 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card shadow-xl',
            'overflow-hidden animate-scale-in',
            align === 'right' && 'right-0'
          )}
          style={{ maxHeight }}
          role="listbox"
          aria-label={placeholder || 'Options'}
          onKeyDown={handleKeyDown}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={item.value === value}
              aria-disabled={item.disabled}
              disabled={item.disabled}
              onClick={() => !item.disabled && handleItemClick(item.value)}
              className={cn(
                'w-full px-4 py-3 text-left text-body transition-colors',
                'focus:outline-none focus:bg-[var(--light)]',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]',
                'first:rounded-t-card last:rounded-b-card',
                item.value === value ? 'bg-primary/10 text-primary' : 'text-[var(--ink)]',
                item.disabled && 'opacity-50 cursor-not-allowed',
                item.className
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
                {item.value === value && <Check className="w-4 h-4 ml-auto flex-shrink-0" />}
              </div>
            </button>
          ))}
          {items.length === 0 && (
            <div className="px-4 py-3 text-body text-[var(--ink)]/50">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Multi-select dropdown
interface MultiSelectDropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  values?: string[]
  onChange?: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  align?: 'left' | 'right'
  maxHeight?: string
  maxSelected?: number
}

export function MultiSelectDropdown({
  trigger,
  items,
  values = [],
  onChange,
  placeholder,
  disabled = false,
  className,
  align = 'left',
  maxHeight = '240px',
  maxSelected,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = (itemValue: string) => {
    const newValues = values.includes(itemValue)
      ? values.filter((v) => v !== itemValue)
      : maxSelected && values.length >= maxSelected
      ? values
      : [...values, itemValue]

    onChange?.(newValues)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }

  const selectedItems = items.filter((item) => values.includes(item.value))

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full justify-between"
      >
        <span className={cn('truncate', values.length === 0 && !placeholder && 'text-[var(--ink)]/50')}>
          {values.length > 0
            ? `${values.length} selected`
            : placeholder || 'Select...'}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 flex-shrink-0 ml-2 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card shadow-xl',
            'overflow-hidden animate-scale-in',
            align === 'right' && 'right-0'
          )}
          style={{ maxHeight }}
          role="listbox"
          aria-label={placeholder || 'Options'}
          onKeyDown={handleKeyDown}
        >
          {items.map((item) => {
            const isSelected = values.includes(item.value)
            return (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={item.disabled}
                disabled={Boolean(item.disabled || (maxSelected && values.length >= maxSelected && !isSelected))}
                onClick={() => !item.disabled && handleItemClick(item.value)}
                className={cn(
                  'w-full px-4 py-3 text-left text-body transition-colors',
                  'focus:outline-none focus:bg-[var(--light)]',
                  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]',
                  'first:rounded-t-card last:rounded-b-card',
                  isSelected ? 'bg-primary/10 text-primary' : 'text-[var(--ink)]',
                  (item.disabled || (maxSelected && values.length >= maxSelected && !isSelected)) &&
                    'opacity-50 cursor-not-allowed',
                  item.className
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={Boolean(item.disabled || (maxSelected && values.length >= maxSelected && !isSelected))}
                    className="w-4 h-4 text-primary border-[var(--ink)] rounded focus:ring-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]"
                    aria-hidden="true"
                  />
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            )
          })}
          {items.length === 0 && (
            <div className="px-4 py-3 text-body text-[var(--ink)]/50">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  )
}