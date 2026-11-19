import { describe, it, expect } from 'vitest'
import { checkoutSchema, addressSchema, cartItemSchema, orderStatusUpdateSchema } from '@/lib/validations/order'
import { createReviewSchema } from '@/lib/validations/review'
import { createCategorySchema } from '@/lib/validations/category'
import { changePasswordSchema } from '@/lib/validations/profile'
import { registerSchema, updateProfileSchema } from '@/lib/validations/auth'

describe('checkoutSchema', () => {
  it('accepts a valid checkout', () => {
    const r = checkoutSchema.safeParse({ addressId: 'abc', paymentMethod: 'COD', notes: 'hi', promoCode: 'SAVE10' })
    expect(r.success).toBe(true)
  })
  it('rejects unknown payment method', () => {
    expect(checkoutSchema.safeParse({ addressId: 'abc', paymentMethod: 'CRYPTO' }).success).toBe(false)
  })
})

describe('addressSchema', () => {
  const valid = {
    name: 'Test Customer', phone: '+8801700000000', addressLine1: 'House 123, Road 45',
    city: 'Dhaka', district: 'Dhaka', division: 'Dhaka', postalCode: '1207', deliveryZone: 'INSIDE_DHAKA',
  }
  it('accepts valid BD address', () => expect(addressSchema.safeParse(valid).success).toBe(true))
  it('rejects bad phone', () => expect(addressSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false))
  it('rejects bad postal code', () => expect(addressSchema.safeParse({ ...valid, postalCode: '12' }).success).toBe(false))
  it('rejects bad zone', () => expect(addressSchema.safeParse({ ...valid, deliveryZone: 'MOON' }).success).toBe(false))
})

describe('cartItemSchema', () => {
  it('requires positive dimensions and quantity', () => {
    expect(cartItemSchema.safeParse({ productId: 'p1', width: 5, height: 5, quantity: 10 }).success).toBe(true)
    expect(cartItemSchema.safeParse({ productId: 'p1', width: -5, height: 5, quantity: 10 }).success).toBe(false)
    expect(cartItemSchema.safeParse({ productId: 'p1', width: 5, height: 5, quantity: 0 }).success).toBe(false)
  })
})

describe('orderStatusUpdateSchema', () => {
  it('accepts all 10 statuses', () => {
    for (const s of ['PENDING','CONFIRMED','PROCESSING','PRINTING','READY_TO_SHIP','SHIPPED','DELIVERED','CANCELLED','REFUNDED']) {
      expect(orderStatusUpdateSchema.safeParse({ status: s }).success).toBe(true)
    }
    expect(orderStatusUpdateSchema.safeParse({ status: 'LOST' }).success).toBe(false)
  })
})

describe('createReviewSchema', () => {
  it('bounds rating 1-5', () => {
    expect(createReviewSchema.safeParse({ productId: 'p', rating: 5 }).success).toBe(true)
    expect(createReviewSchema.safeParse({ productId: 'p', rating: 0 }).success).toBe(false)
    expect(createReviewSchema.safeParse({ productId: 'p', rating: 6 }).success).toBe(false)
  })
})

describe('category slug', () => {
  it('requires kebab-case', () => {
    expect(createCategorySchema.safeParse({ name: 'Vinyl', slug: 'vinyl-stickers' }).success).toBe(true)
    expect(createCategorySchema.safeParse({ name: 'Vinyl', slug: 'Vinyl Stickers' }).success).toBe(false)
  })
})

describe('changePasswordSchema', () => {
  it('requires 8+ chars with letter and number', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'Password1' }).success).toBe(true)
    expect(changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'short' }).success).toBe(false)
    expect(changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'onlyletters' }).success).toBe(false)
  })
})

describe('optional phone (C1 fix — blank field must not block submission)', () => {
  const base = { name: 'Test User', email: 't@example.com', password: 'Password1', confirmPassword: 'Password1' }
  it('registerSchema accepts an empty/blank phone as absent', () => {
    expect(registerSchema.safeParse({ ...base, phone: '' }).success).toBe(true)
    expect(registerSchema.safeParse({ ...base, phone: '   ' }).success).toBe(true)
    expect(registerSchema.safeParse(base).success).toBe(true)
  })
  it('registerSchema still validates a non-empty phone', () => {
    expect(registerSchema.safeParse({ ...base, phone: '01700000000' }).success).toBe(true)
    expect(registerSchema.safeParse({ ...base, phone: 'abc' }).success).toBe(false)
  })
  it('updateProfileSchema accepts an empty phone (clearing the field)', () => {
    expect(updateProfileSchema.safeParse({ phone: '' }).success).toBe(true)
    expect(updateProfileSchema.safeParse({ phone: '01700000000' }).success).toBe(true)
    expect(updateProfileSchema.safeParse({ phone: 'nope' }).success).toBe(false)
  })
})
