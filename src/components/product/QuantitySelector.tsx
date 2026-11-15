'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { QuantityConfig } from '@/types'
import { Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { motionVariants } from '@/lib/motion'

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
  const [shake, setShake] = useState(false)

  const handleDecrease = () => {
    if (quantity > min) onChange(quantity - 1)
  }

  const handleIncrease = () => {
    if (quantity < max) onChange(quantity + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || min
    const clamped = Math.max(min, Math.min(max, val))
    
    // Check if the new value is valid against quantity configs
    const validConfig = quantityConfigs.find(
      (q) => clamped >= q.minQty && (q.maxQty === null || clamped <= q.maxQty)
    )
    
    if (validConfig) {
      onChange(clamped)
    } else {
      // Trigger shake animation
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  // Reset shake when quantity changes via buttons
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [quantity, shake])

  return (
    <div className={cn('flex items-center gap-4 flex-wrap', className)}>
      {/* Input with buttons */}
      <motion.div
        className="flex items-center border-[3px] border-[var(--ink)] rounded-[var(--radius-md)] bg-[var(--surface-raised)] overflow-hidden"
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Button
          variant="doodle-outline"
          size="sm"
          onClick={handleDecrease}
          disabled={disabled || quantity <= min}
          aria-label="Decrease quantity"
          className="w-12 h-12 p-0 hover:shadow-btn-hover active:shadow-btn-active"
        >
          <Minus className="w-5 h-5" />
        </Button>
        <input
          type="number"
          value={quantity}
          onChange={handleInputChange}
          className="w-auto min-w-[3rem] h-12 text-center text-xl font-display text-[var(--ink)] border-none focus:outline-none"
          min={min}
          max={max}
          disabled={disabled}
          aria-label="Quantity"
        />
        <Button
          variant="doodle-outline"
          size="sm"
          onClick={handleIncrease}
          disabled={disabled || quantity >= max}
          aria-label="Increase quantity"
          className="w-12 h-12 p-0 hover:shadow-btn-hover active:shadow-btn-active"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Tier badges */}
      {showTierBadges && quantityConfigs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quantityConfigs.map((config) => (
            <Button
              key={`${config.minQty}-${config.maxQty || 'max'}`}
              variant={selectedConfig?.id === config.id ? 'doodle' : 'doodle-outline'}
              size="sm"
              onClick={() => !disabled && onChange(config.minQty)}
              disabled={disabled}
              className="transition-all"
            >
              {config.label}
            </Button>
          ))}
        </div>
      )}

      {/* Price per unit display */}
      {selectedConfig && quantityConfigs.length > 1 && (
        <span className="text-sm text-[var(--text-subtle)]">
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
        variant="doodle-outline"
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
        variant="doodle-outline"
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