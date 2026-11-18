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
      const isAuthPath = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/admin/login')
      const isProtectedPath =
        path.startsWith('/checkout') ||
        path.startsWith('/profile') ||
        path.startsWith('/orders') ||
        path.startsWith('/custom-sticker')

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
