import jwt from 'jsonwebtoken'
import { AppError, handleRouteError, ok, requireUser } from '@/lib/api-utils'
import { authSecret } from '@/lib/auth-secret'

export const dynamic = 'force-dynamic'

// Issues a short-lived JWT that the standalone socket server verifies.
// The NextAuth session cookie never exposes a token, so the client fetches
// this right before connecting the socket.
export async function GET() {
  try {
    const user = await requireUser()
    const secret = authSecret()
    if (!secret) throw new AppError(500, 'Auth secret is not configured', 'AUTH_NOT_CONFIGURED')
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '1h' }
    )
    return ok({ token })
  } catch (error) {
    return handleRouteError(error)
  }
}
