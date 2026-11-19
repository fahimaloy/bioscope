// D5 — /api/health: 200 {status:ok,db:up} when the DB probe succeeds, 503
// {status:degraded,db:down} when it fails; never throws.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: mocks.queryRaw } }))

import { GET } from '@/app/api/health/route'

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.restoreAllMocks() })

describe('GET /api/health', () => {
  it('200 ok when the DB probe succeeds', async () => {
    mocks.queryRaw.mockResolvedValue([{ '?column?': 1 }])
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
    expect(json.db).toBe('up')
    expect(typeof json.latencyMs).toBe('number')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
  it('503 degraded when the DB probe fails (never throws)', async () => {
    mocks.queryRaw.mockRejectedValue(new Error('connection refused'))
    const res = await GET()
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.status).toBe('degraded')
    expect(json.db).toBe('down')
  })
})
