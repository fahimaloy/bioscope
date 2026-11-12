'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';
import { DoodleStar } from '@/components/decorative';

/**
 * Full-page loading state for route transitions. `role="status"` + `aria-live`
 * announces the wait without hiding any content — there is none yet.
 */
export const GlobalLoading = forwardRef<HTMLDivElement, { className?: string }>(
  function GlobalLoading({ className }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <DoodleStar size={64} color="gold" animation="pulse" />
        <p className="font-display text-xl text-[var(--ink)]">Loading…</p>
      </div>
    );
  }
);

GlobalLoading.displayName = 'GlobalLoading';

// SkeletonProductCard - matches ProductCard default variant dimensions
// aspect-square image block (200px) + title bar + price bar
export function SkeletonProductCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-ink-3)]',
        className
      )}
      {...props}
    >
      {/* Image block - aspect-square */}
      <Skeleton variant="rectangular" width="100%" height={200} animation="wave" />

      {/* Title and description area */}
      <div className="space-y-2">
        <Skeleton variant="text" width="80%" height={28} animation="wave" />
        <Skeleton variant="text" width="50%" height={20} animation="wave" />
        <Skeleton variant="text" width="30%" height={20} animation="wave" />
      </div>

      {/* Dimensions */}
      <div className="flex flex-wrap gap-1">
        <Skeleton variant="text" width="60px" height={24} animation="wave" />
        <Skeleton variant="text" width="60px" height={24} animation="wave" />
        <Skeleton variant="text" width="60px" height={24} animation="wave" />
        <Skeleton variant="text" width="60px" height={24} animation="wave" />
      </div>

      {/* Price & Actions */}
      <div className="flex items-center justify-between border-t border-[var(--paper-deep)] pt-3">
        <div>
          <Skeleton variant="text" width="80px" height={32} animation="wave" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="text" width="100px" height={40} animation="wave" />
        </div>
      </div>
    </div>
  );
}

/**
 * Responsive 2/3/4-column grid matching ProductGrid. The class map is
 * written out in full — a template-built `grid-cols-` class is invisible to
 * Tailwind's scanner and silently renders unstyled.
 */
const GRID_COLUMNS = {
  default: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  compact: 'grid-cols-1',
  featured: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
} as const;

// SkeletonProductGrid - responsive 2/3/4 cols matching ProductGrid
export function SkeletonProductGrid({
  count = 6,
  variant = 'default',
  className,
}: {
  count?: number;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}) {
  return (
    <div
      className={cn('grid gap-6', GRID_COLUMNS[variant], className)}
      role="list"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} role="listitem">
          <SkeletonProductCard />
        </div>
      ))}
    </div>
  );
}

// SkeletonForm - label+input rows matching AddressForm structure
export function SkeletonForm({ fields = 6, className }: { fields?: number; className?: string }) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-ink-3)]',
        className
      )}
    >
      {/* Form title */}
      <Skeleton variant="text" width="40%" height={28} animation="wave" />

      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {/* Label */}
            <Skeleton variant="text" width="40%" height={14} animation="wave" />
            {/* Input */}
            <Skeleton variant="rectangular" width="100%" height={48} animation="wave" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" width="40%" height={14} animation="wave" />
            <Skeleton variant="rectangular" width="100%" height={48} animation="wave" />
          </div>
        </div>
      ))}

      {/* Submit button area */}
      <div className="flex justify-end gap-3 border-t border-[var(--paper-deep)] pt-4">
        <Skeleton variant="text" width="100px" height={48} animation="wave" />
        <Skeleton variant="text" width="140px" height={48} animation="wave" />
      </div>
    </div>
  );
}

// SkeletonTable - header row + 5 rows matching DataTable structure
export function SkeletonTable({
  columns = 4,
  rows = 5,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)]',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full" role="grid" aria-label="Loading table data">
          <thead className="bg-[var(--paper-deep)]">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton variant="text" width="80%" height={16} animation="wave" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--paper-deep)]">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <Skeleton variant="text" width="100%" height={20} animation="wave" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
