// Edge-safe NextAuth config shared by src/lib/auth.ts (node runtime) and
// src/middleware.ts (edge runtime). Must NOT import prisma or any node-only module.
import type { NextAuthConfig } from 'next-auth'

import { authSecret } from '@/lib/auth-secret'

export const authConfig: NextAuthConfig = {
  // @auth/core (next-auth v5 beta) reads only AUTH_SECRET*; fall back to the
  // legacy NEXTAUTH_SECRET so local .env keeps working. AUTH_SECRET wins when set.
  secret: authSecret() || undefined,
  providers: [], // node runtime adds the Credentials provider in src/lib/auth.ts
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.phone = (user as { phone?: string | null }).phone ?? null
        // B4 — session lifetime follows rememberMe: 30 days when remembered
        // (the default), 1 day otherwise. `authTime` is the ABSOLUTE sign-in
        // instant: @auth/core's encoder re-stamps `iat` and `exp` on every
        // session fetch (jwt.encode always calls setIssuedAt/setExpirationTime
        // with the cookie maxAge), so neither rolling claim can express an
        // absolute lifetime — verified against @auth/core 0.41.3 jwt.js.
        const remembered = (user as { rememberMe?: boolean }).rememberMe !== false
        token.rememberMe = remembered
        token.authTime = Math.floor(Date.now() / 1000)
      }
      // B4 — a non-remembered session expires 24h after sign-in, absolutely.
      // Returning null invalidates the token: the session action clears the
      // cookie and every consumer (middleware `authorized`, server `auth()`,
      // the client session fetch) sees no session — fail closed, not a
      // half-dead session whose cookie keeps being refreshed. Tokens minted
      // before B4 carry no authTime/rememberMe and stay on the 30-day default.
      const remembered = (token as { rememberMe?: boolean }).rememberMe !== false
      const authTime = (token as { authTime?: number }).authTime
      if (
        !remembered &&
        typeof authTime === 'number' &&
        authTime + 24 * 60 * 60 < Math.floor(Date.now() / 1000)
      ) {
        return null
      }
      if (trigger === 'update' && session) {
        token.name = session.name
        token.image = session.image
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          phone: (token as { phone?: string | null }).phone ?? null,
        }
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const path = nextUrl.pathname

      const isAdminPath = path.startsWith('/admin')
      const isAdminLoginPath = path.startsWith('/admin/login')
      const isAuthPath = path.startsWith('/login') || path.startsWith('/register') || isAdminLoginPath
      const isProtectedPath =
        path.startsWith('/checkout') ||
        path.startsWith('/profile') ||
        path.startsWith('/orders') ||
        path.startsWith('/custom-sticker')

      if (isAdminLoginPath) {
        // The admin sign-in page has to be reachable while logged out — it is
        // where admins authenticate. Without this the `/admin/:path*` guard
        // below bounces admins back to the customer login, and the customer
        // login then bounces them here again.
        if (!isLoggedIn) return true
        return Response.redirect(
          new URL(auth!.user!.role === 'ADMIN' ? '/admin/dashboard' : '/', nextUrl)
        )
      }

      if (isAdminPath) {
        // Returning false redirects page requests to the sign-in page.
        return isLoggedIn && auth?.user?.role === 'ADMIN'
      }
      if (isAuthPath && isLoggedIn) {
        return Response.redirect(
          new URL(auth!.user!.role === 'ADMIN' ? '/admin/dashboard' : '/', nextUrl)
        )
      }
      if (isProtectedPath && !isLoggedIn) {
        return false
      }
      return true
    },
  },
} satisfies NextAuthConfig
