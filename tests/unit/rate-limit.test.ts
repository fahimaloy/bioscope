import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// The route handlers pull in Prisma and next-auth; mock them so these tests
// exercise only routing + limiter logic, not the database or auth stack.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'user-1',
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      })),
      update: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
    },
    passwordResetToken: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({})),
    },
    notification: { create: vi.fn(async () => ({})) },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(async () => null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}))

// api-utils only uses Prisma for instanceof checks; a stub keeps the test
// independent of the generated client.
vi.mock('@prisma/client', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
}))

import { POST as registerPOST } from '@/app/api/auth/register/route'
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route'
import { POST as resetPasswordPOST } from '@/app/api/auth/reset-password/route'
import { POST as changePasswordPOST } from '@/app/api/auth/change-password/route'
import { POST as contactPOST } from '@/app/api/contact/route'
import {
  checkRateLimit,
  enforceRateLimit,
  getClientIp,
  resetRateLimits,
  UNKNOWN_IP,
} from '@/lib/rate-limit'

const IP_A = '203.0.113.7'
const IP_B = '198.51.100.9'
const WINDOW_MS = 60_000

function makeRequest(path: string, ip?: string, body: unknown = {}): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (ip) headers['x-forwarded-for'] = ip
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('checkRateLimit (sliding window)', () => {
  beforeEach(() => resetRateLimits())
  afterEach(() => {
    vi.useRealTimers()
  })

  it('blocks after the limit is exceeded and reports Retry-After', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)

    const allowed = [0, 1, 2].map(() => checkRateLimit('unit', 3, WINDOW_MS))
    expect(allowed.every((r) => r.allowed)).toBe(true)
    expect(allowed.map((r) => r.remaining)).toEqual([2, 1, 0])

    const blocked = checkRateLimit('unit', 3, WINDOW_MS)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBe(60)
  })

  it('allows the key again once the window expires', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)

    checkRateLimit('expiry', 3, WINDOW_MS)
    checkRateLimit('expiry', 3, WINDOW_MS)
    checkRateLimit('expiry', 3, WINDOW_MS)
    expect(checkRateLimit('expiry', 3, WINDOW_MS).allowed).toBe(false)

    vi.advanceTimersByTime(WINDOW_MS + 1)

    const after = checkRateLimit('expiry', 3, WINDOW_MS)
    expect(after.allowed).toBe(true)
  })

  it('isolates keys', () => {
    checkRateLimit('iso-a', 2, WINDOW_MS)
    checkRateLimit('iso-a', 2, WINDOW_MS)
    expect(checkRateLimit('iso-a', 2, WINDOW_MS).allowed).toBe(false)
    expect(checkRateLimit('iso-b', 2, WINDOW_MS).allowed).toBe(true)
  })

  it('does not record blocked hits, so retries cannot extend the lockout', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)

    for (let i = 0; i < 3; i++) checkRateLimit('no-record', 3, WINDOW_MS)
    // Hammer the endpoint well past the window; if blocked hits were recorded
    // the window would keep sliding forward.
    for (let i = 0; i < 50; i++) {
      vi.advanceTimersByTime(1_000)
      expect(checkRateLimit('no-record', 3, WINDOW_MS).allowed).toBe(false)
    }
    vi.advanceTimersByTime(WINDOW_MS)
    expect(checkRateLimit('no-record', 3, WINDOW_MS).allowed).toBe(true)
  })

  it('fails open when recording a hit throws', () => {
    const spy = vi.spyOn(Map.prototype, 'set').mockImplementation(() => {
      throw new Error('store failure')
    })
    let result: ReturnType<typeof checkRateLimit> | undefined
    try {
      result = checkRateLimit('fail-open', 2, WINDOW_MS)
    } finally {
      spy.mockRestore()
    }
    expect(result?.allowed).toBe(true)
  })
})

