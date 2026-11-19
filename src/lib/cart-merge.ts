/**
 * E7 — guest cart continuity. Pure merge of a server cart with guest (local)
 * items: dedupe by product + variant (width/height), sum quantities, cap by
 * available stock. No side effects — unit-tested in isolation; the sync hook
 * uses it to reconcile guest items into the server cart on sign-in.
 */

export interface MergeableCartItem {
  productId: string
  width: number
  height: number
  quantity: number
  customization?: Record<string, unknown> | null
}

const keyOf = (i: { productId: string; width: number; height: number }) =>
  `${i.productId}|${i.width}|${i.height}`

/**
 * Merge `incoming` (guest) items into `existing` (server) items.
 * - Same product+variant → quantities summed (existing item kept, quantity updated).
 * - New product+variant → appended.
 * - `stockByProduct` (productId → available stock, only for tracked products)
 *   caps the merged quantity; untracked products (absent from the map) are uncapped.
 * Returns a new array; inputs are not mutated. Existing order is preserved first.
 */
export function mergeCartItems<T extends MergeableCartItem>(
  existing: T[],
  incoming: T[],
  stockByProduct?: Record<string, number>
): T[] {
  const byKey = new Map<string, T>()
  for (const item of existing) byKey.set(keyOf(item), { ...item })

  for (const item of incoming) {
    const key = keyOf(item)
    const found = byKey.get(key)
    if (found) {
      byKey.set(key, { ...found, quantity: found.quantity + item.quantity })
    } else {
      byKey.set(key, { ...item })
    }
  }

  const merged = Array.from(byKey.values())
  if (stockByProduct) {
    for (let i = 0; i < merged.length; i++) {
      const stock = stockByProduct[merged[i].productId]
      if (typeof stock === 'number') {
        merged[i] = { ...merged[i], quantity: Math.max(0, Math.min(merged[i].quantity, stock)) }
      }
    }
  }
  return merged
}
