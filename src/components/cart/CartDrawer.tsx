'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { CompactQuantitySelector } from '@/components/product/QuantitySelector'
import { useCartStore, useCartItems, useCartIsOpen, useCartActions } from '@/lib/stores/cartStore'
import { X, Trash2, ShoppingCart, Tag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from '@/types'

/** Spring preset from spec §5.5: stiffness 400–550, damping 20–30. */
const DRAWER_SPRING = { type: 'spring', stiffness: 420, damping: 30 } as const

/** Focusable elements inside the dialog, used by the Tab trap. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Task 1.5 — the cart drawer (spec §6 component inventory; owner rulings 3–12).
 *
 * A modal (`role="dialog" aria-modal="true"`) mounted once in the root layout,
 * next to the `<Toaster />`, so every route — including `/` and `/admin/*` —
 * has cart access. It stays mounted: the slide is a spring (honouring
 * `MotionConfig reducedMotion="user"`), and the closed state is
 * `invisible pointer-events-none aria-hidden`, which removes it from the
 * accessibility tree and from hit-testing after the exit animation.
 *
 * Every colour is a token (contract §1): the scrim is `--overlay`, the surface
 * is `--paper`, the left border is 3px `--ink`, and the offset shadow is a hard
 * `var(--ink)` step (contract §5 — no gradients, no glass, no blurred shadow).
 */
export function CartDrawer() {
  const isOpen = useCartIsOpen()
  const items = useCartItems()
  const subtotal = useCartStore((state) => state.subtotal)
  const { closeCart, removeItem, updateQuantity, getItemQuantity } = useCartActions()
  const asideRef = useRef<HTMLElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const isOpenRef = useRef(isOpen)
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // Open: capture the invoking element, lock scroll, reveal.
  // Close: unlock scroll. The exit animation runs before `isVisible` flips.
  useEffect(() => {
    if (isOpen) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      setIsVisible(true)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Focus only after the reveal commit. `focus()` on an element that still
  // carries `invisible` (`visibility: hidden`) is a no-op in a real browser,
  // so focusing inside the effect above would leave focus on <body> — the
  // drawer must be visible before it can receive focus (review finding 1).
  useEffect(() => {
    if (!isVisible) return
    asideRef.current?.focus()
  }, [isVisible])

  // ESC closes; Tab is trapped while the drawer is open (ruling 9).
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeCart()
        return
      }
      if (event.key !== 'Tab') return

      const aside = asideRef.current
      const focusables = aside?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (!aside || !focusables || focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      // The aside is itself a tab stop (tabIndex={-1}) but is excluded from
      // FOCUSABLE_SELECTOR, so treat focus on it as "not inside the trap".
      const isAside = active === aside
      const isInside = !isAside && active !== null && aside.contains(active)

      // Focus is outside the drawer — or on the dialog surface — so the
      // browser default would walk out of the modal. Pull it back in: Tab
      // enters at the top, Shift+Tab at the bottom (review finding 2).
      if (!isInside) {
        event.preventDefault()
        if (event.shiftKey) last.focus()
        else first.focus()
        return
      }

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeCart])

  // After the exit animation, hide the dialog and return focus to the invoker.
  const handleAnimationComplete = useCallback(() => {
    if (isOpenRef.current) return
    setIsVisible(false)
    restoreFocusRef.current?.focus()
    restoreFocusRef.current = null
  }, [])

  const isHidden = !isVisible
  const isEmpty = items.length === 0

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[var(--z-modal-backdrop)] bg-[var(--overlay)] transition-opacity duration-fast',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeCart}
        aria-hidden="true"
      />
      <motion.aside
        ref={asideRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        aria-hidden={isHidden}
        initial={false}
        animate={{ x: isOpen ? '0%' : '100%' }}
        transition={DRAWER_SPRING}
        onAnimationComplete={handleAnimationComplete}
        className={cn(
          'fixed bottom-0 right-0 top-16 z-[var(--z-modal)] flex w-full max-w-md flex-col',
          'border-l-[3px] border-l-[var(--ink)] bg-[var(--paper)] shadow-[-6px_0_0_var(--ink)]',
          isHidden && 'invisible pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between border-b-2 border-[var(--border)] p-4">
          <h2 id="cart-drawer-title" className="font-display text-xl text-[var(--ink)]">
            Shopping Cart
          </h2>
          <Button variant="ghost" size="sm" onClick={closeCart} aria-label="Close cart">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {isEmpty ? (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-[var(--text-subtle)]" />
              <p className="mb-2 text-base text-[var(--text-muted)]">Your cart is empty</p>
              <Link href="/shop">
                <Button variant="primary" className="mt-4">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {items.map((cartItem) => (
                <CartDrawerItem
                  key={`${cartItem.productId}-${cartItem.width}-${cartItem.height}`}
                  item={cartItem}
                />
              ))}

              {/* Subtotal */}
              <div className="mt-4 space-y-3 border-t-2 border-[var(--border)] pt-4">
                <div className="flex justify-between text-base">
                  <span className="text-[var(--text-muted)]">Subtotal</span>
                  <span className="font-display text-[var(--ink)]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-subtle)]">
                  <span>Estimated Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-subtle)]">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions — the checkout button stays rendered and disables when empty. */}
        <div className="space-y-3 border-t-2 border-[var(--border)] p-4">
          <Link href="/cart" onClick={closeCart}>
            <Button variant="secondary" className="w-full">
              View Cart
            </Button>
          </Link>
          {isEmpty ? (
            <Button variant="primary" className="w-full" size="lg" disabled aria-disabled="true">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Checkout - {formatCurrency(subtotal)}
            </Button>
          ) : (
            <Link href="/checkout" onClick={closeCart}>
              <Button variant="primary" className="w-full" size="lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Checkout - {formatCurrency(subtotal)}
              </Button>
            </Link>
          )}
        </div>
      </motion.aside>
    </>
  )
}

function CartDrawerItem({ item }: { item: CartItem }) {
  const { getItemQuantity, updateQuantity, removeItem } = useCartActions()
  const quantity = getItemQuantity(item.productId, item.width, item.height)

  return (
    <div className="flex gap-3 rounded-md border-2 border-[var(--border)] bg-[var(--paper-raised)] p-3">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 border-[var(--border)]">
        {item.product.images[0] && (
          <Image
            src={item.product.images[0]}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="80px"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/shop/${item.productSlug}`} className="block">
          <h4 className="truncate text-base font-medium text-[var(--ink)]">{item.productName}</h4>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Tag className="h-3 w-3" />
          <span>
            {item.width} × {item.height} cm
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-[var(--ink)]">
            {formatCurrency(item.unitPrice * quantity)}
          </span>
          <CompactQuantitySelector
            quantity={quantity}
            onChange={(q) => updateQuantity(item.productId, item.width, item.height, q)}
            min={1}
            max={999}
          />
        </div>
      </div>
      <button
        onClick={() => removeItem(item.productId, item.width, item.height)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--error)]"
        aria-label="Remove item"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  )
}
