'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

// SkeletonProductCard - matches ProductCard default variant dimensions
// aspect-square image block (200px) + title bar + price bar
export function SkeletonProductCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card p-6 shadow-card space-y-4',
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
      <div className="flex items-center justify-between pt-3 border-t border-[var(--light)]">
        <div>
          <Skeleton variant="text" width="80px" height={32} animation="wave" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="text" width="100px" height={40} animation="wave" />
        </div>
      </div>
    </div>
  )
}

// SkeletonProductGrid - responsive 1/2/3 cols matching ProductGrid
export function SkeletonProductGrid({ 
  count = 6, 
  variant = 'default',
  className 
}: { 
  count?: number 
  variant?: 'default' | 'compact' | 'featured'
  className?: string 
}) {
  const gridColumns = variant === 'compact' ? 1 : '1 sm:2 lg:3 xl:4'
  
  return (
    <div className={cn('grid gap-6', `grid-cols-${gridColumns}`, className)} role="list" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} role="listitem">
          <SkeletonProductCard />
        </div>
      ))}
    </div>
  )
}

// SkeletonForm - label+input rows matching AddressForm structure
export function SkeletonForm({ 
  fields = 6, 
  className 
}: { 
  fields?: number 
  className?: string 
}) {
  return (
    <div className={cn('space-y-4 p-6 bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card shadow-card', className)}>
      {/* Form title */}
      <Skeleton variant="text" width="40%" height={28} animation="wave" />
      
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--light)]">
        <Skeleton variant="text" width="100px" height={48} animation="wave" />
        <Skeleton variant="text" width="140px" height={48} animation="wave" />
      </div>
    </div>
  )
}

// SkeletonTable - header row + 5 rows matching DataTable structure
export function SkeletonTable({ 
  columns = 4, 
  rows = 5, 
  className 
}: { 
  columns?: number 
  rows?: number 
  className?: string 
}) {
  return (
    <div className={cn('overflow-hidden border-3 border-[var(--ink)] rounded-card bg-[var(--surface-card)]', className)}>
      <div className="overflow-x-auto">
        <table className="w-full" role="grid" aria-label="Loading table data">
          <thead className="bg-[var(--light)]">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton variant="text" width="80%" height={16} animation="wave" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--light)]">
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
  )
}