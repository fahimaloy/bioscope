'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { QuantityConfig } from '@/types'
import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  quantity: number
  onChange: (quantity: number) => void
  quantityConfigs: QuantityConfig[]
  selectedConfig?: QuantityConfig
  min?: number
  max?: number
  showTierBadges?: boolean
  className?: string
  disabled?: boolean
}

export function QuantitySelector({
  quantity,
  onChange,
  quantityConfigs,
  selectedConfig,
  min = 1,
  max = 999,
  showTierBadges = true,
  className,
  disabled = false,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > min) onChange(quantity - 1)
  }

  const handleIncrease = () => {
    if (quantity < max) onChange(quantity + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || min
    const clamped = Math.max(min, Math.min(max, val))
    onChange(clamped)
  }

  return (
    <div className={cn('flex items-center gap-4 flex-wrap', className)}>
      {/* Input with buttons */}
      <div className="flex items-center border-3 border-[var(--ink)]/30 rounded-input overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDecrease}
          disabled={disabled || quantity <= min}
          aria-label="Decrease quantity"
          className="w-12 h-12 p-0"
        >
          <Minus className="w-5 h-5" />
        </Button>
        <input
          type="number"
          value={quantity}
          onChange={handleInputChange}
          className="w-20 h-12 text-center text-xl font-display text-[var(--ink)] border-none focus:outline-none"
          min={min}
          max={max}
          disabled={disabled}
          aria-label="Quantity"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleIncrease}
          disabled={disabled || quantity >= max}
          aria-label="Increase quantity"
          className="w-12 h-12 p-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Tier badges */}
      {showTierBadges && quantityConfigs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quantityConfigs.map((config) => (
            <button
              key={`${config.minQty}-${config.maxQty || 'max'}`}
              onClick={() => !disabled && onChange(config.minQty)}
              disabled={disabled}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                selectedConfig?.id === config.id
                  ? 'bg-primary text-white shadow-btn'
                  : 'bg-[var(--light)] text-[var(--ink)]/70 hover:bg-dark/10 border border-[var(--ink)]/20'
              )}
            >
              {config.label}
            </button>
          ))}
        </div>
      )}

      {/* Price per unit display */}
      {selectedConfig && quantityConfigs.length > 1 && (
        <span className="text-sm text-[var(--ink)]/60">
          {selectedConfig.pricePerUnit.toLocaleString()} BDT/unit
        </span>
      )}
    </div>
  )
}

// Compact version for cart
export function CompactQuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 999,
  className,
  disabled = false,
}: Omit<QuantitySelectorProps, 'quantityConfigs' | 'selectedConfig' | 'showTierBadges'>) {
  const handleDecrease = () => {
    if (quantity > min) onChange(quantity - 1)
  }

  const handleIncrease = () => {
    if (quantity < max) onChange(quantity + 1)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        className="w-8 h-8 p-0"
      >
        <Minus className="w-4 h-4" />
      </Button>
      <span className="w-10 text-center text-lg font-medium text-[var(--ink)]">{quantity}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        className="w-8 h-8 p-0"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )
}