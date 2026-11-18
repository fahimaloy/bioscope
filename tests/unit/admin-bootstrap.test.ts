import { describe, it, expect } from 'vitest'
import { planAdminBootstrap } from '@/lib/admin-bootstrap'

const account = (overrides: Partial<{ role: string; emailVerified: Date | null; passwordHash: string | null }> = {}) => ({
  id: 'user_1',
  role: 'ADMIN',
  emailVerified: new Date('2026-01-01T00:00:00.000Z'),
  passwordHash: 'hash',
  ...overrides,
})

describe('planAdminBootstrap', () => {
  it('creates the account when no user has the admin email', () => {
    expect(planAdminBootstrap(null, false)).toEqual({
      action: 'create',
      changes: { resetPassword: true, promoteToAdmin: true, verifyEmail: true },
    })
  })

  it('does nothing when the existing admin already matches .env', () => {
    expect(planAdminBootstrap(account(), true)).toEqual({
      action: 'none',
      changes: { resetPassword: false, promoteToAdmin: false, verifyEmail: false },
    })
  })

  it('resets the password when the stored hash does not match .env', () => {
    const plan = planAdminBootstrap(account(), false)
    expect(plan.action).toBe('reconcile')
    expect(plan.changes.resetPassword).toBe(true)
    expect(plan.changes.promoteToAdmin).toBe(false)
    expect(plan.changes.verifyEmail).toBe(false)
  })

  it('resets when the stored account has no password hash at all', () => {
    expect(planAdminBootstrap(account({ passwordHash: null }), false).changes.resetPassword).toBe(true)
  })

  it('promotes a customer account that owns the admin email', () => {
    const plan = planAdminBootstrap(account({ role: 'CUSTOMER' }), true)
    expect(plan.action).toBe('reconcile')
    expect(plan.changes.promoteToAdmin).toBe(true)
    expect(plan.changes.resetPassword).toBe(false)
  })

  it('verifies the email when it was never verified', () => {
    const plan = planAdminBootstrap(account({ emailVerified: null }), true)
    expect(plan.action).toBe('reconcile')
    expect(plan.changes.verifyEmail).toBe(true)
  })

  it('reports every repair at once when nothing matches', () => {
    const plan = planAdminBootstrap(account({ role: 'CUSTOMER', emailVerified: null }), false)
    expect(plan.action).toBe('reconcile')
    expect(plan.changes).toEqual({ resetPassword: true, promoteToAdmin: true, verifyEmail: true })
  })
})
