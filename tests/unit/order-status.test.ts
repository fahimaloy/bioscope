import { describe, it, expect } from 'vitest'
import { canTransition, ORDER_STATUS_TRANSITIONS, CUSTOMER_CANCELLABLE, ORDER_STATUS_LABELS } from '@/lib/order-status'

describe('order status state machine', () => {
  it('follows the happy path PENDING -> ... -> DELIVERED', () => {
    const path = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PRINTING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'] as const
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true)
    }
  })

  it('never allows leaving CANCELLED or REFUNDED', () => {
    expect(ORDER_STATUS_TRANSITIONS.CANCELLED).toEqual([])
    expect(ORDER_STATUS_TRANSITIONS.REFUNDED).toEqual([])
    expect(canTransition('CANCELLED', 'PENDING')).toBe(false)
  })

  it('forbids skipping from PENDING to SHIPPED', () => {
    expect(canTransition('PENDING', 'SHIPPED')).toBe(false)
    expect(canTransition('SHIPPED', 'PENDING')).toBe(false)
  })

  it('allows DELIVERED -> REFUNDED only', () => {
    expect(canTransition('DELIVERED', 'REFUNDED')).toBe(true)
    expect(canTransition('DELIVERED', 'SHIPPED')).toBe(false)
  })

  it('customers can cancel only early statuses', () => {
    expect(CUSTOMER_CANCELLABLE).toContain('PENDING')
    expect(CUSTOMER_CANCELLABLE).not.toContain('SHIPPED')
    expect(CUSTOMER_CANCELLABLE).not.toContain('DELIVERED')
  })

  it('every status has a label', () => {
    for (const s of Object.keys(ORDER_STATUS_TRANSITIONS)) {
      expect(ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS]).toBeTruthy()
    }
  })
})
