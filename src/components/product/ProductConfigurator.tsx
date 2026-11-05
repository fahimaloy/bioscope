'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { Dropdown } from '@/components/ui/Dropdown'
import { Badge } from '@/components/ui/Badge'
import type { Product, DimensionConfig, QuantityConfig } from '@/types'
import { Minus, Plus, Maximize, Minimize } from 'lucide-react'

interface ProductConfiguratorProps {
  product: Product
  selectedDimension?: DimensionConfig
  onDimensionChange: (dimension: DimensionConfig) => void
  selectedQuantity?: number
  onQuantityChange: (quantity: number) => void
  customization?: Record<string, any>
  onCustomizationChange?: (customization: Record<string, any>) => void
  className?: string
}

export function ProductConfigurator({
  product,
  selectedDimension,
  onDimensionChange,
  selectedQuantity = 1,
  onQuantityChange,
  customization = {},
  onCustomizationChange,
  className,
}: ProductConfiguratorProps) {
  const [showAllDimensions, setShowAllDimensions] = useState(false)
  const [expandedCustomization, setExpandedCustomization] = useState<string | null>(null)

  // Calculate price
  const dimensionMultiplier = selectedDimension?.priceMultiplier || 1
  const qtyConfig = product.allowedQuantities
    .sort((a, b) => a.minQty - b.minQty)
    .find((q) => selectedQuantity >= q.minQty && (q.maxQty === null || selectedQuantity <= q.maxQty))
  const unitPrice = qtyConfig?.pricePerUnit || product.basePrice
  const finalPrice = unitPrice * dimensionMultiplier
  const totalPrice = finalPrice * selectedQuantity

  const visibleDimensions = showAllDimensions || product.allowedDimensions.length <= 4
    ? product.allowedDimensions
    : product.allowedDimensions.slice(0, 4)

  return (
    <div className={cn('space-y-6 p-6 bg-white rounded-card border-3 border-[var(--ink)] shadow-card', className)}>
      {/* Price Summary */}
      <div className="bg-[var(--light)] rounded-input p-4 border-2 border-[var(--ink)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-body text-[var(--ink)]">Unit Price</span>
          <span className="text-2xl font-display text-primary">{finalPrice.toLocaleString()} BDT</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-body text-[var(--ink)]">Total ({selectedQuantity} pcs)</span>
          <span className="text-3xl font-display text-primary">{totalPrice.toLocaleString()} BDT</span>
        </div>
        {product.taxPercent > 0 && (
          <div className="text-sm text-[var(--ink)]/60 mt-2">
            Tax ({product.taxPercent}%): {(totalPrice * product.taxPercent / 100).toFixed(2)} BDT
          </div>
        )}
      </div>

      {/* Dimensions */}
      <fieldset className="space-y-4">
        <legend className="font-medium text-body text-[var(--ink)] flex items-center justify-between">
          Select Size
          {product.allowedDimensions.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllDimensions(!showAllDimensions)}
            >
              {showAllDimensions ? <Minimize className="w-4 h-4 mr-1" /> : <Maximize className="w-4 h-4 mr-1" />}
              {showAllDimensions ? 'Show Less' : `Show All (${product.allowedDimensions.length})`}
            </Button>
          )}
        </legend>
        <div className="flex flex-wrap gap-3">
          {visibleDimensions.map((dim) => (
            <button
              key={`${dim.width}x${dim.height}`}
              onClick={() => onDimensionChange(dim)}
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
        </div>
      </fieldset>

      {/* Quantity */}
      <fieldset className="space-y-4">
        <legend className="font-medium text-body text-[var(--ink)]">Quantity</legend>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Visual quantity selector */}
          <div className="flex items-center border-3 border-[var(--ink)]/30 rounded-input overflow-hidden">
            <button
              onClick={() => onQuantityChange(Math.max(1, selectedQuantity - 1))}
              disabled={selectedQuantity <= 1}
              className="w-12 h-12 flex items-center justify-center text-2xl text-[var(--ink)] hover:bg-[var(--light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              value={selectedQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                onQuantityChange(val)
              }}
              className="w-20 h-12 text-center text-xl font-display text-[var(--ink)] border-none focus:outline-none"
              min="1"
              max={qtyConfig?.maxQty || 999}
              aria-label="Quantity"
            />
            <button
              onClick={() => {
                const max = qtyConfig?.maxQty || 999
                onQuantityChange(Math.min(max, selectedQuantity + 1))
              }}
              className="w-12 h-12 flex items-center justify-center text-2xl text-[var(--ink)] hover:bg-[var(--light)] transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quantity tier badges */}
          <div className="flex flex-wrap gap-2">
            {product.allowedQuantities.map((q) => (
              <Badge
                key={`${q.minQty}-${q.maxQty || 'max'}`}
                variant={qtyConfig?.id === q.id ? 'primary' : 'outline'}
                size="sm"
                className="cursor-pointer"
                onClick={() => onQuantityChange(q.minQty)}
              >
                {q.label}
                {q.minQty === selectedQuantity && <span className="ml-1">✓</span>}
              </Badge>
            ))}
          </div>
        </div>

        {/* Price per unit indicator */}
        {product.allowedQuantities.length > 1 && (
          <p className="text-sm text-[var(--ink)]/60">
            Price per unit: <span className="font-medium text-primary">{unitPrice.toLocaleString()} BDT</span>
          </p>
        )}
      </fieldset>

      {/* Customization Options */}
      {product.customizationOptions && (
        <fieldset className="space-y-4">
          <legend className="font-medium text-body text-[var(--ink)]">Customize</legend>
          <div className="space-y-4">
            {product.customizationOptions.materials?.length && (
              <CustomizationGroup
                label="Material"
                options={product.customizationOptions.materials}
                value={customization.material}
                onChange={(v) => onCustomizationChange?.({ ...customization, material: v })}
              />
            )}

            {product.customizationOptions.finishes?.length && (
              <CustomizationGroup
                label="Finish"
                options={product.customizationOptions.finishes}
                value={customization.finish}
                onChange={(v) => onCustomizationChange?.({ ...customization, finish: v })}
              />
            )}

            {product.customizationOptions.cutTypes?.length && (
              <CustomizationGroup
                label="Cut Type"
                options={product.customizationOptions.cutTypes}
                value={customization.cutType}
                onChange={(v) => onCustomizationChange?.({ ...customization, cutType: v })}
                renderOption={(opt) => opt.replace('_', ' ')}
              />
            )}

            {product.customizationOptions.colors?.length && (
              <CustomizationGroup
                label="Color"
                options={product.customizationOptions.colors}
                value={customization.color}
                onChange={(v) => onCustomizationChange?.({ ...customization, color: v })}
                isColor={true}
              />
            )}

            {product.customizationOptions.customFields?.length && (
              <div className="space-y-4">
                {product.customizationOptions.customFields.map((field) => (
                  <CustomField
                    key={field.key}
                    field={field}
                    value={customization[field.key]}
                    onChange={(v) => onCustomizationChange?.({ ...customization, [field.key]: v })}
                  />
                ))}
              </div>
            )}
          </div>
        </fieldset>
      )}
    </div>
  )
}

