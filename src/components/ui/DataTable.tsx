'use client';

import { useState, useMemo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Checkbox } from './Checkbox';
import { DoodleStar } from '@/components/decorative';
import { motion, useReducedMotion } from 'framer-motion';
import { Pagination } from './Pagination';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => ReactNode;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/** Row padding per density — `compact` is for the admin's dense data grids. */
const densityStyles: Record<'comfortable' | 'compact', { cell: string; header: string }> = {
  comfortable: { cell: 'px-4 py-3', header: 'px-4 py-3' },
  compact: { cell: 'px-3 py-1.5', header: 'px-3 py-2' },
};

/**
 * Compare two cell values for sorting.
 *
 * Prisma Decimals serialise to JSON strings, so money columns arrive as
 * "1200.00" — a raw `<`/`>` compare sorts those lexicographically
 * ("110.00" < "80.00"). Numeric strings therefore compare as numbers;
 * null/undefined sort first ascending; everything else uses localeCompare.
 * Exported for tests.
 */
export function compareCellValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  if (a !== '' && b !== '') {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) {
      return an === bn ? 0 : an < bn ? -1 : 1;
    }
  }
  return String(a).localeCompare(String(b));
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  loading?: boolean;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
  /** `comfortable` (default) or `compact`. */
  density?: 'comfortable' | 'compact';
  className?: string;
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
  density = 'comfortable',
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null
  );
  const shouldReduceMotion = useReducedMotion();
  const padding = densityStyles[density];

  const handleSort = (key: string) => {
    if (!sortable) return;
    const column = columns.find((c) => c.key === key);
    if (!column?.sortable) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];
      const cmp = compareCellValues(aVal, bVal);
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  const handleSelectAll = () => {
    if (selectedKeys.size === sortedData.length) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(sortedData.map(keyExtractor)));
    }
  };

  const isAllSelected = selectedKeys.size === sortedData.length && sortedData.length > 0;

  const table = (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)]',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full" role="grid" data-density={density}>
          <thead className="border-b-2 border-[var(--ink)] bg-[var(--paper-deep)]">
            <tr>
              {selectable && (
                <th className={cn('text-left', padding.header)} scope="col">
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
                    'text-left text-sm font-medium uppercase tracking-wider text-[var(--ink)]',
                    padding.header,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable &&
                      sortable &&
                      'cursor-pointer select-none hover:text-[var(--gold)]',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable &&
                      sortable &&
                      sortConfig?.key === column.key &&
                      (sortConfig.direction === 'asc' ? (
                        <ChevronUp className="h-4 w-4 text-[var(--ink)]" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--ink)]" aria-hidden="true" />
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--paper-deep)]">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className={cn('px-4 py-16 text-center', padding.cell)}
                >
                  <div className="flex flex-col items-center gap-4">
                    <DoodleStar size={40} color="gold" animation="float" className="opacity-40" />
                    <p className="text-body text-[var(--text-muted)]">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <motion.tr
                  key={keyExtractor(row)}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldReduceMotion ? 0 : rowIndex * 0.05, duration: 0.3 }}
                  className={cn(
                    'transition-colors hover:bg-[var(--paper-deep)]',
                    rowClassName?.(row)
                  )}
                >
                  {selectable && (
                    <td className={padding.cell}>
                      <Checkbox
                        checked={selectedKeys.has(keyExtractor(row))}
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          const newKeys = new Set(selectedKeys);
                          if (checked === true) {
                            newKeys.add(keyExtractor(row));
                          } else {
                            newKeys.delete(keyExtractor(row));
                          }
                          onSelectionChange?.(newKeys);
                        }}
                        aria-label={`Select row ${keyExtractor(row)}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'text-body text-[var(--ink)]',
                        padding.cell,
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.className
                      )}
                    >
                      {column.cell
                        ? column.cell(row)
                        : column.accessor
                          ? column.accessor(row)
                          : (row[column.key as keyof T] as ReactNode)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between gap-4 border-t border-[var(--paper-deep)] px-4 py-3">
          <div className="text-sm text-[var(--text-muted)]">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={Math.ceil(pagination.total / pagination.pageSize)}
            onPageChange={pagination.onPageChange}
            className="flex-1 justify-end"
          />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)]',
          className
        )}
      >
        <TableSkeleton columns={columns.length} density={density} />
      </div>
    );
  }

  return table;
}

// Skeleton for loading state
function TableSkeleton({
  columns,
  density,
}: {
  columns: number;
  density: 'comfortable' | 'compact';
}) {
  const padding = densityStyles[density];
  return (
    <>
      <thead className="bg-[var(--paper-deep)]">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className={padding.header}>
              <div className="h-4 w-3/4 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-sunken)]" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className={padding.cell}>
                <div className="h-4 w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-sunken)]" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  );
}
