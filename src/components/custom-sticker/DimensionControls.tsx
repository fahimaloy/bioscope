'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Slider } from '@/components/ui/Slider'
import { Badge } from '@/components/ui/Badge'
import { Maximize, Minimize, Lock, Unlock, RotateCcw, RefreshCw } from 'lucide-react'

interface DimensionControlsProps {
  width: number
  height: number
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  onLockAspectRatio: (locked: boolean) => void
  locked?: boolean
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  dpi?: number
  presetSizes?: Array<{ width: number; height: number; label: string }>
  className?: string
}

export function DimensionControls({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onLockAspectRatio,
  locked = true,
  minWidth = 1,
  maxWidth = 100,
  minHeight = 1,
  maxHeight = 100,
  dpi = 300,
  presetSizes = [
    { width: 3, height: 3, label: 'Small (3×3 cm)' },
    { width: 5, height: 5, label: 'Standard (5×5 cm)' },
    { width: 7, height: 7, label: 'Medium (7×7 cm)' },
    { width: 10, height: 10, label: 'Large (10×10 cm)' },
    { width: 15, height: 10, label: 'Rectangle (15×10 cm)' },
    { width: 20, height: 15, label: 'Big (20×15 cm)' },
  ],
  className,
}: DimensionControlsProps) {
  const [aspectRatio, setAspectRatio] = useState(width / height)
  const [showPresets, setShowPresets] = useState(false)

  const handleWidthChange = (newWidth: number) => {
    onWidthChange(newWidth)
    if (locked) {
      const newHeight = Math.round(newWidth / aspectRatio)
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        onHeightChange(newHeight)
      }
    }
  }

  const handleHeightChange = (newHeight: number) => {
    onHeightChange(newHeight)
    if (locked) {
      const newWidth = Math.round(newHeight * aspectRatio)
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onWidthChange(newWidth)
      }
    }
  }

  const handlePresetSelect = (preset: typeof presetSizes[0]) => {
    onWidthChange(preset.width)
    onHeightChange(preset.height)
    setAspectRatio(preset.width / preset.height)
    setShowPresets(false)
  }

  const area = (width * height).toFixed(1)
  const pixelsWidth = Math.round(width * dpi / 2.54)
  const pixelsHeight = Math.round(height * dpi / 2.54)
  const megapixels = (pixelsWidth * pixelsHeight / 1000000).toFixed(1)

  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-primary">Canvas Dimensions</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
          >
            {showPresets ? <Minimize className="w-4 h-4 mr-1" /> : <Maximize className="w-4 h-4 mr-1" />}
            Presets
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLockAspectRatio(!locked)}
            className={locked ? 'text-primary' : ''}
            aria-label={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          >
            {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Dimension Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[var(--ink)]">Width (cm)</label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={width}
              onChange={(e) => handleWidthChange(parseFloat(e.target.value) || minWidth)}
              min={minWidth}
              max={maxWidth}
              step={0.1}
              className="flex-1"
            />
            <div className="flex items-center gap-1 text-sm text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
              <span>Min:</span>
              <span className="font-medium">{minWidth}</span>
              <span>Max:</span>
              <span className="font-medium">{maxWidth}</span>
            </div>
          </div>
          <Slider
            value={width}
            onChange={(v) => handleWidthChange(v as number)}
            min={minWidth}
            max={maxWidth}
            step={0.1}
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-[var(--ink)]">Height (cm)</label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={height}
              onChange={(e) => handleHeightChange(parseFloat(e.target.value) || minHeight)}
              min={minHeight}
              max={maxHeight}
              step={0.1}
              className="flex-1"
            />
            <div className="flex items-center gap-1 text-sm text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">
              <span>Min:</span>
              <span className="font-medium">{minHeight}</span>
              <span>Max:</span>
              <span className="font-medium">{maxHeight}</span>
            </div>
          </div>
          <Slider
            value={height}
            onChange={(v) => handleHeightChange(v as number)}
            min={minHeight}
            max={maxHeight}
            step={0.1}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newWidth = Math.min(maxWidth, width * 1.2)
            handleWidthChange(newWidth)
          }}
          disabled={width >= maxWidth}
        >
          <Maximize className="w-4 h-4 mr-1" />
          +20% Width
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newWidth = Math.max(minWidth, width * 0.8)
            handleWidthChange(newWidth)
          }}
          disabled={width <= minWidth}
        >
          <Minimize className="w-4 h-4 mr-1" />
          -20% Width
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleWidthChange(Math.min(maxWidth, height))}
          disabled={width === height}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Make Square
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newWidth = Math.min(maxWidth, width * 2)
            handleWidthChange(newWidth)
          }}
          disabled={width >= maxWidth}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Double Size
        </Button>
      </div>

      {/* Preset Sizes */}
      {showPresets && (
        <div className="border-t border-[var(--light)] pt-4">
          <h4 className="font-medium text-body text-[var(--ink)] mb-3">Preset Sizes</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presetSizes.map((preset) => (
              <button
                key={`${preset.width}x${preset.height}`}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  'p-3 rounded-input border-3 text-center text-sm transition-all',
                  width === preset.width && height === preset.height
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] text-[var(--ink)] hover:border-primary'
                )}
              >
                <span className="font-display">{preset.label}</span>
                <div className="text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)] mt-1">
                  {preset.width} × {preset.height} cm
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-[var(--light)] rounded-input p-4 border-2 border-[var(--ink)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-display text-primary">{area}</div>
            <div className="text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Area (cm²)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display text-primary">{pixelsWidth.toLocaleString()}</div>
            <div className="text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Width (px @ {dpi} DPI)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display text-primary">{pixelsHeight.toLocaleString()}</div>
            <div className="text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Height (px @ {dpi} DPI)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display text-primary">{megapixels}</div>
            <div className="text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Megapixels</div>
          </div>
        </div>

        {/* Quality indicator */}
        <div className="mt-4 pt-4 border-t border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--ink)]">Print Quality:</span>
            <div className="flex items-center gap-2">
              {getQualityIndicator(dpi, width, height).map((q) => (
                <Badge key={q.label} variant={q.variant} size="sm" dot dotColor={q.color}>
                  {q.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getQualityIndicator(dpi: number, width: number, height: number) {
  const pixelsWidth = width * dpi / 2.54
  const pixelsHeight = height * dpi / 2.54
  const minDimension = Math.min(pixelsWidth, pixelsHeight)

  if (minDimension >= 300) {
    return [
      { label: 'Excellent', variant: 'success' as const, color: 'var(--success)' },
      { label: '300+ DPI', variant: 'secondary' as const, color: 'var(--secondary)' },
    ]
  } else if (minDimension >= 150) {
    return [
      { label: 'Good', variant: 'primary' as const, color: 'var(--primary)' },
      { label: '150+ DPI', variant: 'secondary' as const, color: 'var(--secondary)' },
    ]
  } else {
    return [
      { label: 'Low', variant: 'warning' as const, color: 'var(--warning)' },
      { label: 'Consider larger size', variant: 'outline' as const, color: 'var(--error)' },
    ]
  }
}

// Compact version for sidebar
export function CompactDimensionControls({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onLockAspectRatio,
  locked = true,
  dpi = 300,
  className,
}: Omit<DimensionControlsProps, 'presetSizes' | 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight'>) {
  const aspectRatio = width / height

  const handleWidthChange = (newWidth: number) => {
    onWidthChange(newWidth)
    if (locked) {
      onHeightChange(Math.round(newWidth / aspectRatio))
    }
  }

  const handleHeightChange = (newHeight: number) => {
    onHeightChange(newHeight)
    if (locked) {
      onWidthChange(Math.round(newHeight * aspectRatio))
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-body text-[var(--ink)]">Canvas Size</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLockAspectRatio(!locked)}
          className={locked ? 'text-primary' : ''}
          aria-label={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)] mb-1">Width (cm)</label>
          <Input
            type="number"
            value={width}
            onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 1)}
            min={1}
            max={100}
            step={0.1}
            className="text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[color-mix(in_srgb,var(--ink)_60%,transparent)] mb-1">Height (cm)</label>
          <Input
            type="number"
            value={height}
            onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 1)}
            min={1}
            max={100}
            step={0.1}
            className="text-sm"
          />
        </div>
      </div>

      <div className="text-xs text-[color-mix(in_srgb,var(--ink)_50%,transparent)]">
        {width} × {height} cm • {Math.round(width * dpi / 2.54)} × {Math.round(height * dpi / 2.54)} px @ {dpi} DPI
      </div>
    </div>
  )
}