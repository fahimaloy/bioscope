import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { handleRouteError, requireUser, ok } from '@/lib/api-utils'
import { changePasswordSchema } from '@/lib/validations/profile'
import { enforceRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const rateLimited = enforceRateLimit(request, 'change-password')
    if (rateLimited) return rateLimited

    const user = await requireUser()
    const body = await request.json()
    const validated = changePasswordSchema.parse(body)

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser?.passwordHash) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 })
    }

    const valid = await bcrypt.compare(validated.currentPassword, dbUser.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect', code: 'WRONG_PASSWORD' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(validated.newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

    return ok({ message: 'Password updated' })
  } catch (error) {
    return handleRouteError(error)
  }
}
