'use client';

import {
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  useId,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { FOCUS_VISIBLE } from './shared';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  toggleIcon?: React.ReactNode | { show: React.ReactNode; hide: React.ReactNode };
  iconPosition?: 'left' | 'right';
}

/**
 * Shared field chrome: 2px ink border (dense/data surface, contract §5),
 * paper-raised fill, and the token focus ring. The floating label sits on the
 * border, so it takes the field's own background colour.
 */
const fieldClasses = (error?: string) =>
  cn(
    'w-full border-2 rounded-[var(--radius-md)] bg-[var(--surface-raised)]',
    'px-4 py-3 text-body text-[var(--text)]',
    'placeholder:text-[var(--text-subtle)]',
    'transition-[border-color,box-shadow] duration-fast ease-out',
    'focus:outline-none focus:border-[var(--ink)] focus:shadow-ink-1',
    FOCUS_VISIBLE,
    'disabled:cursor-not-allowed disabled:opacity-60',
    error ? 'border-[var(--error)] focus-visible:ring-[var(--error)]' : 'border-[var(--ink)]'
  );

/**
 * Floating label. Unfloated it sits centred in the field; floated it centres
 * itself on the field's top border and takes the field's own background so it
 * "cuts" the border it sits on.
 */
const labelClasses = (floated: boolean, error?: string) =>
  cn(
    'pointer-events-none absolute left-3 px-1 transition-all duration-fast',
    'bg-[var(--surface-raised)] font-medium',
    floated
      ? 'top-0 -translate-y-1/2 scale-90 text-[var(--ink)]'
      : 'top-1/2 -translate-y-1/2 text-[var(--text-subtle)]',
    error && 'text-[var(--error)]'
  );

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      icon,
      toggleIcon,
      iconPosition = 'left',
      id: providedId,
      type,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const [isFocused, setIsFocused] = useState(false);
    const [uncontrolledValue, setUncontrolledValue] = useState(props.defaultValue);
    const liveValue = props.value !== undefined ? props.value : uncontrolledValue;
    // Number 0 and "0" count as values; null/undefined/'' do not.
    const hasLiveValue =
      liveValue !== undefined && liveValue !== null && String(liveValue) !== '';
    const floated = isFocused || hasLiveValue || Boolean(props.placeholder);

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(event);
    };
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(event);
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setUncontrolledValue(event.target.value);
      props.onChange?.(event);
    };

    const isPasswordType = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    const currentType = isPasswordType && showPassword ? 'text' : type;

    let toggleButtonIcon: React.ReactNode = icon;
    if (toggleIcon) {
      if (typeof toggleIcon === 'object' && 'show' in toggleIcon && 'hide' in toggleIcon) {
        toggleButtonIcon = showPassword ? toggleIcon.hide : toggleIcon.show;
      } else {
        toggleButtonIcon = toggleIcon;
      }
    }

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && iconPosition === 'left' && (
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--text-subtle)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            type={currentType}
            className={cn(
              fieldClasses(error),
              'py-3',
              iconPosition === 'left' && 'pl-12',
              iconPosition === 'right' && 'pr-12',
              isPasswordType && 'pr-12',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
          {icon && iconPosition === 'right' && !isPasswordType && (
            <div className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-[var(--text-subtle)]">
              {icon}
            </div>
          )}
          {isPasswordType && toggleButtonIcon && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--text-subtle)] transition-colors hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-raised)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {toggleButtonIcon}
            </button>
          )}
          {label && (
            <label
              htmlFor={id}
              className={cn(
                labelClasses(floated, error),
                isPasswordType && 'right-12'
              )}
            >
              {label}
              {props.required && <span className="ml-1 text-[var(--error)]">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1.5 flex items-center gap-1 text-sm text-[var(--error)]"
            role="alert"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-[var(--text-subtle)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const [isFocused, setIsFocused] = useState(false);
    const [uncontrolledValue, setUncontrolledValue] = useState(props.defaultValue);
    const liveValue = props.value !== undefined ? props.value : uncontrolledValue;
    // Number 0 and "0" count as values; null/undefined/'' do not.
    const hasLiveValue =
      liveValue !== undefined && liveValue !== null && String(liveValue) !== '';
    const floated = isFocused || hasLiveValue || Boolean(props.placeholder);

    const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(event);
    };
    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(event);
    };
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setUncontrolledValue(event.target.value);
      props.onChange?.(event);
    };

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            className={cn(
              fieldClasses(error),
              'min-h-[120px] resize-y rounded-[var(--radius-md)] p-4',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
          {label && (
            <label
              htmlFor={id}
              className={cn(labelClasses(floated, error))}
            >
              {label}
              {props.required && <span className="ml-1 text-[var(--error)]">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1.5 flex items-center gap-1 text-sm text-[var(--error)]"
            role="alert"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-[var(--text-subtle)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    // Floating-label decision for Select: floated when the select's current
    // value is truthy or a placeholder option exists, and forced floated when
    // no placeholder prop is passed (a selected option always occupies the
    // field). In practice this means Select labels float unconditionally,
    // since the field always shows either the placeholder or an option.
    const selValue = props.value !== undefined ? props.value : props.defaultValue;
    const hasSelValue = selValue !== undefined && selValue !== null && String(selValue) !== '';
    const floated = hasSelValue || Boolean(placeholder) || placeholder === undefined;

    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(fieldClasses(error), 'appearance-none p-4 pr-10', className)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          {label && (
            <label
              htmlFor={id}
              className={cn(labelClasses(floated, error))}
            >
              {label}
              {props.required && <span className="ml-1 text-[var(--error)]">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1.5 flex items-center gap-1 text-sm text-[var(--error)]"
            role="alert"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-[var(--text-subtle)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
