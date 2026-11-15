'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_VISIBLE } from './shared';

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Change handler — receives the raw React change event, same signature as a
   * native <input>. Existing `(e) => setX(e.target.value)` handlers pass
   * through unchanged. (The alternative, a `(value: string) => void`
   * callback, was rejected so call sites keep their current handlers.)
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  /** Accessible name. Defaults to 'Search' when not provided. */
  'aria-label'?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Shared search field (docs/DESIGN_CONTRACT.md §5/§6): 2px ink border,
 * --radius-md, --surface-raised fill, hard focus shadow and a 3px gold
 * focus-visible ring. The leading icon is decorative.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, id: providedId, disabled, placeholder = 'Search...', 'aria-label': ariaLabelProp, ...props }, ref) => {
    const reactId = useId();
    const id = providedId ?? reactId;
    const ariaLabel = ariaLabelProp ?? 'Search';

    return (
      <div className="relative w-full">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          ref={ref}
          id={id}
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn(
            'w-full border-2 border-[var(--ink)] rounded-[var(--radius-md)] bg-[var(--surface-raised)]',
            'px-4 py-3 pl-12 text-body text-[var(--text)]',
            'placeholder:text-[var(--text-subtle)]',
            'transition-[border-color,box-shadow] duration-fast ease-out',
            'focus:outline-none focus:border-[var(--ink)] focus:shadow-ink-1',
            FOCUS_VISIBLE,
            'disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';
