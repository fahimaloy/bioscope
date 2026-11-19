/**
 * Customer CSV export (2026-11-19 review follow-up).
 *
 * Two regressions pinned here:
 * 1. Formula injection — customer-supplied name/phone starting = + - @ must
 *    be neutralised by the shared escapeCsvCell (the old local escape only
 *    did RFC4180 quoting).
 * 2. Memory — lifetime spend comes from a database groupBy aggregate, never
 *    from loading every order row per exported user.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  user: { findMany: vi.fn() },
  order: { groupBy: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: mocks.user, order: mocks.order } }))

import { GET } from '@/app/api/customers/export/route'

const ADMIN_SESSION = { user: { id: 'u-admin', email: 'admin@example.com', role: 'ADMIN' } }

function req(query = ''): Request {
  return new Request(`http://localhost/api/customers/export${query}`, { method: 'GET' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue(ADMIN_SESSION)
  mocks.order.groupBy.mockResolvedValue([{ userId: 'u1', _sum: { total: '150.50' } }])
  mocks.user.findMany.mockResolvedValue([
    {
      id: 'u1',
      name: '=HYPERLINK("http://evil.example","click")',
      email: 'ada@example.com',
      phone: '+8801700000000',
      spendTier: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      _count: { orders: 2 },
    },
  ])
})

describe('GET /api/customers/export', () => {
  it('rejects an unauthenticated caller with 401', async () => {
    mocks.auth.mockResolvedValue(null)
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(mocks.user.findMany).not.toHaveBeenCalled()
  })

  it('neutralises spreadsheet formula injection in customer-supplied cells', async () => {
    const res = await GET(req())
    expect(res.status).toBe(200)
    const csv = await res.text()
    // The dangerous cell is prefixed with a single quote (literal in Excel).
    expect(csv).toContain("'=HYPERLINK")
    expect(csv).not.toMatch(/(^|,)=HYPERLINK/)
  })

  it('reads lifetime spend from the database aggregate, not order rows', async () => {
    const res = await GET(req())
    expect(res.status).toBe(200)
    const csv = await res.text()
    expect(csv).toContain('150.50')
    expect(mocks.order.groupBy).toHaveBeenCalledWith({ by: ['userId'], _sum: { total: true } })
    const select = mocks.user.findMany.mock.calls[0][0].select
    expect(select.orders).toBeUndefined()
  })

  it('exports zero spend for a customer with no orders', async () => {
    mocks.order.groupBy.mockResolvedValue([])
    const res = await GET(req())
    const csv = await res.text()
    expect(csv).toContain('0.00')
  })
})
