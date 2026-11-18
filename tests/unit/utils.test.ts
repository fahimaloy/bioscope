import { describe, it, expect } from 'vitest'
import { calculateTax, getDeliveryCharge, slugify, generateOrderNumber, formatCurrency, truncate, safeCallbackUrl } from '@/lib/utils'

describe('calculateTax', () => {
  it('exclusive tax', () => {
    expect(calculateTax(100, 5)).toBe(5)
    expect(calculateTax(150, 5)).toBe(7.5)
  })
  it('inclusive tax extracts the tax portion', () => {
    expect(calculateTax(105, 5, true)).toBe(5)
  })
})

describe('getDeliveryCharge', () => {
  const base = { insideDhakaCharge: 60, outsideDhakaCharge: 120, freeDeliveryThreshold: 2000 }
  it('zone pricing', () => {
    expect(getDeliveryCharge('INSIDE_DHAKA', { ...base, subtotal: 100 })).toBe(60)
    expect(getDeliveryCharge('OUTSIDE_DHAKA', { ...base, subtotal: 100 })).toBe(120)
  })
  it('free above threshold', () => {
    expect(getDeliveryCharge('OUTSIDE_DHAKA', { ...base, subtotal: 2000 })).toBe(0)
  })
})

describe('misc utils', () => {
  it('slugify', () => {
    expect(slugify('  Hello World!  ')).toBe('hello-world')
    expect(slugify('Custom Logo—Vinyl')).toBe('custom-logo-vinyl')
  })
  it('order number format', () => {
    expect(generateOrderNumber()).toMatch(/^ORD-\d{8}-\d{4}$/)
  })
  it('currency formatting BDT', () => {
    expect(formatCurrency(1500, 'BDT')).toContain('1,500')
  })
  it('truncate', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
    expect(truncate('hi', 5)).toBe('hi')
  })
})

describe('safeCallbackUrl', () => {
  it('keeps relative paths', () => {
    expect(safeCallbackUrl('/checkout')).toBe('/checkout')
    expect(safeCallbackUrl('/shop/kraft-paper-label-stickers')).toBe('/shop/kraft-paper-label-stickers')
  })
  it('defaults to / when absent', () => {
    expect(safeCallbackUrl(null)).toBe('/')
    expect(safeCallbackUrl(undefined)).toBe('/')
    expect(safeCallbackUrl('')).toBe('/')
  })
  it('blocks open-redirect shapes', () => {
    expect(safeCallbackUrl('https://evil.example')).toBe('/')
    expect(safeCallbackUrl('//evil.example')).toBe('/')
    expect(safeCallbackUrl('/\\evil.example')).toBe('/')
    expect(safeCallbackUrl('javascript:alert(1)')).toBe('/')
  })
})
