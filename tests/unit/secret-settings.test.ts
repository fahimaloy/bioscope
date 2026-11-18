import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  SECRET_SETTING_KEYS,
  isSecretSettingKey,
  protectSecretSettings,
  revealSecretSettings,
  maskSecretSettings,
  isMaskedSecretValue,
} from '@/lib/secret-settings'
import { decryptSecret, isEncryptedPayload } from '@/lib/crypto'

beforeEach(() => {
  process.env.SETTINGS_ENCRYPTION_KEY = 'unit-test-encryption-key-with-enough-entropy'
})

afterEach(() => {
  delete process.env.SETTINGS_ENCRYPTION_KEY
})

describe('isSecretSettingKey', () => {
  it('accepts only whitelisted credential keys', () => {
    for (const key of SECRET_SETTING_KEYS) expect(isSecretSettingKey(key)).toBe(true)
    expect(isSecretSettingKey('site_name')).toBe(false)
    expect(isSecretSettingKey('smtp_host')).toBe(false)
  })
})

describe('protectSecretSettings', () => {
  it('encrypts whitelisted keys and leaves ordinary settings alone', () => {
    const out = protectSecretSettings({
      site_name: 'BIOSCOPE',
      payment_stripe_secret_key: 'sk_live_abc123',
      smtp_password: 'hunter2',
    })
    expect(out.site_name).toBe('BIOSCOPE')
    expect(isEncryptedPayload(out.payment_stripe_secret_key as string)).toBe(true)
    expect(isEncryptedPayload(out.smtp_password as string)).toBe(true)
    expect(out.payment_stripe_secret_key).not.toContain('sk_live_abc123')
  })

  it('does not double-encrypt an already encrypted value', () => {
    const once = protectSecretSettings({ smtp_password: 'hunter2' })
    const twice = protectSecretSettings(once)
    expect(twice.smtp_password).toBe(once.smtp_password)
  })

  it('ignores empty and absent values', () => {
    const out = protectSecretSettings({ smtp_password: '' })
    expect(out.smtp_password).toBe('')
  })
})

describe('revealSecretSettings', () => {
  it('returns plaintext for stored ciphertext', () => {
    const stored = protectSecretSettings({
      smtp_password: 'hunter2',
      site_name: 'BIOSCOPE',
    })
    const revealed = revealSecretSettings({
      smtp_password: stored.smtp_password as string,
      site_name: stored.site_name as string,
    })
    expect(revealed.smtp_password).toBe('hunter2')
    expect(revealed.site_name).toBe('BIOSCOPE')
  })

  it('passes through values that were never encrypted', () => {
    expect(revealSecretSettings({ smtp_password: 'plaintext' }).smtp_password).toBe('plaintext')
  })
})

describe('maskSecretSettings', () => {
  it('masks credentials and passes ordinary settings through', () => {
    const out = maskSecretSettings({ site_name: 'BIOSCOPE', smtp_password: 'hunter2-secret' })
    expect(out.site_name).toBe('BIOSCOPE')
    expect(out.smtp_password).not.toContain('hunter2')
    expect(String(out.smtp_password)).toContain('••••')
  })

  it('masks empty credentials as an empty string', () => {
    expect(maskSecretSettings({ smtp_password: '' }).smtp_password).toBe('')
  })
})

describe('isMaskedSecretValue', () => {
  it('recognises the mask we issued for the stored secret', () => {
    const stored = protectSecretSettings({ smtp_password: 'hunter2-secret-value' })
    const masked = maskSecretSettings({ smtp_password: 'hunter2-secret-value' }).smtp_password as string
    expect(isMaskedSecretValue(stored.smtp_password as string, masked)).toBe(true)
  })

  it('rejects a genuinely new value and an empty secret', () => {
    const stored = protectSecretSettings({ smtp_password: 'hunter2-secret-value' })
    expect(isMaskedSecretValue(stored.smtp_password as string, 'a-new-password')).toBe(false)
    expect(isMaskedSecretValue(undefined, 'anything')).toBe(false)
  })

  it('round-trips: the mask is stable for a given stored secret', () => {
    const stored = protectSecretSettings({ smtp_password: 'hunter2-secret-value' })
    const plaintext = decryptSecret(stored.smtp_password as string)
    expect(maskSecretSettings({ smtp_password: plaintext }).smtp_password).toBe(
      maskSecretSettings({ smtp_password: 'hunter2-secret-value' }).smtp_password
    )
  })
})
