'use client'

import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/product/ProductCard'
import { CompactQuantitySelector } from '@/components/product/QuantitySelector'
import { motion } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'
import type { CartItem } from '@/types'
import { Trash2, Edit3 } from 'lucide-react'
import Image from 'next/image'

interface CartItemProps {
  item: CartItem
  onUpdate: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  onEdit?: (item: CartItem) => void
  showEdit?: boolean
  className?: string
}

export function CartItem({ item, onUpdate, onRemove, onEdit, showEdit = false, className }: CartItemProps) {
  const variants = useMotionVariants()
  const itemId = `${item.productId}-${item.width}-${item.height}`
  const lineTotal = item.unitPrice * item.quantity

  return (
    <motion.div
      className={cn(
        // Stacks below `sm`: at 320px the product row and the quantity/price
        // column cannot sit side by side without overflowing the viewport
        // (contract §6 — no horizontal scroll at 320px).
        'flex flex-col gap-4 p-4 bg-[var(--surface-raised)] rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] shadow-ink-3 sm:flex-row',
        className,
      )}
      variants={variants.staggerItem}
    >
      {/* Product Display using ProductCard compact variant */}
      <ProductCard
        product={item.product}
        variant="compact"
        showActions={false}
        className="flex-1 min-w-0"
      />

      {/* Quantity & Price Breakdown */}
      <div className="flex flex-col items-end gap-3 flex-shrink-0 w-48">
        {/* Quantity Selector Inline */}
        <CompactQuantitySelector
          quantity={item.quantity}
          onChange={(q) => onUpdate(itemId, q)}
          min={1}
          max={999}
        />

        {/* Price Breakdown: base × qty = line total */}
        <div className="text-right w-full">
          <div className="text-xs text-[var(--text-subtle)]">
            {formatCurrency(item.unitPrice)} × {item.quantity}
          </div>
          <div className="font-display text-lg text-[var(--brand)]">{formatCurrency(lineTotal)}</div>
        </div>

        {/* Remove Button with hover shake */}
        <motion.button
          type="button"
          onClick={() => onRemove(itemId)}
          className="p-2 text-[var(--text-subtle)] hover:text-[var(--error)] transition-colors flex-shrink-0"
          aria-label="Remove item"
          whileHover={{ rotate: [-5, 5, -5, 0] }}
          transition={{ duration: 0.3 }}
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Edit Button (if enabled) */}
      {showEdit && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          className="flex-shrink-0 self-start"
        >
          <Edit3 className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  )
}

// Cart Item for checkout (read-only)
export function CheckoutCartItem({ item }: { item: CartItem }) {
  const total = item.unitPrice * item.quantity

  return (
    <div className="flex gap-4 p-3 bg-[var(--paper-deep)] rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
      <div className="relative w-16 h-16 flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
        <Image src={item.productImage || '/images/sticker-placeholder.svg'} alt={item.productName} fill className="object-cover" sizes="64px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[var(--text)] truncate">{item.productName}</p>
        <p className="text-xs text-[var(--text-subtle)]">{item.width} × {item.height} cm</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm text-[var(--text)]">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
        <p className="font-display text-[var(--brand)]">{formatCurrency(total)}</p>
      </div>
    </div>
  )
}
