import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  protectSecretSettings,
  maskSecretsForDisplay,
  isMaskedSecretValue,
  revealSecretSettings,
} from '@/lib/secret-settings'
import { decryptSecret, maskSecret } from '@/lib/crypto'

// Regressions for the review findings on the settings secret round-trip.
// The bug class: maskSecretSettings keys on the *setting key*, so callers that
// passed a throwaway key ('v', 'value') got the secret back untouched.

beforeEach(() => {
  process.env.SETTINGS_ENCRYPTION_KEY = 'unit-test-encryption-key-with-enough-entropy'
})

afterEach(() => {
  delete process.env.SETTINGS_ENCRYPTION_KEY
})

describe('maskSecretsForDisplay', () => {
  it('masks a stored ciphertext to the mask of its plaintext', () => {
    const secret = 'sk_live_very_secret_key_12345'
    const stored = protectSecretSettings({ smtp_password: secret }).smtp_password as string
    const displayed = maskSecretsForDisplay({ smtp_password: stored }).smtp_password as string
    expect(displayed).toBe(maskSecret(secret))
    expect(displayed).not.toContain(secret)
  })

  it('works for the single-value shape getSetting uses (real key, not a throwaway)', () => {
    const secret = 'hunter2-secret-value'
    const stored = protectSecretSettings({ smtp_password: secret }).smtp_password as string
    expect(maskSecretsForDisplay({ smtp_password: stored }).smtp_password).toBe(maskSecret(secret))
    // A throwaway key must NOT mask — that was the original bug.
    expect(maskSecretsForDisplay({ value: stored }).value).toBe(stored)
  })

  it('masks a value that cannot be decrypted instead of throwing or leaking it', () => {
    const stored = protectSecretSettings({ smtp_password: 'hunter2-secret-value' }).smtp_password as string
    delete process.env.SETTINGS_ENCRYPTION_KEY
    const displayed = maskSecretsForDisplay({ smtp_password: stored }).smtp_password as string
    expect(displayed).toContain('••••')
    expect(displayed).not.toBe(stored)
  })
})

describe('settings save round-trip', () => {
  it('recognises the mask the read path issued as "unchanged"', () => {
    const secret = 'sk_live_very_secret_key_12345'
    const stored = protectSecretSettings({ smtp_password: secret }).smtp_password as string
    // Exactly what getSettings() returns to the admin form:
    const echoed = maskSecretsForDisplay({ smtp_password: stored }).smtp_password as string
    // Exactly the check updateSettings() performs before preserving the ciphertext:
    expect(isMaskedSecretValue(stored, echoed)).toBe(true)
    // And the credential survives.
    expect(decryptSecret(stored)).toBe(secret)
  })

  it('does not treat a newly typed value as unchanged', () => {
    const stored = protectSecretSettings({ smtp_password: 'old-secret-value' }).smtp_password as string
    expect(isMaskedSecretValue(stored, 'a-brand-new-secret')).toBe(false)
  })

  it('survives a rotated encryption key without throwing', () => {
    const stored = protectSecretSettings({ smtp_password: 'old-secret-value' }).smtp_password as string
    process.env.SETTINGS_ENCRYPTION_KEY = 'a-completely-different-key-now'
    expect(() => isMaskedSecretValue(stored, maskSecret(stored))).not.toThrow()
    expect(isMaskedSecretValue(stored, maskSecret(stored))).toBe(true)
  })
})

describe('revealSecretSettings stays strict for the SMTP resolver', () => {
  it('throws rather than handing back a ciphertext as a password', () => {
    const stored = protectSecretSettings({ smtp_password: 'hunter2-secret-value' }).smtp_password as string
    delete process.env.SETTINGS_ENCRYPTION_KEY
    expect(() => revealSecretSettings({ smtp_password: stored })).toThrow()
  })
})
