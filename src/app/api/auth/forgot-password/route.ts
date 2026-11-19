import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { handleRouteError, ok } from '@/lib/api-utils'
import { forgotPasswordSchema } from '@/lib/validations/profile'
import { enforceRateLimit } from '@/lib/rate-limit'
import { sendMail, passwordResetEmailHtml } from '@/lib/email'
import { isEmailConfigured } from '@/lib/server/email-config'

export const dynamic = 'force-dynamic'

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

const GENERIC_MESSAGE = 'If that email exists, a reset link has been issued'

export async function POST(request: Request) {
  try {
    const rateLimited = enforceRateLimit(request, 'forgot-password')
    if (rateLimited) return rateLimited

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

      // Deliver the reset link when SMTP is configured (E1 — previously the
      // production path created the token but never sent anything). Failures
      // are logged without PII and never change the generic response, so the
      // endpoint still does not leak which emails are registered.
      const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
      const resetUrl = `${base}/reset-password?token=${token}`
      if (await isEmailConfigured()) {
        try {
          await sendMail({
            to: email,
            subject: 'BIOSCOPE · Reset your password',
            html: passwordResetEmailHtml(resetUrl),
          })
        } catch (err) {
          console.error('password-reset email delivery failed:', err instanceof Error ? err.message : 'unknown error')
        }
      } else if (process.env.NODE_ENV === 'production') {
        console.warn('password reset requested but email is not configured (Admin → Settings → Email)')
      }

      // Development convenience: expose the token so the flow can be tested
      // without SMTP. Never in production.
      if (process.env.NODE_ENV !== 'production') {
        return ok({ message: GENERIC_MESSAGE, devToken: token })
      }
    }

    // Always succeed to avoid leaking which emails are registered.
    return ok({ message: GENERIC_MESSAGE })
  } catch (error) {
    return handleRouteError(error)
  }
}
