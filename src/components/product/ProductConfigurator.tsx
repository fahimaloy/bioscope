'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Dropdown } from '@/components/ui/Dropdown'
import type { Product, DimensionConfig, CustomizationOptions } from '@/types'
import { Minus, Plus, Maximize, Minimize } from 'lucide-react'

interface ProductConfiguratorProps {
  product: Product
  selectedDimension?: DimensionConfig
  onDimensionChange: (dimension: DimensionConfig) => void
  selectedQuantity?: number
  onQuantityChange: (quantity: number) => void
  customization?: CustomizationOptions | null
  onCustomizationChange?: (customization: CustomizationOptions | null) => void
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
          <div className="text-sm text-[var(--text-subtle)] mt-2">
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
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Size options">
          {visibleDimensions.map((dim) => (
            <Button
              key={`${dim.width}x${dim.height}`}
              variant={selectedDimension?.id === dim.id ? 'doodle' : 'doodle-outline'}
              size="md"
              className={cn(
                'px-4 py-3 rounded-input font-medium transition-all min-w-[110px]',
                'relative overflow-hidden',
                selectedDimension?.id === dim.id && 'animate-pulse-soft'
              )}
              onClick={() => onDimensionChange(dim)}
              role="radio"
              aria-checked={selectedDimension?.id === dim.id}
            >
              <span className="block font-display">{dim.label}</span>
              {dim.priceMultiplier !== 1 && (
                <span className="absolute top-1 right-1 text-xs bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary px-1.5 py-0.5 rounded">
                  {dim.priceMultiplier > 1 ? '+' : ''}{(dim.priceMultiplier - 1) * 100}%
                </span>
              )}
            </Button>
          ))}
        </div>
      </fieldset>

      {/* Quantity */}
      <fieldset className="space-y-4">
        <legend className="font-medium text-body text-[var(--ink)]">Quantity</legend>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Visual quantity selector */}
          <div className="flex items-center border-[3px] border-[var(--ink)] rounded-[var(--radius-md)] bg-[var(--surface-raised)] overflow-hidden">
            <Button
              variant="doodle-outline"
              size="sm"
              onClick={() => onQuantityChange(Math.max(1, selectedQuantity - 1))}
              disabled={selectedQuantity <= 1}
              aria-label="Decrease quantity"
              className="w-12 h-12 p-0 hover:shadow-btn-hover active:shadow-btn-active"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <input
              type="number"
              value={selectedQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                onQuantityChange(val)
              }}
              className="w-auto min-w-[3rem] h-12 text-center text-xl font-display text-[var(--ink)] border-none focus:outline-none"
              min="1"
              max={qtyConfig?.maxQty || 999}
              aria-label="Quantity"
            />
            <Button
              variant="doodle-outline"
              size="sm"
              onClick={() => {
                const max = qtyConfig?.maxQty || 999
                onQuantityChange(Math.min(max, selectedQuantity + 1))
              }}
              aria-label="Increase quantity"
              className="w-12 h-12 p-0 hover:shadow-btn-hover active:shadow-btn-active"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Quantity tier badges */}
          <div className="flex flex-wrap gap-2">
            {product.allowedQuantities.map((q) => (
              <Button
                key={`${q.minQty}-${q.maxQty || 'max'}`}
                variant={qtyConfig?.id === q.id ? 'doodle' : 'doodle-outline'}
                size="sm"
                onClick={() => onQuantityChange(q.minQty)}
              >
                {q.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Price per unit indicator */}
        {product.allowedQuantities.length > 1 && (
          <p className="text-sm text-[var(--text-subtle)]">
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
                value={customization?.materials?.[0] || ''}
                onChange={(v) => onCustomizationChange?.({ ...(customization as Record<string, string | number | boolean | undefined>), materials: [v] })}
              />
            )}

            {product.customizationOptions.finishes?.length && (
              <CustomizationGroup
                label="Finish"
                options={product.customizationOptions.finishes}
                value={customization?.finishes?.[0] || ''}
                onChange={(v) => onCustomizationChange?.({ ...(customization as Record<string, string | number | boolean | undefined>), finishes: [v] })}
              />
            )}

            {product.customizationOptions.cutTypes?.length && (
              <CustomizationGroup
                label="Cut Type"
                options={product.customizationOptions.cutTypes}
                value={customization?.cutTypes?.[0] || ''}
                onChange={(v) => onCustomizationChange?.({ ...(customization as Record<string, string | number | boolean | undefined>), cutTypes: [v] })}
                renderOption={(opt) => opt.replace('_', ' ')}
              />
            )}

            {product.customizationOptions.colors?.length && (
              <CustomizationGroup
                label="Color"
                options={product.customizationOptions.colors}
                value={customization?.colors?.[0] || ''}
                onChange={(v) => onCustomizationChange?.({ ...(customization as Record<string, string | number | boolean | undefined>), colors: [v] })}
                isColor={true}
              />
            )}

            {product.customizationOptions.customFields?.length && (
              <div className="space-y-4">
                {product.customizationOptions.customFields.map((field) => (
                  <CustomField
                    key={field.key}
                    field={field}
                    value={String((customization as Record<string, string | string[]>)[field.key] ?? '')}
                    onChange={(v) => onCustomizationChange?.({ ...(customization as Record<string, string | number | boolean | undefined>), [field.key]: v })}
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
          <Button
            key={option}
            variant={value === option ? 'doodle' : 'doodle-outline'}
            size="sm"
            className={cn(
              isColor ? 'w-10 h-10 rounded-full p-0' : '',
            )}
            onClick={() => onChange?.(option)}
            style={isColor ? { backgroundColor: option } : undefined}
            aria-pressed={value === option}
          >
            {!isColor && renderOption(option)}
          </Button>
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
  value?: string | number | boolean
  onChange?: (value: string | number | boolean) => void
}) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)
  const handleSelectChange = (val: string) => onChange?.(val)
  const handleColorChange = (color: string) => onChange?.(color)
  const handleBooleanChange = (checked: boolean) => onChange?.(checked)

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">{field.label} {field.required && <span className="text-[var(--error)]">*</span>}</label>
          <input
            type="text"
            value={value != null ? String(value) : ''}
            onChange={handleTextChange}
            className="w-full px-4 py-3 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input focus:border-primary focus:shadow-input"
            placeholder={field.label}
          />
        </div>
      )
    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">{field.label} {field.required && <span className="text-[var(--error)]">*</span>}</label>
          <Dropdown
            trigger={<Button variant="outline" className="w-full justify-between">{value != null ? String(value) : 'Select...'}</Button>}
            items={field.options?.map((opt) => ({ value: opt, label: opt })) || []}
            value={value != null ? String(value) : ''}
            onChange={handleSelectChange}
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
              <Button
                key={color}
                variant={value != null && String(value) === color ? 'doodle' : 'doodle-outline'}
                size="sm"
                className="w-10 h-10 rounded-full p-0"
                onClick={() => handleColorChange(color)}
                style={{ backgroundColor: color }}
                aria-pressed={value != null && String(value) === color}
              />
            ))}
          </div>
        </div>
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={handleBooleanChange}
            className="h-5 w-5"
          />
          <span className="text-body text-[var(--ink)]">{field.label}</span>
        </label>
      )
    default:
      return null
  }
}