'use client'

import { forwardRef, useState, useMemo, useRef, useEffect, ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from './Button'
import { Checkbox } from './Checkbox'

export interface Column<T> {
  key: string
  header: string
  accessor?: (row: T) => ReactNode
  cell?: (row: T) => ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  sortable?: boolean
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  selectable?: boolean
  selectedKeys?: Set<string>
  onSelectionChange?: (keys: Set<string>) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
  loading?: boolean
  emptyMessage?: string
  rowClassName?: (row: T) => string
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortable = true,
  onSort,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  pagination,
  loading = false,
  emptyMessage = 'No data available',
  rowClassName,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const handleSort = (key: string) => {
    if (!sortable) return
    const column = columns.find((c) => c.key === key)
    if (!column?.sortable) return

    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    onSort?.(key, direction)
  }

  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T]
      const bVal = b[sortConfig.key as keyof T]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  const handleSelectAll = () => {
    if (selectedKeys.size === sortedData.length) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(sortedData.map(keyExtractor)))
    }
  }

  const isAllSelected = selectedKeys.size === sortedData.length && sortedData.length > 0

  if (loading) {
    return (
      <div className={cn('overflow-hidden border-3 border-[var(--ink)] rounded-card bg-white', className)}>
        <TableSkeleton columns={columns.length} />
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden border-3 border-[var(--ink)] rounded-card bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead className="bg-[var(--light)]">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={isAllSelected ? true : selectedKeys.size > 0 ? 'indeterminate' : false}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-left font-medium text-[var(--ink)]/70',
                    'uppercase tracking-wider text-sm',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && sortable && 'cursor-pointer select-none hover:text-primary',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortable && sortConfig?.key === column.key && (
                      sortConfig.direction === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-[var(--ink)]/50">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    'transition-colors hover:bg-[var(--light)]/50',
                    rowClassName?.(row)
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedKeys.has(keyExtractor(row))}
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          const newKeys = new Set(selectedKeys)
                          if (checked === true) {
                            newKeys.add(keyExtractor(row))
                          } else {
                            newKeys.delete(keyExtractor(row))
                          }
                          onSelectionChange?.(newKeys)
                        }}
                        aria-label={`Select row ${keyExtractor(row)}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-body text-[var(--ink)]',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.className
                      )}
                    >
                      {column.cell ? column.cell(row) : column.accessor ? column.accessor(row) : (row as any)[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-4 py-3 border-t border-[var(--light)] flex items-center justify-between">
          <div className="text-sm text-[var(--ink)]/60">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(parseInt(e.target.value))}
              className="px-3 py-1 text-sm border-2 border-[var(--ink)] rounded-input focus:border-primary focus:shadow-input"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-[var(--ink)]/70 px-2">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Skeleton for loading state
function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      <thead className="bg-[var(--light)]">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <div className="h-4 w-3/4 bg-dark/10 rounded animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="px-4 py-3">
                <div className="h-4 w-full bg-dark/10 rounded animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  )
}