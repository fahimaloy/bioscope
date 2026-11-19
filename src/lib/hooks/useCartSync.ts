'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCartStore } from '@/lib/stores/cartStore'
import { mergeCartItems, type MergeableCartItem } from '@/lib/cart-merge'
import type { CartItem } from '@/types'

const keyOf = (i: { productId: string; width: number; height: number }) =>
  `${i.productId}|${i.width}|${i.height}`

/** Map a server cart item (GET /api/cart) to the client CartItem shape. */
function serverToClient(item: Record<string, unknown>, cartId: string): CartItem {
  const product = (item.product ?? {}) as Record<string, unknown>
  const images = (product.images as string[] | undefined) ?? []
  return {
    id: String(item.id),
    cartId,
    productId: String(item.productId),
    product: product as unknown as CartItem['product'],
    productName: String(product.name ?? ''),
    productSlug: String(product.slug ?? ''),
    productImage: images[0] ?? null,
    unitPrice: Number(item.unitPrice ?? 0),
    width: Number(item.width),
    height: Number(item.height),
    quantity: Number(item.quantity),
    customization: (item.customization as Record<string, unknown> | null) ?? null,
    createdAt: new Date(String(item.createdAt)),
    updatedAt: new Date(String(item.updatedAt)),
  }
}

/**
 * E7 — guest cart continuity. The client cart is localStorage (guest items
 * survive a login redirect on their own), but the server cart is the persisted
 * source of truth. On the guest→authenticated transition this merges any local
 * guest items into the server cart (dedupe by product+variant, sum quantities
 * capped by stock via mergeCartItems), writes the merged set back with mode
 * 'set' (the server upsert guarantees no duplicate rows), and hydrates the
 * client store with the merged result. Any failure leaves the guest items
 * untouched (still 'local') so nothing is lost and the next login retries.
 */
export function useCartSync() {
  const { isAuthenticated } = useAuth()
  const items = useCartStore((s) => s.items)
  const setItems = useCartStore((s) => s.setItems)
  const wasAuthenticated = useRef<boolean | null>(null)
  const syncing = useRef(false)

  useEffect(() => {
    const prev = wasAuthenticated.current
    wasAuthenticated.current = isAuthenticated
    // Only act on the guest → authenticated transition, once.
    if (!isAuthenticated || prev === true || prev === null || syncing.current) return

    const guestItems = items.filter((i) => i.cartId === 'local')
    if (guestItems.length === 0) return

    syncing.current = true
    void (async () => {
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        const cartId = String(json?.data?.cart?.id ?? 'server')
        const serverRaw = (json?.data?.cart?.items ?? []) as Record<string, unknown>[]
        const serverItems = serverRaw.map((i) => serverToClient(i, cartId))

        const stockByProduct: Record<string, number> = {}
        for (const s of serverItems) {
          const p = s.product as unknown as { trackInventory?: boolean; stock?: number }
          if (p?.trackInventory && typeof p.stock === 'number') stockByProduct[s.productId] = p.stock
        }
        for (const g of guestItems) {
          const p = g.product as unknown as { trackInventory?: boolean; stock?: number }
          if (p?.trackInventory && typeof p.stock === 'number' && stockByProduct[g.productId] === undefined) {
            stockByProduct[g.productId] = p.stock
          }
        }

        const toMergeable = (i: CartItem): MergeableCartItem =>
          ({ productId: i.productId, width: i.width, height: i.height, quantity: i.quantity, customization: i.customization })
        const merged = mergeCartItems(serverItems.map(toMergeable), guestItems.map(toMergeable), stockByProduct)

        // Persist the merged set server-side (mode 'set' = exact quantity; upsert dedupes).
        for (const m of merged) {
          const post = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: m.productId, width: m.width, height: m.height, quantity: m.quantity, customization: m.customization ?? undefined, mode: 'set' }),
          })
          if (!post.ok) return // abort; keep guest items intact
        }

        // Hydrate the client with merged quantities, preserving full item shape.
        const fullByKey = new Map<string, CartItem>()
        for (const s of serverItems) fullByKey.set(keyOf(s), s)
        for (const g of guestItems) fullByKey.set(keyOf(g), g) // guest shape wins for display
        const mergedFull = merged.map((m) => {
          const full = fullByKey.get(keyOf(m))!
          return { ...full, quantity: m.quantity, cartId }
        })
        setItems(mergedFull)
      } catch {
        // Network/shape failure — guest items remain 'local'; retry next login.
      } finally {
        syncing.current = false
      }
    })()
  }, [isAuthenticated, items, setItems])
}
