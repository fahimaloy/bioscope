import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  encryptSecret,
  decryptSecret,
  isEncryptedPayload,
  isEncryptionConfigured,
  maskSecret,
} from '@/lib/crypto'

const KEY = 'unit-test-encryption-key-with-enough-entropy'

beforeEach(() => {
  process.env.SETTINGS_ENCRYPTION_KEY = KEY
})

afterEach(() => {
  delete process.env.SETTINGS_ENCRYPTION_KEY
})

describe('encryptSecret / decryptSecret', () => {
  it('round-trips a secret', () => {
    const encrypted = encryptSecret('sk_live_super_secret')
    expect(encrypted).not.toContain('sk_live_super_secret')
    expect(isEncryptedPayload(encrypted)).toBe(true)
    expect(decryptSecret(encrypted)).toBe('sk_live_super_secret')
  })

  it('produces a different payload each time (random IV)', () => {
    const a = encryptSecret('same-value')
    const b = encryptSecret('same-value')
    expect(a).not.toBe(b)
    expect(decryptSecret(a)).toBe(decryptSecret(b))
  })

  it('handles empty strings and unicode', () => {
    expect(decryptSecret(encryptSecret(''))).toBe('')
    expect(decryptSecret(encryptSecret('বাংলা টেক্সট ✂️'))).toBe('বাংলা টেক্সট ✂️')
  })

  it('fails loudly when the encryption key is missing', () => {
    delete process.env.SETTINGS_ENCRYPTION_KEY
    expect(isEncryptionConfigured()).toBe(false)
    expect(() => encryptSecret('x')).toThrow(/SETTINGS_ENCRYPTION_KEY/)
  })

  it('refuses a malformed payload instead of returning garbage', () => {
    expect(() => decryptSecret('v1:not-base64:xx:yy')).toThrow()
    expect(() => decryptSecret('v2:aaaa:bbbb:cccc')).toThrow(/Unrecognised/)
  })

  it('rejects a tampered payload (GCM authentication)', () => {
    const encrypted = encryptSecret('original')
    const parts = encrypted.split(':')
    const flipped = parts[3] === 'YQ==' ? 'Yg==' : 'YQ=='
    expect(() => decryptSecret([parts[0], parts[1], parts[2], flipped].join(':'))).toThrow()
  })

  it('cannot be decrypted with a different key', () => {
    const encrypted = encryptSecret('secret')
    process.env.SETTINGS_ENCRYPTION_KEY = 'a-different-key-entirely'
    expect(() => decryptSecret(encrypted)).toThrow()
  })
})

describe('maskSecret', () => {
  it('keeps the ends and hides the middle', () => {
    expect(maskSecret('sk_live_1234567890')).toBe('sk_l••••••••7890')
    expect(maskSecret('abcdefgh')).toBe('••••••••')
    expect(maskSecret('')).toBe('')
  })

  it('never reveals the whole value', () => {
    const value = 'a'.repeat(40)
    const masked = maskSecret(value)
    expect(masked).not.toContain(value)
    expect(masked).toContain('••••')
  })
})
