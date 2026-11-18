import { describe, it, expect } from 'vitest'
import {
  updateCustomRequestStatusSchema,
  createOrderFromRequestSchema,
  customRequestFilterSchema,
} from '@/lib/validations/custom-request'

describe('REVISION_REQUESTED status', () => {
  it('is a valid status update', () => {
    const result = updateCustomRequestStatusSchema.safeParse({
      status: 'REVISION_REQUESTED',
      adminNotes: 'Please thicken the outlines',
    })
    expect(result.success).toBe(true)
  })

  it('is a valid list filter', () => {
    expect(customRequestFilterSchema.safeParse({ status: 'REVISION_REQUESTED' }).success).toBe(true)
  })

  it('still rejects unknown statuses', () => {
    expect(updateCustomRequestStatusSchema.safeParse({ status: 'SHIPPED' }).success).toBe(false)
  })
})

describe('createOrderFromRequestSchema', () => {
  const valid = {
    productId: 'p1',
    addressId: 'a1',
    width: 5,
    height: 5,
    quantity: 10,
    paymentMethod: 'COD' as const,
  }

  it('accepts a complete payload and defaults payment to COD', () => {
    const result = createOrderFromRequestSchema.safeParse({ ...valid, paymentMethod: undefined })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.paymentMethod).toBe('COD')
  })

  it('requires a product and an address', () => {
    expect(createOrderFromRequestSchema.safeParse({ ...valid, productId: '' }).success).toBe(false)
    expect(createOrderFromRequestSchema.safeParse({ ...valid, addressId: '' }).success).toBe(false)
  })

  it('rejects non-positive dimensions and unknown payment methods', () => {
    expect(createOrderFromRequestSchema.safeParse({ ...valid, width: 0 }).success).toBe(false)
    expect(createOrderFromRequestSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false)
    expect(createOrderFromRequestSchema.safeParse({ ...valid, paymentMethod: 'CRYPTO' }).success).toBe(false)
  })

  it('rejects a dimension over 100cm', () => {
    expect(createOrderFromRequestSchema.safeParse({ ...valid, width: 101 }).success).toBe(false)
  })
})
