import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { handleRouteError, ok } from '@/lib/api-utils'
import { forgotPasswordSchema } from '@/lib/validations/profile'

export const dynamic = 'force-dynamic'

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      })
      // No SMTP is configured yet; in development the token is returned so the
      // flow can be tested locally. Never do this in production.
      if (process.env.NODE_ENV !== 'production') {
        return ok({ message: 'If that email exists, a reset link has been issued', devToken: token })
      }
    }

    // Always succeed to avoid leaking which emails are registered.
    return ok({ message: 'If that email exists, a reset link has been issued' })
  } catch (error) {
    return handleRouteError(error)
  }
}
