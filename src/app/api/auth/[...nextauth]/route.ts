import { handlers } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

export const { GET } = handlers

/**
 * Credential sign-in POSTs are rate-limited (B3 leftover: login was the one
 * public auth write without throttling — credential stuffing was free).
 * Only the credentials callback/signin paths consume the `login` bucket;
 * signout and the other auth POSTs pass through untouched.
 */
export async function POST(request: NextRequest) {
  const path = new URL(request.url).pathname
  if (path.endsWith('/callback/credentials') || path.endsWith('/signin/credentials')) {
    const limited = enforceRateLimit(request, 'login')
    if (limited) return limited
  }
  return handlers.POST(request)
}