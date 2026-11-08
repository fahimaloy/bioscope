'use client';

import { forwardRef, useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { content, children, position = 'top', delay = 200, className },
  ref
) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') hide();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--ink)]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--ink)]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--ink)]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--ink)]',
  };

  return (
    <div
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
      className="relative inline-block focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-raised)]"
      tabIndex={0}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'absolute z-tooltip rounded-[var(--radius-sm)] border-2 border-[var(--ink)]',
            'bg-[var(--ink)] px-3 py-2 text-xs font-medium text-[var(--paper-raised)] shadow-ink-1',
            'animate-fade-in whitespace-nowrap',
            positionStyles[position],
            className
          )}
        >
          {content}
          <div
            className={cn('absolute h-0 w-0 border-4 border-transparent', arrowStyles[position])}
          />
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';
