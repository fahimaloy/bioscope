import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from '@/auth.config'
import { parseRememberMe } from '@/lib/auth-secret'

export const { handlers, signIn, signOut, auth } = NextAuth({
  // No adapter: JWT session strategy + credentials-only provider.
  // ('@auth/prisma-adapter' is not a dependency and is incompatible with
  // credentials sign-in under JWT sessions.)
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsedCredentials = z
          .object({
            email: z.string().email({ message: 'Please enter a valid email address' }),
            password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
          })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          throw new Error(parsedCredentials.error.errors[0].message)
        }

        const { email, password } = parsedCredentials.data

        // B4 — rememberMe was a no-op control: the form sent it, authorize
        // dropped it. parseRememberMe owns the convention (absent = remembered).
        const rememberMe = parseRememberMe(
          (credentials as Record<string, unknown> | undefined)?.rememberMe
        )

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          image: user.avatar,
          rememberMe,
        }
      },
    }),
  ],
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      phone?: string | null
      image?: string | null
    }
  }

  interface User {
    role: string
    phone?: string | null
    rememberMe?: boolean
  }
}
