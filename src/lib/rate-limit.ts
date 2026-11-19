// In-memory sliding-window rate limiter for public write endpoints.
//
// Caveats — read before relying on this:
// - Per-process memory only. Behind a load balancer with N instances, each
//   instance keeps its own counter, so the effective limit is N x the value
//   below. Upgrade path: back the counter with a shared store (Redis INCR +
//   EXPIRE, or a small shared table); the check/enforce API stays the same.
// - Node-side only. Never import this from middleware.ts: middleware runs on
//   the edge runtime, where a module-scope Map is wrong.
// - The client IP comes from proxy headers. `x-forwarded-for` is spoofable
//   unless a trusted proxy overwrites it, so treat this as a speed bump, not
//   an access control.
import { NextResponse } from 'next/server'

export type RateLimitBucket =
  | 'register'
  | 'login'
  | 'forgot-password'
  | 'reset-password'
  | 'change-password'
  | 'contact'
  | 'track-order'
  | 'promo'

/** Requests allowed per window, per bucket, per client IP. */
export const rateLimits: Record<RateLimitBucket, { limit: number; windowMs: number }> = {
  register: { limit: 10, windowMs: 60_000 },
  login: { limit: 10, windowMs: 60_000 },
  'forgot-password': { limit: 5, windowMs: 60_000 },
  'reset-password': { limit: 5, windowMs: 60_000 },
  'change-password': { limit: 10, windowMs: 60_000 },
  contact: { limit: 5, windowMs: 60_000 },
  // C4 — public order lookup; low limit blunts order-number enumeration.
  'track-order': { limit: 5, windowMs: 60_000 },
  // E4 — promo code validation at checkout; blunts code guessing.
  promo: { limit: 10, windowMs: 60_000 },
}

const MAX_WINDOW_MS = Math.max(...Object.values(rateLimits).map((r) => r.windowMs))

/**
 * Shared key used when neither proxy header is present (direct connection,
 * health checks, tests). All such clients share one bucket, so the limit is
 * deliberately lower in practice than it looks.
 */
export const UNKNOWN_IP = 'unknown'

type Bucket = { hits: number[] }

const buckets = new Map<string, Bucket>()
let checksSinceSweep = 0

/**
 * Client IP: first hop of `x-forwarded-for`, then `x-real-ip`, else the shared
 * `unknown` key. Values are kept in memory only and never logged.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const firstHop = forwarded?.split(',')[0]?.trim()
  if (firstHop) return firstHop
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  return UNKNOWN_IP
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  /** Whole seconds until the oldest hit leaves the window; set when blocked. */
  retryAfterSeconds?: number
}

/** Drop buckets that have been idle longer than the widest window. */
function sweep(): void {
  if (++checksSinceSweep < 512) return
  checksSinceSweep = 0
  const oldestLive = Date.now() - MAX_WINDOW_MS
  for (const [key, bucket] of buckets) {
    if ((bucket.hits[bucket.hits.length - 1] ?? 0) < oldestLive) buckets.delete(key)
  }
}

/**
 * Sliding-window log: a request is allowed while the key has fewer than
 * `limit` hits inside the trailing `windowMs`. Blocked requests are not
 * recorded, so a client cannot extend its own lockout by retrying.
 *
 * Fail-open by design: if recording a hit throws, allow the request rather
 * than taking the endpoint down. Nothing about the caller (IP, bucket) is
 * logged. Callers may pass `now` for deterministic tests.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  try {
    const cutoff = now - windowMs
    const hits = (buckets.get(key)?.hits ?? []).filter((t) => t > cutoff)
    if (hits.length >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000))
      return { allowed: false, limit, remaining: 0, retryAfterSeconds }
    }
    hits.push(now)
    buckets.set(key, { hits })
    sweep()
    return { allowed: true, limit, remaining: Math.max(0, limit - hits.length) }
  } catch {
    return { allowed: true, limit, remaining: limit }
  }
}

/**
 * Enforce a configured bucket. Returns a ready-to-return 429 response (with
 * `Retry-After`) when the client is over the limit, otherwise null.
 *
 * The body is intentionally generic: it never names the bucket or the client.
 * Routes return this directly instead of extending the AppError path, keeping
 * `src/lib/api-utils.ts` untouched.
 */
export function enforceRateLimit(request: Request, bucket: RateLimitBucket): NextResponse | null {
  const { limit, windowMs } = rateLimits[bucket]
  const result = checkRateLimit(`${bucket}:${getClientIp(request)}`, limit, windowMs)
  if (result.allowed) return null
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please slow down and try again later.',
      code: 'RATE_LIMITED',
    },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds ?? 1) } }
  )
}

/** Test helper: forget every counter. */
export function resetRateLimits(): void {
  buckets.clear()
}
