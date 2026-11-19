// E7 — pure guest/server cart merge: dedupe by product+variant, sum quantities,
// cap by stock, no mutation, existing order preserved.

import { describe, expect, it } from 'vitest'
import { mergeCartItems, type MergeableCartItem } from '@/lib/cart-merge'

const item = (productId: string, width: number, height: number, quantity: number): MergeableCartItem =>
  ({ productId, width, height, quantity })

describe('mergeCartItems', () => {
  it('appends new guest items to an empty server cart', () => {
    const merged = mergeCartItems([], [item('p1', 5, 5, 2)])
    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ productId: 'p1', quantity: 2 })
  })

  it('keeps server items when there are no guest items', () => {
    const merged = mergeCartItems([item('p1', 5, 5, 3)], [])
    expect(merged).toHaveLength(1)
    expect(merged[0].quantity).toBe(3)
  })

  it('sums quantities for the same product+variant (no duplicate rows)', () => {
    const merged = mergeCartItems([item('p1', 5, 5, 3)], [item('p1', 5, 5, 2)])
    expect(merged).toHaveLength(1)
    expect(merged[0].quantity).toBe(5)
  })

  it('treats different variants of the same product as distinct rows', () => {
    const merged = mergeCartItems([item('p1', 5, 5, 1)], [item('p1', 10, 10, 1)])
    expect(merged).toHaveLength(2)
  })

  it('merges a mix of overlapping and new items, preserving server order first', () => {
    const merged = mergeCartItems(
      [item('p1', 5, 5, 1), item('p2', 5, 5, 1)],
      [item('p2', 5, 5, 4), item('p3', 5, 5, 2)]
    )
    expect(merged.map((i) => i.productId)).toEqual(['p1', 'p2', 'p3'])
    expect(merged.find((i) => i.productId === 'p2')!.quantity).toBe(5)
  })

  it('caps merged quantity by available stock for tracked products', () => {
    const merged = mergeCartItems([item('p1', 5, 5, 4)], [item('p1', 5, 5, 4)], { p1: 6 })
    expect(merged[0].quantity).toBe(6)
  })

  it('does not cap untracked products (absent from the stock map)', () => {
    const merged = mergeCartItems([item('p1', 5, 5, 4)], [item('p1', 5, 5, 4)], { p2: 1 })
    expect(merged[0].quantity).toBe(8)
  })

  it('caps to zero when stock is zero', () => {
    const merged = mergeCartItems([], [item('p1', 5, 5, 3)], { p1: 0 })
    expect(merged[0].quantity).toBe(0)
  })

  it('does not mutate the input arrays', () => {
    const existing = [item('p1', 5, 5, 1)]
    const incoming = [item('p1', 5, 5, 2)]
    mergeCartItems(existing, incoming)
    expect(existing[0].quantity).toBe(1)
    expect(incoming[0].quantity).toBe(2)
  })
})
