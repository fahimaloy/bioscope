'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useId, useState } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  toggleIcon?: React.ReactNode | { show: React.ReactNode; hide: React.ReactNode }
  iconPosition?: 'left' | 'right'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, toggleIcon, iconPosition = 'left', id: providedId, type, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const hasValue = props.defaultValue || props.value || (props as any).value !== ''

    const isPasswordType = type === 'password'
    const [showPassword, setShowPassword] = useState(false)
    const currentType = isPasswordType && showPassword ? 'text' : type
    
    let toggleButtonIcon: React.ReactNode = icon
    if (toggleIcon) {
      if (typeof toggleIcon === 'object' && 'show' in toggleIcon && 'hide' in toggleIcon) {
        toggleButtonIcon = showPassword ? toggleIcon.hide : toggleIcon.show
      } else {
        toggleButtonIcon = toggleIcon
      }
    }

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            type={currentType}
            className={cn(
              'w-full bg-transparent transition-all duration-300',
              'border-2 rounded-input',
              'placeholder:text-transparent',
              'focus:outline-none focus:border-primary focus:shadow-input',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'text-body text-[var(--ink)]',
              'py-3 px-4',  // consistent padding
              iconPosition === 'left' && 'pl-12',
              iconPosition === 'right' && 'pr-12',
              isPasswordType && 'pr-12',
              error
                ? 'border-[var(--error)] focus:border-[var(--error)] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                : 'border-[var(--ink)]',
              'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          />
          {icon && iconPosition === 'right' && !isPasswordType && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 pointer-events-none z-10">
              {icon}
            </div>
          )}
          {isPasswordType && toggleButtonIcon && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 hover:text-primary transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {toggleButtonIcon}
            </button>
          )}
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200',
                'pointer-events-none bg-white px-1',
                'text-[var(--ink)]/50 font-medium',
                (hasValue || props.placeholder) && '-translate-y-3 scale-75 text-primary',
                error && 'text-[var(--error)]',
                isPasswordType && 'right-12'
              )}
            >
              {label}
              {props.required && <span className="text-[var(--error)] ml-1">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-[var(--error)] flex items-center gap-1" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-[var(--ink)]/50">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const hasValue = props.defaultValue || props.value || (props as any).value !== ''

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-transparent transition-all duration-300 resize-y min-h-[120px]',
              'border-2 rounded-input p-4',
              'placeholder:text-transparent',
              'focus:outline-none focus:border-primary focus:shadow-input',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'text-body text-[var(--ink)]',
              error
                ? 'border-[var(--error)] focus:border-[var(--error)] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                : 'border-[var(--ink)]',
              'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          />
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'absolute left-3 top-3 transition-all duration-200',
                'pointer-events-none bg-white px-1',
                'text-[var(--ink)]/50 font-medium',
                (hasValue || props.placeholder) && '-translate-y-3 scale-75 text-primary',
                error && 'text-[var(--error)]'
              )}
            >
              {label}
              {props.required && <span className="text-[var(--error)] ml-1">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-[var(--error)] flex items-center gap-1" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-[var(--ink)]/50">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const hasValue = props.defaultValue || props.value || (props as any).value !== ''

    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-transparent transition-all duration-300 appearance-none',
              'border-2 rounded-input p-4 pr-10',
              'focus:outline-none focus:border-primary focus:shadow-input',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'text-body text-[var(--ink)]',
              error
                ? 'border-[var(--error)] focus:border-[var(--error)] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                : 'border-[var(--ink)]',
              'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]',
              className
            )}
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
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ink)]/50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200',
                'pointer-events-none bg-white px-1',
                'text-[var(--ink)]/50 font-medium',
                (hasValue || props.defaultValue) && '-translate-y-3 scale-75 text-primary',
                error && 'text-[var(--error)]'
              )}
            >
              {label}
              {props.required && <span className="text-[var(--error)] ml-1">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-[var(--error)] flex items-center gap-1" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-[var(--ink)]/50">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'