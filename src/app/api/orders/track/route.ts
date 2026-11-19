import type { NextRequest } from 'next/server'
import { trackOrder } from '@/lib/actions/trackOrder'
import { ok, handleRouteError, AppError } from '@/lib/api-utils'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * C4 — public order tracking. POST (not GET) so the email/phone never land
 * in URLs, access logs or browser history. Rate-limited per IP (track-order
 * bucket, 5/min); misses return a generic 404 (no order-number enumeration).
 */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'track-order')
    if (limited) return limited

    const body = await request.json().catch(() => {
      throw new AppError(400, 'Invalid request body', 'INVALID_BODY')
    })
    const data = await trackOrder(body)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
