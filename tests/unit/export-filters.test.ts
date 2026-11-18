/**
 * Export filter validation (2026-11-19 review follow-up).
 *
 * Unknown statuses and malformed dates used to reach Prisma as `status as
 * never` / `new Date(garbage)` and 500 deep in the query. They must be 400s
 * at the edge; valid filters must pass through unchanged.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  order: { findMany: vi.fn() },
  customRequest: { findMany: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({
  prisma: { order: mocks.order, customRequest: mocks.customRequest },
}))

import { GET as getOrdersExport } from '@/app/api/orders/export/route'
import { GET as getCustomRequestsExport } from '@/app/api/custom-requests/export/route'

const ADMIN_SESSION = { user: { id: 'u-admin', email: 'admin@example.com', role: 'ADMIN' } }

function orderReq(query = ''): Request {
  return new Request(`http://localhost/api/orders/export${query}`, { method: 'GET' })
}
function crReq(query = ''): Request {
  return new Request(`http://localhost/api/custom-requests/export${query}`, { method: 'GET' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue(ADMIN_SESSION)
  mocks.order.findMany.mockResolvedValue([])
  mocks.customRequest.findMany.mockResolvedValue([])
})

describe('GET /api/orders/export filters', () => {
  it('rejects an unknown status with 400 VALIDATION', async () => {
    const res = await getOrdersExport(orderReq('?status=TELEPORTED'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION')
    expect(mocks.order.findMany).not.toHaveBeenCalled()
  })

  it('rejects a malformed date with 400 VALIDATION', async () => {
    const res = await getOrdersExport(orderReq('?dateFrom=not-a-date'))
    expect(res.status).toBe(400)
    expect(mocks.order.findMany).not.toHaveBeenCalled()
  })

  it('passes a valid status and date range through to the query', async () => {
    const res = await getOrdersExport(orderReq('?status=SHIPPED&dateFrom=2026-01-01&dateTo=2026-02-01'))
    expect(res.status).toBe(200)
    const where = mocks.order.findMany.mock.calls[0][0].where
    expect(where.status).toBe('SHIPPED')
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01'))
    expect(where.createdAt.lte).toEqual(new Date('2026-02-01'))
  })

  it('treats empty filter params as absent', async () => {
    const res = await getOrdersExport(orderReq('?status=&dateFrom='))
    expect(res.status).toBe(200)
    const where = mocks.order.findMany.mock.calls[0][0].where
    expect(where.status).toBeUndefined()
    expect(where.createdAt).toBeUndefined()
  })
})

describe('GET /api/custom-requests/export filters', () => {
  it('rejects an unknown status with 400 VALIDATION', async () => {
    const res = await getCustomRequestsExport(crReq('?status=TELEPORTED'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION')
    expect(mocks.customRequest.findMany).not.toHaveBeenCalled()
  })

  it('passes a valid status through to the query', async () => {
    const res = await getCustomRequestsExport(crReq('?status=PRICED'))
    expect(res.status).toBe(200)
    const where = mocks.customRequest.findMany.mock.calls[0][0].where
    expect(where.status).toBe('PRICED')
  })

  it('rejects an over-long search term with 400', async () => {
    const res = await getCustomRequestsExport(crReq(`?search=${'x'.repeat(201)}`))
    expect(res.status).toBe(400)
    expect(mocks.customRequest.findMany).not.toHaveBeenCalled()
  })
})
