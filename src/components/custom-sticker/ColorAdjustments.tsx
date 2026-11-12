'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import type { ImageFilter } from '@/types'
import { Sun, Contrast, Palette, Droplet, Minus, Plus, RefreshCw } from 'lucide-react'

interface ColorAdjustmentsProps {
  filter: ImageFilter
  onChange: (filter: Partial<ImageFilter>) => void
  className?: string
}

export function ColorAdjustments({ filter, onChange, className }: ColorAdjustmentsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const adjustments = [
    { key: 'brightness' as const, label: 'Brightness', icon: Sun, min: 0, max: 200, step: 1, default: 100 },
    { key: 'contrast' as const, label: 'Contrast', icon: Contrast, min: 0, max: 200, step: 1, default: 100 },
    { key: 'saturation' as const, label: 'Saturation', icon: Palette, min: 0, max: 200, step: 1, default: 100 },
    { key: 'hue' as const, label: 'Hue', icon: Droplet, min: -180, max: 180, step: 1, default: 0 },
  ]

  const advancedAdjustments = [
    { key: 'blur' as const, label: 'Blur', min: 0, max: 10, step: 0.1, default: 0 },
    { key: 'grayscale' as const, label: 'Grayscale', min: 0, max: 100, step: 1, default: 0 },
    { key: 'sepia' as const, label: 'Sepia', min: 0, max: 100, step: 1, default: 0 },
  ]

  const allDefault = adjustments.every((a) => filter[a.key] === a.default) &&
    advancedAdjustments.every((a) => filter[a.key] === a.default)

  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card p-6 space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-primary">Color Adjustments</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <Minus className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </Button>
          {!allDefault && (
            <Button variant="outline" size="sm" onClick={() => onChange({})}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset All
            </Button>
          )}
        </div>
      </div>

      {/* Basic Adjustments */}
      <div className="space-y-6">
        {adjustments.map((adj) => (
          <AdjustmentSlider
            key={adj.key}
            label={adj.label}
            icon={adj.icon}
            value={filter[adj.key] ?? adj.default}
            min={adj.min}
            max={adj.max}
            step={adj.step}
            defaultValue={adj.default}
            onChange={(value) => onChange({ [adj.key]: value })}
          />
        ))}
      </div>

      {/* Advanced Adjustments */}
      {showAdvanced && (
        <>
          <div className="border-t border-[var(--light)] pt-6">
            <h4 className="font-medium text-body text-[var(--ink)] mb-4">Advanced</h4>
            <div className="space-y-6">
              {advancedAdjustments.map((adj) => (
                <AdjustmentSlider
                  key={adj.key}
                  label={adj.label}
                  value={filter[adj.key] ?? adj.default}
                  min={adj.min}
                  max={adj.max}
                  step={adj.step}
                  defaultValue={adj.default}
                  onChange={(value) => onChange({ [adj.key]: value })}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Color Balance */}
      <div className="border-t border-[var(--light)] pt-6">
        <h4 className="font-medium text-body text-[var(--ink)] mb-4">Color Balance</h4>
        <div className="grid grid-cols-3 gap-4">
          <ColorBalanceChannel label="Shadows" color="red" onChange={(c) => onChange({ shadows: c })} />
          <ColorBalanceChannel label="Midtones" color="green" onChange={(c) => onChange({ midtones: c })} />
          <ColorBalanceChannel label="Highlights" color="blue" onChange={(c) => onChange({ highlights: c })} />
        </div>
      </div>

      {/* Presets */}
      <div className="border-t border-[var(--light)] pt-6">
        <h4 className="font-medium text-body text-[var(--ink)] mb-4">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Vivid', filter: { brightness: 110, contrast: 115, saturation: 120 } },
            { label: 'Vintage', filter: { brightness: 95, contrast: 90, saturation: 80, sepia: 30, hue: -10 } },
            { label: 'B&W', filter: { grayscale: 100, contrast: 110 } },
            { label: 'Cinematic', filter: { brightness: 90, contrast: 120, saturation: 110, hue: 5 } },
            { label: 'Cool', filter: { brightness: 100, contrast: 105, saturation: 90, hue: -15 } },
            { label: 'Warm', filter: { brightness: 105, contrast: 105, saturation: 105, hue: 15 } },
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              onClick={() => onChange(preset.filter)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Adjustment Slider Component
function AdjustmentSlider({
  label,
  icon: Icon,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  value: number
  min: number
  max: number
  step: number
  defaultValue: number
  onChange: (value: number) => void
}) {
  const isDefault = value === defaultValue

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-medium text-body text-[var(--ink)]">
          {Icon ? <Icon className="w-5 h-5 text-primary" /> : null}
          {label}
        </label>
        <span className={cn(
          'text-sm font-display',
          isDefault ? 'text-[var(--text-subtle)]' : 'text-primary'
        )}>
          {value > 0 ? '+' : ''}{value - defaultValue}%
        </span>
      </div>
      <Slider
        value={value}
        onChange={(v) => onChange(v as number)}
        min={min}
        max={max}
        step={step}
        showValue={false}
      />
    </div>
  )
}

// Color Balance Channel
function ColorBalanceChannel({
  label,
  color,
  onChange,
}: {
  label: string
  color: 'red' | 'green' | 'blue'
  onChange: (value: number) => void
}) {
  const colorMap = {
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
  }

  const [value, setValue] = useState(0)

  useEffect(() => {
    onChange(value)
  }, [value, color, onChange])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--ink)]">{label}</label>
      <div className="relative">
        <input
          type="range"
          min="-100"
          max="100"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
          className={cn(
            'w-full h-2 appearance-none rounded-full',
            `bg-gradient-to-r from-${color}-500 via-transparent to-${color}-500`
          )}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-full text-xs font-medium text-[var(--text-muted)]">
          {value > 0 ? '+' : ''}{value}
        </div>
      </div>
    </div>
  )
}

// Need to import useState, useEffect
import { useState, useEffect } from 'react'