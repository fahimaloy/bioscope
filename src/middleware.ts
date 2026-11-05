import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

// Edge-safe: only authConfig + empty providers (NextAuth maps over providers,
// so the array must exist even though credential auth runs in node runtime).
export const { auth: middleware } = NextAuth({ ...authConfig, providers: [] })

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/register',
    '/checkout/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/custom-sticker',
  ],
}
