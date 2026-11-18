/**
 * Admin bootstrap planning.
 *
 * `.env` (ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME) is the source of truth for
 * the bootstrap admin account. `instrumentation.ts` calls `planAdminBootstrap`
 * on server start and applies the result, so a restored DB or a hand-edited
 * password can never silently lock the owner out.
 *
 * Kept free of Prisma/bcrypt imports so the decision is unit-testable.
 */

export interface AdminBootstrapAccount {
  id: string
  role: string
  emailVerified: Date | null
  passwordHash: string | null
}

export interface AdminBootstrapChanges {
  /** Stored hash does not verify against ADMIN_PASSWORD — re-hash it. */
  resetPassword: boolean
  /** Account exists but is not an admin — grant full access. */
  promoteToAdmin: boolean
  /** Credentials login requires a verified email — mark it verified. */
  verifyEmail: boolean
}

export interface AdminBootstrapPlan {
  action: 'create' | 'reconcile' | 'none'
  changes: AdminBootstrapChanges
}

export function planAdminBootstrap(
  existing: AdminBootstrapAccount | null,
  passwordMatches: boolean
): AdminBootstrapPlan {
  if (!existing) {
    return {
      action: 'create',
      changes: { resetPassword: true, promoteToAdmin: true, verifyEmail: true },
    }
  }

  const changes: AdminBootstrapChanges = {
    resetPassword: !passwordMatches,
    promoteToAdmin: existing.role !== 'ADMIN',
    verifyEmail: !existing.emailVerified,
  }

  const action = changes.resetPassword || changes.promoteToAdmin || changes.verifyEmail ? 'reconcile' : 'none'
  return { action, changes }
}