// Sub-components
function CustomizationGroup({
  label,
  options,
  value,
  onChange,
  renderOption = (opt) => opt,
  isColor = false,
}: {
  label: string
  options: string[]
  value?: string
  onChange?: (value: string) => void
  renderOption?: (opt: string) => string
  isColor?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--ink)] mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange?.(option)}
            className={cn(
              'px-4 py-2 rounded-input border-2 text-sm transition-all',
              isColor
                ? 'w-10 h-10 rounded-full'
                : '',
              value === option
                ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2'
                : isColor
                ? 'border-2 border-[var(--ink)]/30 hover:ring-2 ring-primary'
                : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
            )}
            style={isColor ? { backgroundColor: option } : undefined}
            aria-pressed={value === option}
          >
            {!isColor && renderOption(option)}
          </button>
        ))}
      </div>
    </div>
  )
}

function CustomField({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string; type: 'text' | 'select' | 'color' | 'boolean'; required?: boolean; options?: string[] }
  value?: any
  onChange?: (value: any) => void
}) {
  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-4 py-3 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input"
            placeholder={field.label}
          />
        </div>
      )
    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
          <Dropdown
            trigger={<Button variant="outline" className="w-full justify-between">{value || 'Select...'}</Button>}
            items={field.options?.map((opt) => ({ value: opt, label: opt })) || []}
            value={value}
            onChange={onChange}
            placeholder="Select..."
          />
        </div>
      )
    case 'color':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">{field.label}</label>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((color) => (
              <button
                key={color}
                onClick={() => onChange?.(color)}
                className={cn(
                  'w-10 h-10 rounded-full border-3 transition-all',
                  value === color
                    ? 'ring-2 ring-primary ring-offset-2 scale-110'
                    : 'border-[var(--ink)]/30 hover:ring-2 ring-primary'
                )}
                style={{ backgroundColor: color }}
                aria-pressed={value === color}
              />
            ))}
          </div>
        </div>
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange?.(e.target.checked)}
            className="w-5 h-5 text-primary border-2 border-[var(--ink)] rounded focus:ring-2 focus:ring-primary"
          />
          <span className="text-body text-[var(--ink)]">{field.label}</span>
        </label>
      )
    default:
      return null
  }
}