/**
 * B4 — rememberMe session lifetime, enforced in the jwt callback.
 *
 * Mechanism under test (verified against @auth/core 0.41.3): jwt.encode
 * re-stamps `iat` and `exp` on EVERY session fetch, so the lifetime must be
 * anchored to an absolute `authTime` claim written at sign-in, and expiry
 * must return null (the session action then clears the cookie — fail closed
 * in middleware, server auth() and the client alike).
 *
 * The iat-restamp test is the regression guard for the interrupted first
 * attempt, which enforced `iat + 24h` and therefore never expired an active
 * user's session.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authConfig } from '@/auth.config'

const DAY = 24 * 60 * 60
const T0 = new Date('2026-11-19T12:00:00Z')

// The callbacks are declared on the edge-safe config; invoke them directly
// with the same shapes @auth/core passes (token = decoded JWT payload).
const jwt = authConfig.callbacks!.jwt!
const session = authConfig.callbacks!.session!

type JwtParams = Parameters<typeof jwt>[0]
type SessionParams = Parameters<typeof session>[0]

function signIn(rememberMe?: boolean) {
  return jwt({
    token: { name: 'Test User', email: 't@example.com' },
    user: {
      id: 'u1',
      email: 't@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
      phone: null,
      ...(rememberMe === undefined ? {} : { rememberMe }),
    },
  } as unknown as JwtParams)
}

/** Simulate @auth/core's per-fetch re-encode: fresh iat/exp, claims kept. */
function restamp(token: Record<string, unknown>, at: number) {
  return { ...token, iat: at, exp: at + 30 * DAY }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(T0)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('jwt callback — sign-in', () => {
  it('anchors authTime at the sign-in instant and defaults to remembered', async () => {
    const token = (await signIn()) as Record<string, unknown>
    expect(token.rememberMe).toBe(true)
    expect(token.authTime).toBe(Math.floor(T0.getTime() / 1000))
    expect(token.id).toBe('u1')
    expect(token.role).toBe('CUSTOMER')
  })

  it('records an explicit rememberMe=false', async () => {
    const token = (await signIn(false)) as Record<string, unknown>
    expect(token.rememberMe).toBe(false)
  })
})

describe('jwt callback — lifetime enforcement', () => {
  it('keeps a non-remembered session alive just before the 24h boundary', async () => {
    const token = (await signIn(false)) as Record<string, unknown>
    vi.setSystemTime(T0.getTime() + (DAY - 5) * 1000)
    const result = await jwt({ token: restamp(token, Math.floor(Date.now() / 1000)) } as unknown as JwtParams)
    expect(result).not.toBeNull()
  })

  it('invalidates a non-remembered session past 24h even though iat was just re-stamped', async () => {
    const token = (await signIn(false)) as Record<string, unknown>
    // 25h after sign-in; the encoder re-stamped iat one second ago (the
    // rolling-claim trap — an iat-based check would pass here).
    vi.setSystemTime(T0.getTime() + 25 * 60 * 60 * 1000)
    const freshIat = Math.floor(Date.now() / 1000) - 1
    const result = await jwt({ token: restamp(token, freshIat) } as unknown as JwtParams)
    expect(result).toBeNull()
  })

  it('keeps a remembered session alive well past 24h', async () => {
    const token = (await signIn(true)) as Record<string, unknown>
    vi.setSystemTime(T0.getTime() + 20 * DAY * 1000)
    const result = await jwt({ token: restamp(token, Math.floor(Date.now() / 1000)) } as unknown as JwtParams)
    expect(result).not.toBeNull()
  })

  it('leaves pre-B4 tokens (no authTime/rememberMe) on the 30-day default', async () => {
    const legacy = { id: 'u1', role: 'CUSTOMER', iat: Math.floor(T0.getTime() / 1000) - 40 * DAY }
    vi.setSystemTime(T0.getTime() + 2 * DAY * 1000)
    const result = await jwt({ token: legacy } as unknown as JwtParams)
    expect(result).not.toBeNull()
  })

  it('does not apply a profile update to an expired token', async () => {
    const token = (await signIn(false)) as Record<string, unknown>
    vi.setSystemTime(T0.getTime() + 25 * 60 * 60 * 1000)
    const result = await jwt({
      token,
      trigger: 'update',
      session: { name: 'New Name' },
    } as unknown as JwtParams)
    expect(result).toBeNull()
  })

  it('applies a profile update to a live token', async () => {
    const token = (await signIn(true)) as Record<string, unknown>
    const result = (await jwt({
      token,
      trigger: 'update',
      session: { name: 'New Name', image: 'https://x/y.png' },
    } as unknown as JwtParams)) as Record<string, unknown>
    expect(result.name).toBe('New Name')
    expect(result.image).toBe('https://x/y.png')
  })
})

describe('session callback', () => {
  it('maps id/role/phone from the token onto the session user', async () => {
    const token = (await signIn(true)) as Record<string, unknown>
    const result = await session({
      session: { user: { name: 'Test User', email: 't@example.com' }, expires: 'x' },
      token,
    } as unknown as SessionParams)
    expect(result.user!.id).toBe('u1')
    expect(result.user!.role).toBe('CUSTOMER')
    expect(result.user!.phone).toBeNull()
  })
})
