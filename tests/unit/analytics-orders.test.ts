/**
 * B2 — /api/analytics/orders must return a real `today` block
 * (todayOrders / todayRevenue), not leave the analytics page hardcoding 0.
 *
 * Route-handler coverage against mocked auth + Prisma (category-api pattern):
 *   - admin gets distribution/total/pending unchanged PLUS today.{orders,revenue}
 *   - today.revenue coerces the serialized Decimal string to a number and
 *     excludes CANCELLED/REFUNDED (same paid definition as the revenue route)
 *   - today.orders counts every order created today regardless of status
 *   - unauthenticated → 401, non-admin → 403
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  order: {
    groupBy: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: { order: mocks.order } }))

import { GET } from '@/app/api/analytics/orders/route'

const ADMIN_SESSION = { user: { id: 'u-admin', email: 'admin@example.com', role: 'ADMIN' } }
const CUSTOMER_SESSION = { user: { id: 'u-cust', email: 'cust@example.com', role: 'CUSTOMER' } }

const req = () => new Request('http://localhost/api/analytics/orders?range=30d')

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue(ADMIN_SESSION)
  mocks.order.groupBy.mockResolvedValue([
    { status: 'PENDING', _count: { _all: 2 } },
    { status: 'DELIVERED', _count: { _all: 5 } },
    { status: 'CANCELLED', _count: { _all: 1 } },
  ])
  mocks.order.count.mockResolvedValue(3)
  mocks.order.aggregate.mockResolvedValue({ _sum: { total: '1500.50' } })
})

describe('GET /api/analytics/orders — today block (B2)', () => {
  it('returns today.orders and today.revenue alongside the existing shape', async () => {
    const res = await GET(req())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    // Existing contract preserved
    expect(json.data.total).toBe(8)
    expect(json.data.pending).toBe(2)
    expect(json.data.distribution).toEqual({ PENDING: 2, DELIVERED: 5, CANCELLED: 1 })
    // New: real today aggregate, Decimal coerced to number
    expect(json.data.today).toEqual({ orders: 3, revenue: 1500.5 })
  })

  it('counts every order created today regardless of status', async () => {
    await GET(req())
    const countWhere = mocks.order.count.mock.calls[0][0].where
    expect(countWhere.createdAt.gte).toBeInstanceOf(Date)
    expect(countWhere.status).toBeUndefined()
    // local midnight
    const start = countWhere.createdAt.gte as Date
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
  })

  it('excludes CANCELLED/REFUNDED from today.revenue (paid definition)', async () => {
    await GET(req())
    const aggWhere = mocks.order.aggregate.mock.calls[0][0].where
    expect(aggWhere.status.notIn).toEqual(expect.arrayContaining(['CANCELLED', 'REFUNDED']))
  })

  it('returns revenue 0 when there are no paid orders today', async () => {
    mocks.order.aggregate.mockResolvedValue({ _sum: { total: null } })
    const json = await (await GET(req())).json()
    expect(json.data.today.revenue).toBe(0)
  })

  it('rejects an unauthenticated caller with 401', async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await GET(req())).status).toBe(401)
  })

  it('rejects a non-admin caller with 403', async () => {
    mocks.auth.mockResolvedValue(CUSTOMER_SESSION)
    expect((await GET(req())).status).toBe(403)
  })
})