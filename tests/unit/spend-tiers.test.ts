import { describe, it, expect } from 'vitest'
import { SPEND_TIERS, isSpendTierLabel, resolveSpendTier } from '@/lib/spend-tiers'

describe('resolveSpendTier', () => {
  it('bands lifetime spend into the matching tier', () => {
    expect(resolveSpendTier(0)).toBe('New')
    expect(resolveSpendTier(999.99)).toBe('New')
    expect(resolveSpendTier(1000)).toBe('Bronze')
    expect(resolveSpendTier(4999)).toBe('Bronze')
    expect(resolveSpendTier(5000)).toBe('Silver')
    expect(resolveSpendTier(19999)).toBe('Silver')
    expect(resolveSpendTier(20000)).toBe('Gold')
    expect(resolveSpendTier(49999)).toBe('Gold')
    expect(resolveSpendTier(50000)).toBe('VIP')
    expect(resolveSpendTier(150000)).toBe('VIP')
  })

  it('prefers a stored override when it is a known label', () => {
    expect(resolveSpendTier(0, 'Gold')).toBe('Gold')
    expect(resolveSpendTier(99999, 'VIP')).toBe('VIP')
  })

  it('ignores an unknown override and falls back to the spend band', () => {
    expect(resolveSpendTier(100, 'Platinum')).toBe('New')
    expect(resolveSpendTier(100, null)).toBe('New')
    expect(resolveSpendTier(100, undefined)).toBe('New')
  })

  it('exposes every tier label to the type guard', () => {
    for (const tier of SPEND_TIERS) expect(isSpendTierLabel(tier.label)).toBe(true)
    expect(isSpendTierLabel('')).toBe(false)
    expect(isSpendTierLabel('gold')).toBe(false)
  })
})
