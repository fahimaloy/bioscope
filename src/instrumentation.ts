import { planAdminBootstrap, type AdminBootstrapAccount } from '@/lib/admin-bootstrap'

/**
 * Next.js startup hook (enabled via `experimental.instrumentationHook` in
 * next.config). `.env` ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME is the source
 * of truth for the bootstrap admin: the account is created when missing and
 * reconciled when it drifted, so the owner can always sign in with the env
 * credentials. Set ADMIN_BOOTSTRAP=0 to opt out.
 *
 * Never logs the password — only the email and which fields were repaired.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.ADMIN_BOOTSTRAP === '0') return

  const { prisma } = await import('@/lib/prisma')
  // Variable specifier + webpackIgnore keeps webpack from tracing bcryptjs into
  // the edge build of this file (it needs node:crypto, which edge lacks).
  const bcryptPackageName = 'bcryptjs'
  const bcryptModule = await import(/* webpackIgnore: true */ bcryptPackageName)
  const bcrypt = bcryptModule.default ?? bcryptModule

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admin User'
  if (!email || !password) return

  const existing = await prisma.user.findUnique({ where: { email } })
  const passwordMatches = existing?.passwordHash
    ? await bcrypt.compare(password, existing.passwordHash)
    : false
  const plan = planAdminBootstrap(existing as AdminBootstrapAccount | null, passwordMatches)

  if (plan.action === 'create') {
    await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 12), name, role: 'ADMIN', emailVerified: new Date() },
    })
    console.log(`[admin-bootstrap] created admin ${email}`)
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
    `[admin-bootstrap] reconciled admin ${email} (resetPassword=${changes.resetPassword}, promoteToAdmin=${changes.promoteToAdmin}, verifyEmail=${changes.verifyEmail})`
  )
}
