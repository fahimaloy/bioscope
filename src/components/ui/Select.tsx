'use client';

import { forwardRef, SelectHTMLAttributes, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_VISIBLE } from './shared';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, onChange, error, label, className, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            onChange={onChange}
            className={cn(
              'w-full appearance-none rounded-[var(--radius-md)] border-2 bg-[var(--surface-raised)]',
              'text-body px-3 py-2 pr-8 text-[var(--text)]',
              'transition-[border-color,box-shadow] duration-fast ease-out',
              'focus:border-[var(--ink)] focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-60',
              FOCUS_VISIBLE,
              error
                ? 'border-[var(--error)] focus-visible:ring-[var(--error)]'
                : 'border-[var(--ink)]',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
