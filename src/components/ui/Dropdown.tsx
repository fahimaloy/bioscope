'use client';

import { forwardRef, useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { FOCUS_VISIBLE, setRefs } from './shared';

interface DropdownItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right';
  maxHeight?: string;
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
  {
    trigger,
    items,
    value,
    onChange,
    placeholder,
    disabled = false,
    className,
    align = 'left',
    maxHeight = '240px',
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (itemValue: string) => {
    onChange?.(itemValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const selectedItem = items.find((item) => item.value === value);

  return (
    <div ref={setRefs(dropdownRef, ref)} className={cn('relative inline-block', className)}>
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
        <span
          className={cn('truncate', !selectedItem && !placeholder && 'text-[var(--text-subtle)]')}
        >
          {selectedItem?.label || placeholder || 'Select...'}
        </span>
        <ChevronDown
          className={cn('ml-2 h-4 w-4 flex-shrink-0 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </Button>

      {isOpen && (
        <Card
          variant="doodle"
          className={cn(
            'absolute z-dropdown mt-1 flex w-full animate-scale-in flex-col overflow-y-auto',
            align === 'right' && 'right-0'
          )}
          padding="none"
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
                'text-body w-full px-4 py-3 text-left transition-colors',
                'focus:bg-[var(--paper-deep)] focus:outline-none',
                'first:rounded-t-[var(--radius-md)] last:rounded-b-[var(--radius-md)]',
                item.value === value
                  ? 'bg-[var(--paper-deep)] text-[var(--ink)]'
                  : 'text-[var(--ink)] hover:bg-[var(--paper-deep)]',
                item.disabled && 'cursor-not-allowed opacity-50',
                FOCUS_VISIBLE,
                item.className
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
                {item.value === value && (
                  <Check className="ml-auto h-4 w-4 flex-shrink-0" aria-hidden="true" />
                )}
              </div>
            </button>
          ))}
          {items.length === 0 && (
            <div className="text-body px-4 py-3 text-[var(--text-subtle)]">
              No options available
            </div>
          )}
        </Card>
      )}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

// Multi-select dropdown
interface MultiSelectDropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  values?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right';
  maxHeight?: string;
  maxSelected?: number;
}

export const MultiSelectDropdown = forwardRef<HTMLDivElement, MultiSelectDropdownProps>(
  function MultiSelectDropdown(
    {
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
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (itemValue: string) => {
      const newValues = values.includes(itemValue)
        ? values.filter((v) => v !== itemValue)
        : maxSelected && values.length >= maxSelected
          ? values
          : [...values, itemValue];

      onChange?.(newValues);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    return (
      <div ref={setRefs(dropdownRef, ref)} className={cn('relative inline-block', className)}>
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
          <span
            className={cn(
              'truncate',
              values.length === 0 && !placeholder && 'text-[var(--text-subtle)]'
            )}
          >
            {values.length > 0 ? `${values.length} selected` : placeholder || 'Select...'}
          </span>
          <ChevronDown
            className={cn(
              'ml-2 h-4 w-4 flex-shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </Button>

        {isOpen && (
          <Card
            variant="doodle"
            className={cn(
              'absolute z-dropdown mt-1 flex w-full animate-scale-in flex-col overflow-y-auto',
              align === 'right' && 'right-0'
            )}
            padding="none"
            style={{ maxHeight }}
            role="listbox"
            aria-label={placeholder || 'Options'}
            aria-multiselectable="true"
            onKeyDown={handleKeyDown}
          >
            {items.map((item) => {
              const isSelected = values.includes(item.value);
              const isLimitReached = Boolean(
                maxSelected && values.length >= maxSelected && !isSelected
              );
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={item.disabled || isLimitReached}
                  disabled={Boolean(item.disabled || isLimitReached)}
                  onClick={() => !item.disabled && handleItemClick(item.value)}
                  className={cn(
                    'text-body w-full px-4 py-3 text-left transition-colors',
                    'focus:bg-[var(--paper-deep)] focus:outline-none',
                    'first:rounded-t-[var(--radius-md)] last:rounded-b-[var(--radius-md)]',
                    isSelected
                      ? 'bg-[var(--paper-deep)] text-[var(--ink)]'
                      : 'text-[var(--ink)] hover:bg-[var(--paper-deep)]',
                    (item.disabled || isLimitReached) && 'cursor-not-allowed opacity-50',
                    FOCUS_VISIBLE,
                    item.className
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      disabled={Boolean(item.disabled || isLimitReached)}
                      className="h-4 w-4"
                      aria-hidden="true"
                      tabIndex={-1}
                      onCheckedChange={() => {}}
                    />
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
            {items.length === 0 && (
              <div className="text-body px-4 py-3 text-[var(--text-subtle)]">
                No options available
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }
);

MultiSelectDropdown.displayName = 'MultiSelectDropdown';
