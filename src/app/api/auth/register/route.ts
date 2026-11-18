import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleRouteError, created } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)
    const email = validated.email.toLowerCase()

    // The bootstrap admin email is reserved: self-registration must never be
    // able to claim it, or the startup reconcile would promote that account.
    const reservedAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    if (reservedAdminEmail && email === reservedAdminEmail) {
      return NextResponse.json(
        { success: false, error: 'This email address is not available for registration', code: 'EMAIL_RESERVED' },
        { status: 409 }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists', code: 'EMAIL_TAKEN' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(validated.password, 12)
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: 'CUSTOMER', // self-registration can never create an admin
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return created({ user })
  } catch (error) {
    return handleRouteError(error)
  }
}
