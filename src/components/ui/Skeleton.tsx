'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Placeholder surface. Purely decorative: `aria-hidden`, no text, and it
 * carries no interactive semantics.
 */
export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'overflow-hidden rounded-[var(--radius-sm)] bg-[var(--paper-deep)]';

  const variantStyles = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-[var(--radius-sm)]',
    card: 'rounded-[var(--radius-lg)]',
    avatar: 'rounded-full',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animationStyles[animation], className)}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
  ...props
}: { lines?: number } & SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} {...props} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('space-y-4 p-6', className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" width={48} height={48} {...props} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" height={24} {...props} />
          <Skeleton variant="text" width="60%" height={16} {...props} />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={200} {...props} />
      <div className="flex gap-2">
        <Skeleton variant="text" width="30%" height={40} {...props} />
        <Skeleton variant="text" width="30%" height={40} {...props} />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: { rows?: number; columns?: number } & SkeletonProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)]',
        className
      )}
    >
      <table className="w-full" role="grid">
        <thead className="bg-[var(--paper-deep)]">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton variant="text" width="80%" height={16} {...props} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--paper-deep)]">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton variant="text" width="100%" height={20} {...props} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonProductCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-ink-3)]',
        className
      )}
    >
      <Skeleton variant="rectangular" width="100%" height={200} {...props} />
      <div className="space-y-2">
        <Skeleton variant="text" width="80%" height={28} {...props} />
        <Skeleton variant="text" width="50%" height={20} {...props} />
        <Skeleton variant="text" width="30%" height={20} {...props} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="text" width="60px" height={32} {...props} />
        <Skeleton variant="text" width="60px" height={32} {...props} />
      </div>
    </div>
  );
}

export function SkeletonOrderCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-ink-3)]',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton variant="text" width="120px" height={20} {...props} />
          <Skeleton variant="circular" width={24} height={24} {...props} />
        </div>
        <Skeleton variant="text" width="100px" height={24} {...props} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Skeleton variant="text" width="40%" height={14} {...props} />
          <Skeleton variant="text" width="80%" height={20} {...props} />
        </div>
        <div className="space-y-1">
          <Skeleton variant="text" width="40%" height={14} {...props} />
          <Skeleton variant="text" width="60%" height={20} {...props} />
        </div>
        <div className="space-y-1">
          <Skeleton variant="text" width="40%" height={14} {...props} />
          <Skeleton variant="text" width="70%" height={24} {...props} />
        </div>
      </div>
    </div>
  );
}

/**
 * Injectable form of the `wave` skeleton animation, for consumers that render
 * skeletons outside Tailwind's content globs. Token-only: no colour literal.
 */
export const skeletonWaveStyles = `
@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
`;
