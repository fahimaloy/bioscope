import { planAdminBootstrap, type AdminBootstrapAccount } from '@/lib/admin-bootstrap'

/**
 * Next.js startup hook (enabled via `experimental.instrumentationHook` in
 * next.config). `.env` ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME is the source
 * of truth for the bootstrap admin: the account is created when missing and
 * reconciled when it drifted, so the owner can always sign in with the env
 * credentials. Set ADMIN_BOOTSTRAP=0 to opt out.
 *
 * Never logs the password or the email (PII) — only the action taken.
 * A failure here must not take down server start or every request, so the
 * whole body is guarded and errors are logged without PII and swallowed.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.ADMIN_BOOTSTRAP === '0') return

  try {
    const { prisma } = await import('@/lib/prisma')
    // Variable specifier + webpackIgnore keeps webpack from tracing bcryptjs into
    // the edge build of this file (it needs node:crypto, which edge lacks).
    const bcryptPackageName = 'bcryptjs'
    const bcryptModule = await import(/* webpackIgnore: true */ bcryptPackageName)
    const bcrypt = bcryptModule.default ?? bcryptModule

    // Match the lowercasing the credentials provider and register route use.
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.ADMIN_PASSWORD
    const name = process.env.ADMIN_NAME || 'Admin User'
    if (!email || !password) return

    const existing = await prisma.user.findUnique({ where: { email } })
    const passwordMatches = existing?.passwordHash
      ? await bcrypt.compare(password, existing.passwordHash)
      : false
    const plan = planAdminBootstrap(existing as AdminBootstrapAccount | null, passwordMatches)

    if (plan.action === 'create') {
      try {
        await prisma.user.create({
          data: { email, passwordHash: await bcrypt.hash(password, 12), name, role: 'ADMIN', emailVerified: new Date() },
        })
        console.log('[admin-bootstrap] created admin account')
      } catch (error) {
        // A concurrent boot may have created it first; that is fine.
        if ((error as { code?: string })?.code === 'P2002') {
          console.log('[admin-bootstrap] admin account already exists')
          return
        }
        throw error
      }
      return
    }

    if (plan.action === 'none') return

    const { changes } = plan
    await prisma.user.update({
      where: { id: (existing as AdminBootstrapAccount).id },
      data: {
        ...(changes.resetPassword ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
        ...(changes.promoteToAdmin ? { role: 'ADMIN' as const } : {}),
        ...(changes.verifyEmail ? { emailVerified: new Date() } : {}),
      },
    })
    console.log(
      `[admin-bootstrap] reconciled admin account (resetPassword=${changes.resetPassword}, promoteToAdmin=${changes.promoteToAdmin}, verifyEmail=${changes.verifyEmail})`
    )
  } catch (error) {
    // Startup must survive a missing DATABASE_URL, a DB blip, or a bad env.
    console.error('[admin-bootstrap] failed:', error instanceof Error ? error.message : 'unknown error')
  }
}
