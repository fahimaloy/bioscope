'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, iconPosition = 'left', id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const hasValue = props.defaultValue || props.value || (props as any).value !== ''

    return (
      <div className="w-full">
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-transparent transition-all duration-300',
              'border-2 rounded-input',
              'placeholder:text-transparent',
              'focus:outline-none focus:border-primary focus:shadow-input',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'text-body text-[var(--ink)]',
              iconPosition === 'left' && 'pl-10',
              iconPosition === 'right' && 'pr-10',
              error
                ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                : 'border-[var(--ink)]',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 pointer-events-none z-10">
              {icon}
            </div>
          )}
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200',
                'pointer-events-none bg-white px-1',
                'text-[var(--ink)]/50 font-medium',
                (hasValue || props.placeholder) && '-translate-y-3 scale-75 text-primary',
                error && 'text-red-500'
              )}
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
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
                ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                : 'border-[var(--ink)]',
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
                error && 'text-red-500'
              )}
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
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
                ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                : 'border-[var(--ink)]',
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
                error && 'text-red-500'
              )}
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-500 flex items-center gap-1" role="alert">
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