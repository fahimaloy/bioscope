'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { CompactQuantitySelector } from '@/components/product/QuantitySelector'
import { useCartStore } from '@/lib/stores/cartStore'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from '@/types'
import { Trash2, Edit3, Tag, Minus, Plus } from 'lucide-react'

interface CartItemProps {
  item: CartItem
  onUpdate: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  onEdit?: (item: CartItem) => void
  showEdit?: boolean
  className?: string
}

export function CartItem({ item, onUpdate, onRemove, onEdit, showEdit = false, className }: CartItemProps) {
  const { getItemTotal } = useCartStore()

  const dimensionLabel = `${item.width} × ${item.height} cm`
  const total = getItemTotal(item)

  return (
    <div className={cn('flex gap-4 p-4 bg-white rounded-card border-3 border-[var(--ink)] shadow-card', className)}>
      {/* Image */}
      <div className="relative w-24 h-24 flex-shrink-0 rounded-input overflow-hidden border-2 border-[var(--ink)]/20">
        <Link href={`/shop/${item.productSlug}`}>
          <Image
            src={item.productImage || '/images/sticker-placeholder.svg'}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="96px"
          />
        </Link>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/shop/${item.productSlug}`} className="block">
              <h3 className="font-medium text-body text-[var(--ink)] truncate mb-1">{item.productName}</h3>
            </Link>
            <div className="flex items-center gap-3 mt-1 text-sm text-[var(--ink)]/60 flex-wrap">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {dimensionLabel}
              </span>
              {item.customization && Object.keys(item.customization).length > 0 && (
                <span className="flex items-center gap-1 text-primary/80">
                  <Edit3 className="w-3 h-3" />
                  Customized
                </span>
              )}
            </div>
          </div>

          {showEdit && onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="flex-shrink-0">
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Quantity & Price */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--light)]">
          <CompactQuantitySelector
            quantity={item.quantity}
            onChange={(q) => onUpdate(`${item.productId}-${item.width}-${item.height}`, q)}
            min={1}
            max={999}
          />
          <div className="text-right">
            <div className="font-display text-lg text-primary">{formatCurrency(total)}</div>
            <div className="text-xs text-[var(--ink)]/50">{formatCurrency(item.unitPrice)} each</div>
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(`${item.productId}-${item.width}-${item.height}`)}
        className="p-2 text-[var(--ink)]/40 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Remove item"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}

// Cart Item for checkout (read-only)
export function CheckoutCartItem({ item }: { item: CartItem }) {
  const total = item.unitPrice * item.quantity

  return (
    <div className="flex gap-4 p-3 bg-[var(--light)] rounded-input border border-[var(--ink)]/20">
      <div className="relative w-16 h-16 flex-shrink-0 rounded-input overflow-hidden border border-[var(--ink)]/20">
        <Image src={item.productImage || '/images/sticker-placeholder.svg'} alt={item.productName} fill className="object-cover" sizes="64px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[var(--ink)] truncate">{item.productName}</p>
        <p className="text-xs text-[var(--ink)]/60">{item.width} × {item.height} cm</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-sm text-[var(--ink)]">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
        <p className="font-display text-primary">{formatCurrency(total)}</p>
      </div>
    </div>
  )
}