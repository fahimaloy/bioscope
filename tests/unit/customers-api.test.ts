/**
 * Route-handler coverage for the admin-guarded GET /api/customers list and its
 * optional filters (task: wire the dead admin filter UI).
 *
 * Auth and Prisma are mocked so the guard clauses and the filter translation
 * into a Prisma where-clause are exercised in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  user: { findMany: vi.fn(), count: vi.fn() },
  order: { groupBy: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: mocks.user, order: mocks.order } }))

import { GET } from '@/app/api/customers/route'

const ADMIN_SESSION = { user: { id: 'u-admin', email: 'admin@example.com', role: 'ADMIN' } }
const CUSTOMER_SESSION = { user: { id: 'u-cust', email: 'cust@example.com', role: 'CUSTOMER' } }

function req(query = ''): Request {
  return new Request(`http://localhost/api/customers${query}`, { method: 'GET' })
}

const USER_ROW = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  phone: null,
  avatar: null,
  spendTier: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  _count: { orders: 1 },
  orders: [{ total: 5000 }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.user.findMany.mockResolvedValue([USER_ROW])
  mocks.user.count.mockResolvedValue(1)
  mocks.order.groupBy.mockResolvedValue([{ userId: 'u1' }])
})

describe('GET /api/customers (admin guard)', () => {
  it('rejects an unauthenticated caller with 401 UNAUTHENTICATED', async () => {
    mocks.auth.mockResolvedValue(null)
    const res = await GET(req())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.code).toBe('UNAUTHENTICATED')
    expect(mocks.user.findMany).not.toHaveBeenCalled()
  })

  it('rejects a non-admin caller with 403 FORBIDDEN', async () => {
    mocks.auth.mockResolvedValue(CUSTOMER_SESSION)
    const res = await GET(req())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.code).toBe('FORBIDDEN')
    expect(mocks.user.findMany).not.toHaveBeenCalled()
  })
})

describe('GET /api/customers filters', () => {
  it('passes the search term to the where clause', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    const res = await GET(req('?search=ada'))
    expect(res.status).toBe(200)
    const where = mocks.user.findMany.mock.calls[0][0].where
    expect(where.OR).toEqual([
      { name: { contains: 'ada', mode: 'insensitive' } },
      { email: { contains: 'ada', mode: 'insensitive' } },
      { phone: { contains: 'ada', mode: 'insensitive' } },
    ])
  })

  it('filters by join date (inclusive)', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    const res = await GET(req('?dateFrom=2026-01-01'))
    expect(res.status).toBe(200)
    const where = mocks.user.findMany.mock.calls[0][0].where
    expect(where.createdAt).toEqual({ gte: new Date('2026-01-01') })
  })

  it('resolves the spend tier from lifetime spend before paging', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    mocks.user.findMany
      .mockResolvedValueOnce([{ id: 'u1', spendTier: null, orders: [{ total: 25000 }] }])
      .mockResolvedValueOnce([USER_ROW])

    const res = await GET(req('?spendTier=Gold'))
    expect(res.status).toBe(200)

    const filterCall = mocks.user.findMany.mock.calls[0][0]
    expect(filterCall.where).toEqual({ role: 'CUSTOMER' })
    expect(filterCall.select.orders).toEqual({ select: { total: true } })

    const pageWhere = mocks.user.findMany.mock.calls[1][0].where
    expect(pageWhere.id).toEqual({ in: ['u1'] })
  })

  it('constrains to an empty id list when no customer is in the tier', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    mocks.user.findMany
      .mockResolvedValueOnce([{ id: 'u1', spendTier: null, orders: [{ total: 10 }] }])
      .mockResolvedValueOnce([])

    const res = await GET(req('?spendTier=VIP'))
    expect(res.status).toBe(200)
    const pageWhere = mocks.user.findMany.mock.calls[1][0].where
    expect(pageWhere.id).toEqual({ in: [] })
  })

  it('filters by minimum order count', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    const res = await GET(req('?minOrders=2'))
    expect(res.status).toBe(200)
    expect(mocks.order.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ having: { userId: { _count: { gte: 2 } } } })
    )
    const where = mocks.user.findMany.mock.calls[0][0].where
    expect(where.id).toEqual({ in: ['u1'] })
  })

  it('rejects an unknown tier with 400 VALIDATION', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    const res = await GET(req('?spendTier=Platinum'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.code).toBe('VALIDATION')
    expect(mocks.user.findMany).not.toHaveBeenCalled()
  })

  it('rejects a malformed date with 400 VALIDATION', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    const res = await GET(req('?dateFrom=not-a-date'))
    expect(res.status).toBe(400)
    expect(mocks.user.findMany).not.toHaveBeenCalled()
  })

  it('rejects a negative minimum order count with 400 VALIDATION', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    const res = await GET(req('?minOrders=-1'))
    expect(res.status).toBe(400)
    expect(mocks.user.findMany).not.toHaveBeenCalled()
  })
})