describe('getClientIp', () => {
  it('prefers the first hop of x-forwarded-for', () => {
    const req = new Request('http://localhost/api/contact', {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'x-real-ip': '198.51.100.9' },
    })
    expect(getClientIp(req)).toBe(IP_A)
  })

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost/api/contact', {
      headers: { 'x-real-ip': '198.51.100.9' },
    })
    expect(getClientIp(req)).toBe(IP_B)
  })

  it('uses the shared unknown key when no proxy header is present', () => {
    const req = new Request('http://localhost/api/contact')
    expect(getClientIp(req)).toBe(UNKNOWN_IP)
    expect(enforceRateLimit(req, 'contact')).toBeNull()
  })
})

const routeCases = [
  { name: 'register', path: '/api/auth/register', limit: 10, post: registerPOST },
  { name: 'forgot-password', path: '/api/auth/forgot-password', limit: 5, post: forgotPasswordPOST },
  { name: 'reset-password', path: '/api/auth/reset-password', limit: 5, post: resetPasswordPOST },
  { name: 'change-password', path: '/api/auth/change-password', limit: 10, post: changePasswordPOST },
  { name: 'contact', path: '/api/contact', limit: 5, post: contactPOST },
]

describe.each(routeCases)('route /api/$name', ({ name, path, limit, post }) => {
  beforeEach(() => resetRateLimits())
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns non-429 up to the limit, then 429 with Retry-After', async () => {
    for (let i = 0; i < limit; i++) {
      const res = await post(makeRequest(path, IP_A))
      expect(res.status).not.toBe(429)
    }

    const limited = await post(makeRequest(path, IP_A))
    expect(limited.status).toBe(429)

    const retryAfter = Number(limited.headers.get('retry-after'))
    expect(Number.isInteger(retryAfter)).toBe(true)
    expect(retryAfter).toBeGreaterThanOrEqual(1)

    const body = (await limited.json()) as { success: boolean; code: string }
    expect(body.success).toBe(false)
    expect(body.code).toBe('RATE_LIMITED')

    // Never leak which key was limited.
    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain(IP_A)
    expect(serialized).not.toContain(name)
  })

  it('leaves a different IP unaffected', async () => {
    for (let i = 0; i < limit; i++) {
      await post(makeRequest(path, IP_A))
    }
    expect((await post(makeRequest(path, IP_A))).status).toBe(429)

    const other = await post(makeRequest(path, IP_B))
    expect(other.status).not.toBe(429)
  })

  it('lets the same IP through again after the window expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)

    for (let i = 0; i < limit; i++) {
      await post(makeRequest(path, IP_A))
    }
    expect((await post(makeRequest(path, IP_A))).status).toBe(429)

    vi.advanceTimersByTime(WINDOW_MS + 1)

    expect((await post(makeRequest(path, IP_A))).status).not.toBe(429)
  })
})

describe('missing IP handling on a real route', () => {
  beforeEach(() => resetRateLimits())

  it('does not throw and shares one bucket across headerless clients', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await contactPOST(makeRequest('/api/contact'))
      expect(res.status).not.toBe(429)
    }
    const limited = await contactPOST(makeRequest('/api/contact'))
    expect(limited.status).toBe(429)
    expect(limited.headers.get('retry-after')).toBeTruthy()
  })
})

describe('valid traffic under the limit is unchanged', () => {
  beforeEach(() => resetRateLimits())

  it('register still returns 201', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await registerPOST(
        makeRequest('/api/auth/register', IP_A, {
          name: 'Test User',
          email: `user${i}-${Date.now()}@example.com`,
          password: 'Password1',
        })
      )
      expect(res.status).toBe(201)
      expect(((await res.json()) as { success: boolean }).success).toBe(true)
    }
  })

  it('contact still returns 200', async () => {
    const res = await contactPOST(
      makeRequest('/api/contact', IP_A, {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Hello there',
        message: 'This is a valid contact message.',
      })
    )
    expect(res.status).toBe(200)
    expect(((await res.json()) as { success: boolean }).success).toBe(true)
  })
})
