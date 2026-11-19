// E4 — promo validate endpoint: server-side discount preview. Auth required,
// rate-limited, reads promo_<CODE> directly, computes via frozen pricing helper.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  auth: vi.fn(),
  enforceRateLimit: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: { setting: { findUnique: mocks.findUnique } } }))
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: mocks.enforceRateLimit }))
vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))

import { POST } from '@/app/api/promo/validate/route'
import { NextRequest } from 'next/server'

function req(body: unknown) {
  return new NextRequest('http://localhost:3000/api/promo/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: 'u1', role: 'CUSTOMER' } })
  mocks.enforceRateLimit.mockReturnValue(null)
})
afterEach(() => { vi.restoreAllMocks() })

describe('POST /api/promo/validate', () => {
  it('percent code → server-computed discount', async () => {
    mocks.findUnique.mockResolvedValue({ key: 'promo_SAVE10', value: JSON.stringify({ type: 'percent', value: 10 }) })
    const res = await POST(req({ code: 'save10', subtotal: 500 }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual({ code: 'SAVE10', discount: 50, type: 'percent', value: 10 })
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { key: 'promo_SAVE10' } })
  })

  it('fixed code caps at the subtotal', async () => {
    mocks.findUnique.mockResolvedValue({ key: 'promo_FLAT900', value: JSON.stringify({ type: 'fixed', value: 900 }) })
    const res = await POST(req({ code: 'FLAT900', subtotal: 300 }))
    const json = await res.json()
    expect(json.data.discount).toBe(300)
  })

  it('unknown code → 400 INVALID_PROMO', async () => {
    mocks.findUnique.mockResolvedValue(null)
    const res = await POST(req({ code: 'NOPE', subtotal: 100 }))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_PROMO')
  })

  it('malformed JSON value → 400 INVALID_PROMO', async () => {
    mocks.findUnique.mockResolvedValue({ key: 'promo_BAD', value: '{not json' })
    const res = await POST(req({ code: 'BAD', subtotal: 100 }))
    expect(res.status).toBe(400)
  })

  it('invalid type/value → 400 INVALID_PROMO', async () => {
    mocks.findUnique.mockResolvedValue({ key: 'promo_BAD', value: JSON.stringify({ type: 'bogus', value: 10 }) })
    const res = await POST(req({ code: 'BAD', subtotal: 100 }))
    expect(res.status).toBe(400)
  })

  it('empty code → 400 validation', async () => {
    const res = await POST(req({ code: '  ', subtotal: 100 }))
    expect(res.status).toBe(400)
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it('rate limit short-circuits before auth/db', async () => {
    mocks.enforceRateLimit.mockReturnValue(new Response('limited', { status: 429 }))
    const res = await POST(req({ code: 'X', subtotal: 1 }))
    expect(res.status).toBe(429)
    expect(mocks.auth).not.toHaveBeenCalled()
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it('unauthenticated → 401', async () => {
    mocks.auth.mockResolvedValue(null)
    const res = await POST(req({ code: 'X', subtotal: 1 }))
    expect(res.status).toBe(401)
  })
})
