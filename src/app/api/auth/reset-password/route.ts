import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { handleRouteError, ok } from '@/lib/api-utils'
import { resetPasswordSchema } from '@/lib/validations/profile'

export const dynamic = 'force-dynamic'

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = resetPasswordSchema.parse(body)

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(validated.token) },
    })

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Reset link is invalid or has expired', code: 'INVALID_TOKEN' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(validated.password, 12)
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ])

    return ok({ message: 'Password has been reset' })
  } catch (error) {
    return handleRouteError(error)
  }
}
