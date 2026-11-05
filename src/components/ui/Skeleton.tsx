'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-[var(--light)] rounded overflow-hidden'

  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-input',
    card: 'rounded-card',
    avatar: 'rounded-full',
  }

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  }

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number } & SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          {...props}
        />
      ))}
    </div>
  )
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
  )
}

export function SkeletonTable({ rows = 5, columns = 4, className, ...props }: { rows?: number; columns?: number } & SkeletonProps) {
  return (
    <div className={cn('overflow-hidden border-3 border-[var(--ink)] rounded-card bg-[var(--surface-card)]', className)}>
      <table className="w-full" role="grid">
        <thead className="bg-[var(--light)]">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton variant="text" width="80%" height={16} {...props} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--light)]">
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
  )
}

export function SkeletonProductCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card p-6 shadow-card space-y-4', className)}>
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
  )
}

export function SkeletonOrderCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card p-6 shadow-card space-y-4', className)}>
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
  )
}

// Wave animation for skeleton
export const skeletonWaveStyles = `
@keyframes wave {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-wave {
  background: linear-gradient(90deg, var(--light) 25%, #f3f4f6 50%, var(--light) 75%);
  background-size: 200% 100%;
  animation: wave 1.5s ease-in-out infinite;
}
`