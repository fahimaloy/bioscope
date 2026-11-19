/**
 * C4 / rebuild task 2.13 — public track-order lookup.
 *
 * Real route handler + real action, mocked prisma (B3/E1 pattern). Covers:
 *   - number+email and number+phone matches return the narrow PII-free shape
 *   - Decimals coerced to numbers at the boundary (decimal-boundary audit)
 *   - any miss → the SAME generic 404 (no order-number enumeration)
 *   - Zod validation at the edge (400 with field errors via handleRouteError)
 *   - rate limit: 5/min/IP → 429 + Retry-After; per-IP isolation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  order: { findFirst: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => null) }))
vi.mock('@/lib/prisma', () => ({ prisma: { order: mocks.order } }))

import { POST } from '@/app/api/orders/track/route'
import { trackOrder } from '@/lib/actions/trackOrder'
import { resetRateLimits } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

// Serialized Decimals arrive as strings (Prisma JSON boundary).
const dbOrder = {
  orderNumber: 'ORD-20261119-0001',
  status: 'SHIPPED',
  createdAt: new Date('2026-11-19T10:00:00Z'),
  shippedAt: new Date('2026-11-20T09:00:00Z'),
  deliveredAt: null,
  trackingNumber: 'TRK-123',
  total: '480.00',
  currency: 'BDT',
  items: [
    { productName: 'Kraft Paper Label Stickers', quantity: 2, width: 4, height: 4, totalPrice: '160.00' },
  ],
}

function req(body: unknown, ip = '203.0.113.7') {
  return new NextRequest('http://localhost:3000/api/orders/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const valid = { orderNumber: 'ORD-20261119-0001', email: 'buyer@example.com' }

beforeEach(() => {
  vi.clearAllMocks()
  resetRateLimits()
  mocks.order.findFirst.mockResolvedValue(dbOrder)
})

describe('trackOrder action', () => {
  it('returns the narrow shape with Decimals coerced and dates ISO', async () => {
    const result = await trackOrder(valid)
    expect(result.total).toBe(480)
    expect(typeof result.total).toBe('number')
    expect(result.items[0].totalPrice).toBe(160)
    expect(result.placedAt).toBe('2026-11-19T10:00:00.000Z')
    expect(result.shippedAt).toBe('2026-11-20T09:00:00.000Z')
    expect(result.deliveredAt).toBeNull()
    expect(result.status).toBe('SHIPPED')
  })

  it('leaks no PII: only the whitelisted keys exist', async () => {
    const result = await trackOrder(valid)
    expect(Object.keys(result).sort()).toEqual(
      ['currency', 'deliveredAt', 'items', 'orderNumber', 'placedAt', 'shippedAt', 'status', 'total', 'trackingNumber'].sort()
    )
    expect(Object.keys(result.items[0]).sort()).toEqual(['height', 'name', 'quantity', 'totalPrice', 'width'])
  })

  it('queries by orderNumber AND (account email OR shipping phone)', async () => {
    await trackOrder({ orderNumber: 'ORD-20261119-0001', phone: '01700000000' })
    const where = mocks.order.findFirst.mock.calls[0][0].where
    expect(where.orderNumber).toBe('ORD-20261119-0001')
    expect(where.OR).toEqual([{ shippingPhone: '01700000000' }])
    await trackOrder(valid)
    const where2 = mocks.order.findFirst.mock.calls[1][0].where
    expect(where2.OR).toEqual([{ user: { email: 'buyer@example.com' } }])
  })

  it('lowercases the email before matching', async () => {
    await trackOrder({ ...valid, email: 'Buyer@Example.COM' })
    expect(mocks.order.findFirst.mock.calls[0][0].where.OR).toEqual([{ user: { email: 'buyer@example.com' } }])
  })

  it('throws a generic 404 on any miss (no enumeration)', async () => {
    mocks.order.findFirst.mockResolvedValue(null)
    await expect(trackOrder(valid)).rejects.toMatchObject({ status: 404, code: 'ORDER_NOT_FOUND' })
    await expect(trackOrder(valid)).rejects.toThrow(/No order found with those details/)
  })

  it('rejects when neither email nor phone is given', async () => {
    await expect(trackOrder({ orderNumber: 'ORD-20261119-0001' })).rejects.toThrow()
    expect(mocks.order.findFirst).not.toHaveBeenCalled()
  })

  it('treats empty-string email/phone as absent (form behaviour)', async () => {
    await expect(trackOrder({ orderNumber: 'ORD-123', email: '', phone: '' })).rejects.toThrow()
  })
})

describe('POST /api/orders/track', () => {
  it('returns 200 { success, data } for a match', async () => {
    const res = await POST(req(valid))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.orderNumber).toBe('ORD-20261119-0001')
    expect(json.data.total).toBe(480)
  })

  it('returns the generic 404 envelope on a miss', async () => {
    mocks.order.findFirst.mockResolvedValue(null)
    const res = await POST(req(valid))
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('ORDER_NOT_FOUND')
    expect(json.error).toMatch(/No order found with those details/)
  })

  it('returns 400 with field errors for invalid input', async () => {
    const res = await POST(req({ orderNumber: 'x' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.code).toBe('VALIDATION')
    expect(json.details.orderNumber).toBeTruthy()
  })

  it('returns 400 for a malformed JSON body', async () => {
    const res = await POST(req('{not json'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.code).toBe('INVALID_BODY')
  })

  it('rate-limits: 6th lookup in a minute from one IP is 429 + Retry-After', async () => {
    mocks.order.findFirst.mockResolvedValue(null)
    for (let i = 0; i < 5; i++) {
      const res = await POST(req(valid))
      expect(res.status, `request ${i + 1}`).toBe(404)
    }
    const limited = await POST(req(valid))
    expect(limited.status).toBe(429)
    expect(limited.headers.get('Retry-After')).toBeTruthy()
    const json = await limited.json()
    expect(json.code).toBe('RATE_LIMITED')
  })

  it('isolates the limit per IP', async () => {
    mocks.order.findFirst.mockResolvedValue(null)
    for (let i = 0; i < 5; i++) await POST(req(valid, '203.0.113.7'))
    const other = await POST(req(valid, '203.0.113.8'))
    expect(other.status).toBe(404)
  })
})
