import { describe, it, expect } from 'vitest'
import { priceLine, computeOrderTotals, computeDiscount, type PricingSettings } from '@/lib/pricing'

const settings: PricingSettings = {
  globalTaxPercent: 5,
  taxInclusivePricing: false,
  insideDhakaCharge: 60,
  outsideDhakaCharge: 120,
  freeDeliveryThreshold: 2000,
}

const product = {
  basePrice: 150,
  taxPercent: 5,
  additionalCharge: 0,
  allowedDimensions: [
    { width: 5, height: 5, priceMultiplier: 1 },
    { width: 10, height: 10, priceMultiplier: 2 },
  ],
  allowedQuantities: [
    { minQty: 1, maxQty: 10, pricePerUnit: 150 },
    { minQty: 11, maxQty: 50, pricePerUnit: 120 },
    { minQty: 51, maxQty: null, pricePerUnit: 100 },
  ],
}

describe('priceLine', () => {
  it('uses quantity tier price times dimension multiplier', () => {
    const line = priceLine({ product, width: 10, height: 10, quantity: 20 }, 5)
    expect(line.unitPrice).toBe(240) // 120 * 2
    expect(line.lineTotal).toBe(4800) // 240 * 20
    expect(line.taxAmount).toBe(240) // 5% of 4800
    expect(line.dimensionMatched).toBe(true)
    expect(line.quantityTierMatched).toBe(true)
  })

  it('falls back to base price when no tier matches', () => {
    const line = priceLine({ product: { ...product, allowedQuantities: [] }, width: 5, height: 5, quantity: 3 }, 5)
    expect(line.unitPrice).toBe(150)
    expect(line.quantityTierMatched).toBe(false)
  })

  it('adds additionalCharge once per line', () => {
    const line = priceLine({ product: { ...product, additionalCharge: 20 }, width: 5, height: 5, quantity: 2 }, 5)
    expect(line.lineTotal).toBe(320) // 150*2 + 20
  })

  it('uses global tax percent when product tax is 0', () => {
    const line = priceLine({ product: { ...product, taxPercent: 0 }, width: 5, height: 5, quantity: 1 }, 7)
    expect(line.taxPercent).toBe(7)
    expect(line.taxAmount).toBe(10.5)
  })
})

describe('computeOrderTotals', () => {
  const line = priceLine({ product, width: 5, height: 5, quantity: 10 }, 5) // 1500 + 75 tax

  it('charges inside-dhaka delivery below the free threshold', () => {
    const t = computeOrderTotals([line], 'INSIDE_DHAKA', settings)
    expect(t).toEqual({ subtotal: 1500, taxAmount: 75, deliveryCharge: 60, discountAmount: 0, total: 1635 })
  })

  it('charges outside-dhaka delivery', () => {
    const t = computeOrderTotals([line], 'OUTSIDE_DHAKA', settings)
    expect(t.deliveryCharge).toBe(120)
    expect(t.total).toBe(1695)
  })

  it('free delivery at/above the threshold', () => {
    const big = priceLine({ product, width: 10, height: 10, quantity: 10 }, 5) // 3000 + 150
    const t = computeOrderTotals([big], 'OUTSIDE_DHAKA', settings)
    expect(t.deliveryCharge).toBe(0)
    expect(t.total).toBe(3150)
  })

  it('clamps discount so total never goes negative', () => {
    const t = computeOrderTotals([line], 'INSIDE_DHAKA', settings, 999999)
    expect(t.discountAmount).toBe(1635)
    expect(t.total).toBe(0)
  })
})

describe('computeDiscount', () => {
  it('percent discount', () => {
    expect(computeDiscount({ type: 'percent', value: 10 }, 500)).toBe(50)
  })
  it('fixed discount capped at subtotal', () => {
    expect(computeDiscount({ type: 'fixed', value: 9999 }, 500)).toBe(500)
  })
  it('percent capped at 100', () => {
    expect(computeDiscount({ type: 'percent', value: 150 }, 500)).toBe(500)
  })
  it('null promo = 0', () => {
    expect(computeDiscount(null, 500)).toBe(0)
  })
})
