'use client';

import { forwardRef, useRef, useState, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { FOCUS_VISIBLE } from './shared';

interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> {
  min?: number;
  max?: number;
  step?: number;
  value: number | number[];
  onChange: (value: number | number[]) => void;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      min = 0,
      max = 100,
      step = 1,
      value,
      onChange,
      label,
      showValue = true,
      formatValue,
      disabled = false,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const generatedId = providedId || `slider-${Math.random().toString(36).slice(2, 9)}`;
    const id = generatedId;
    const [isDragging, setIsDragging] = useState(false);

    const values = Array.isArray(value) ? value : [value];
    const isRange = values.length === 2;

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

    const handleMouseDown = (e: React.MouseEvent, index: number) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);

      const moveHandler = (moveEvent: MouseEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const percentage = Math.max(
          0,
          Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100)
        );
        const newValue = Math.round(min + (percentage / 100) * (max - min));
        const steppedValue = Math.round(newValue / step) * step;
        const clampedValue = Math.max(min, Math.min(max, steppedValue));

        const newValues = [...values];
        newValues[index] = clampedValue;
        if (isRange && newValues[0] > newValues[1]) {
          newValues.reverse();
        }
        onChange(isRange ? newValues : clampedValue);
      };

      const upHandler = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };

      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      let newValue = values[index];
      const increment = e.shiftKey ? step * 10 : step;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newValue = Math.min(max, newValue + increment);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          newValue = Math.max(min, newValue - increment);
          break;
        case 'Home':
          e.preventDefault();
          newValue = min;
          break;
        case 'End':
          e.preventDefault();
          newValue = max;
          break;
        default:
          return;
      }

      const newValues = [...values];
      newValues[index] = newValue;
      onChange(isRange ? newValues : newValue);
    };

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={id} className="mb-2 block text-sm font-medium text-[var(--ink)]">
            {label}
            {showValue && (
              <span className="ml-2 font-display text-[var(--ink)]">
                {values
                  .map((v, i) => (formatValue ? formatValue(v) : v))
                  .join(isRange ? ' - ' : '')}
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <div
            ref={trackRef}
            className={cn(
              'relative h-2 rounded-full bg-[var(--paper-deep)]',
              disabled && 'opacity-50'
            )}
            onMouseDown={(e) => !disabled && handleMouseDown(e, 0)}
          >
            {/* Range fill for dual slider */}
            {isRange && (
              <div
                className="absolute h-full rounded-full bg-[var(--gold)]"
                style={{
                  left: `${getPercentage(values[0])}%`,
                  width: `${getPercentage(values[1]) - getPercentage(values[0])}%`,
                }}
              />
            )}

            {values.map((val, index) => (
              <button
                key={index}
                type="button"
                role="slider"
                aria-label={label}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={val}
                aria-orientation="horizontal"
                tabIndex={disabled ? -1 : 0}
                disabled={disabled}
                onMouseDown={(e) => handleMouseDown(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  'absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-[3px] border-[var(--ink)]',
                  'bg-[var(--surface-raised)] shadow-ink-1 transition-transform duration-fast ease-spring',
                  'hover:scale-110 active:scale-125',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isDragging && 'scale-125',
                  FOCUS_VISIBLE
                )}
                style={{
                  left: `calc(${getPercentage(val)}% - 12px)`,
                  zIndex: isDragging ? 10 : 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';
