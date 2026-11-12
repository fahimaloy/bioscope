'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/product/ProductCard'
import { CompactQuantitySelector } from '@/components/product/QuantitySelector'
import { motion } from 'framer-motion'
import { motionVariants } from '@/lib/motion'
import type { CartItem } from '@/types'
import { Trash2, Edit3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CartItemProps {
  item: CartItem
  onUpdate: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  onEdit?: (item: CartItem) => void
  showEdit?: boolean
  className?: string
}

export function CartItem({ item, onUpdate, onRemove, onEdit, showEdit = false, className }: CartItemProps) {
  const itemId = `${item.productId}-${item.width}-${item.height}`
  const lineTotal = item.unitPrice * item.quantity

  return (
    <motion.div
      className={cn('flex gap-4 p-4 bg-white rounded-card border-3 border-[var(--ink)] shadow-card', className)}
      variants={motionVariants.staggerItem}
      initial="hidden"
      animate="visible"
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
          <div className="text-xs text-[var(--text-subtle)] font-body">
            {formatCurrency(item.unitPrice)} × {item.quantity}
          </div>
          <div className="font-display text-lg text-primary">
            {formatCurrency(lineTotal)}
          </div>
        </div>

        {/* Remove Button with hover shake */}
        <motion.button
          onClick={() => onRemove(itemId)}
          className="p-2 text-[var(--text-subtle)] hover:text-red-500 transition-colors flex-shrink-0"
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
import Image from 'next/image'

export function CheckoutCartItem({ item }: { item: CartItem }) {
  const total = item.unitPrice * item.quantity

  return (
    <div className="flex gap-4 p-3 bg-[var(--light)] rounded-input border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
      <div className="relative w-16 h-16 flex-shrink-0 rounded-input overflow-hidden border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
        <Image src={item.productImage || '/images/sticker-placeholder.svg'} alt={item.productName} fill className="object-cover" sizes="64px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[var(--ink)] truncate">{item.productName}</p>
        <p className="text-xs text-[var(--text-subtle)]">{item.width} × {item.height} cm</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm text-[var(--ink)]">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
        <p className="font-display text-primary">{formatCurrency(total)}</p>
      </div>
    </div>
  )
}