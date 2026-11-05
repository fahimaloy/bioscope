'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { DimensionConfig } from '@/types'

interface DimensionSelectorProps {
  dimensions: DimensionConfig[]
  selectedDimension?: DimensionConfig
  onChange: (dimension: DimensionConfig) => void
  variant?: 'buttons' | 'dropdown' | 'cards' | 'radio'
  showAll?: boolean
  maxVisible?: number
  className?: string
  disabled?: boolean
  label?: string
}

export function DimensionSelector({
  dimensions,
  selectedDimension,
  onChange,
  variant = 'buttons',
  showAll = false,
  maxVisible = 4,
  className,
  disabled = false,
  label = 'Select Size',
}: DimensionSelectorProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleDimensions = (showAll || expanded || dimensions.length <= maxVisible)
    ? dimensions
    : dimensions.slice(0, maxVisible)

  if (variant === 'dropdown') {
    return (
      <div className={cn('space-y-2', className)}>
        <label className="block text-sm font-medium text-[var(--ink)]">{label}</label>
        <select
          value={selectedDimension?.id || ''}
          onChange={(e) => {
            const dim = dimensions.find((d) => d.id === e.target.value)
            if (dim) onChange(dim)
          }}
          disabled={disabled}
          className="w-full px-4 py-3 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input text-body text-[var(--ink)]"
        >
          <option value="">Select size</option>
          {dimensions.map((dim) => (
            <option key={dim.id} value={dim.id}>
              {dim.label} {dim.priceMultiplier !== 1 && `(+${((dim.priceMultiplier - 1) * 100).toFixed(0)}%)`}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (variant === 'radio') {
    return (
      <fieldset className={cn('space-y-2', className)}>
        <legend className="font-medium text-body text-[var(--ink)]">{label}</legend>
        <div className="flex flex-wrap gap-3">
          {dimensions.map((dim) => (
            <label
              key={dim.id}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-input border-3 cursor-pointer transition-all',
                selectedDimension?.id === dim.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
              )}
            >
              <input
                type="radio"
                name="dimension"
                value={dim.id}
                checked={selectedDimension?.id === dim.id}
                onChange={() => onChange(dim)}
                disabled={disabled}
                className="w-4 h-4 text-primary border-2 border-[var(--ink)] focus:ring-2 focus:ring-primary"
              />
              <span className="font-medium">{dim.label}</span>
              {dim.priceMultiplier !== 1 && (
                <span className="text-sm text-primary/80">
                  {dim.priceMultiplier > 1 ? '+' : ''}{(dim.priceMultiplier - 1) * 100}%
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={cn('space-y-4', className)}>
        <label className="block font-medium text-body text-[var(--ink)]">{label}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {dimensions.map((dim) => (
            <button
              key={dim.id}
              onClick={() => !disabled && onChange(dim)}
              disabled={disabled}
              className={cn(
                'p-4 rounded-input border-3 text-center transition-all',
                selectedDimension?.id === dim.id
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_0_3px_rgba(255,107,107,0.2)]'
                  : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary hover:bg-[var(--light)]'
              )}
            >
              <div className="font-display text-lg mb-1">{dim.label}</div>
              <div className="text-sm text-[var(--ink)]/60">
                {dim.width} × {dim.height} cm
              </div>
              {dim.priceMultiplier !== 1 && (
                <div className="text-xs text-primary/80 mt-1">
                  {dim.priceMultiplier > 1 ? '+' : ''}{(dim.priceMultiplier - 1) * 100}%
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Default: buttons
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="font-medium text-body text-[var(--ink)]">{label}</label>
        {dimensions.length > maxVisible && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            disabled={disabled}
          >
            {expanded ? 'Show Less' : `Show All (${dimensions.length})`}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {visibleDimensions.map((dim) => (
          <button
            key={dim.id}
            onClick={() => !disabled && onChange(dim)}
            disabled={disabled}
            className={cn(
              'px-4 py-3 rounded-input border-3 font-medium transition-all min-w-[110px]',
              'relative overflow-hidden',
              selectedDimension?.id === dim.id
                ? 'border-primary bg-primary/10 text-primary shadow-[0_0_0_3px_rgba(255,107,107,0.2)]'
                : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary hover:bg-[var(--light)]'
            )}
          >
            <span className="block font-display">{dim.label}</span>
            {dim.priceMultiplier !== 1 && (
              <span className="absolute top-1 right-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {dim.priceMultiplier > 1 ? '+' : ''}{(dim.priceMultiplier - 1) * 100}%
              </span>
            )}
          </button>
        ))}
        {!showAll && !expanded && dimensions.length > maxVisible && (
          <button
            onClick={() => setExpanded(true)}
            disabled={disabled}
            className={cn(
              'px-4 py-3 rounded-input border-3 font-medium transition-all min-w-[110px]',
              'border-dashed border-[var(--ink)]/30 text-[var(--ink)]/50 hover:border-primary hover:bg-[var(--light)]'
            )}
          >
            +{dimensions.length - maxVisible} more
          </button>
        )}
      </div>
    </div>
  )
}

// Need to import useState
import { useState } from 'react'

// Dimension display for product cards/list
export function DimensionDisplay({
  dimensions,
  maxVisible = 3,
  className,
}: {
  dimensions: DimensionConfig[]
  maxVisible?: number
  className?: string
}) {
  const visible = dimensions.slice(0, maxVisible)
  const remaining = dimensions.length - maxVisible

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visible.map((dim) => (
        <span
          key={dim.id}
          className="px-2 py-0.5 text-xs bg-[var(--light)] text-[var(--ink)]/70 rounded-full"
        >
          {dim.label}
        </span>
      ))}
      {remaining > 0 && (
        <span className="px-2 py-0.5 text-xs bg-[var(--light)] text-[var(--ink)]/50 rounded-full">
          +{remaining} more
        </span>
      )}
    </div>
  )
}

// Dimension comparison table
export function DimensionComparisonTable({
  dimensions,
  selectedDimension,
}: {
  dimensions: DimensionConfig[]
  selectedDimension?: DimensionConfig
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[var(--ink)]">
            <th className="text-left p-2 font-medium text-[var(--ink)]">Size</th>
            <th className="text-left p-2 font-medium text-[var(--ink)]">Width</th>
            <th className="text-left p-2 font-medium text-[var(--ink)]">Height</th>
            <th className="text-left p-2 font-medium text-[var(--ink)]">Area</th>
            <th className="text-left p-2 font-medium text-[var(--ink)]">Price Multiplier</th>
          </tr>
        </thead>
        <tbody>
          {dimensions.map((dim) => (
            <tr
              key={dim.id}
              className={cn(
                'border-b border-[var(--light)]/50 transition-colors',
                selectedDimension?.id === dim.id && 'bg-primary/5'
              )}
            >
              <td className="p-2 font-medium">{dim.label}</td>
              <td className="p-2">{dim.width} cm</td>
              <td className="p-2">{dim.height} cm</td>
              <td className="p-2">{(dim.width * dim.height).toFixed(1)} cm²</td>
              <td className="p-2">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  dim.priceMultiplier === 1 ? 'bg-[var(--light)] text-[var(--ink)]' : 'bg-primary/10 text-primary'
                )}>
                  {dim.priceMultiplier}x
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}