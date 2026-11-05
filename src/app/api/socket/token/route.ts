import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { requireUser, handleRouteError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

// Issues a short-lived JWT that the standalone socket server verifies.
// The NextAuth session cookie never exposes a token, so the client fetches
// this right before connecting the socket.
export async function GET() {
  try {
    const user = await requireUser()
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) throw new Error('NEXTAUTH_SECRET is not configured')
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '1h' }
    )
    return NextResponse.json({ success: true, token })
  } catch (error) {
    return handleRouteError(error)
  }
}
