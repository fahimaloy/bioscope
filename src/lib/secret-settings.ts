// Settings that hold credentials. These are encrypted at rest and never
// returned in the clear: admin reads get a masked placeholder, and writes are
// re-encrypted before they touch the database.
//
// The whitelist is the single source of truth — a new credential setting must
// be added here or it will be stored in plaintext.

import { decryptSecret, encryptSecret, isEncryptedPayload, maskSecret } from '@/lib/crypto'

export const SECRET_SETTING_KEYS = [
  // SMTP
  'smtp_password',
  // Payments — Stripe
  'payment_stripe_secret_key',
  'payment_stripe_webhook_secret',
  // Payments — SSLCommerz
  'payment_sslcommerz_store_password',
  // Payments — bKash
  'payment_bkash_app_secret',
  'payment_bkash_password',
  // Payments — Nagad
  'payment_nagad_private_key',
] as const

export type SecretSettingKey = (typeof SECRET_SETTING_KEYS)[number]

const SECRET_KEY_SET: ReadonlySet<string> = new Set(SECRET_SETTING_KEYS)

export function isSecretSettingKey(key: string): key is SecretSettingKey {
  return SECRET_KEY_SET.has(key)
}

/**
 * Encrypt every secret key in a settings payload.
 *
 * A value that is already an encrypted payload is left alone, so a caller that
 * echoes stored values back cannot double-encrypt them.
 */
export function protectSecretSettings<T extends Record<string, unknown>>(values: T): T {
  const out: Record<string, unknown> = { ...values }
  for (const key of Object.keys(out)) {
    if (!isSecretSettingKey(key)) continue
    const value = out[key]
    if (value === undefined || value === null) continue
    const str = String(value)
    if (str === '' || isEncryptedPayload(str)) continue
    out[key] = encryptSecret(str)
  }
  return out as T
}

/**
 * Decrypt stored secret values. Strict: throws when the key is missing or the
 * payload is bad, because callers such as the SMTP resolver need the real
 * password and must not silently use a ciphertext.
 */
export function revealSecretSettings(values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...values }
  for (const key of Object.keys(out)) {
    if (!isSecretSettingKey(key)) continue
    const value = out[key]
    if (value && isEncryptedPayload(value)) out[key] = decryptSecret(value)
  }
  return out
}

/**
 * Decrypt-then-mask for admin reads.
 *
 * The mask must be of the *plaintext*, because that is what
 * `isMaskedSecretValue` compares an echoed mask against. A value that cannot be
 * decrypted (key rotated or removed) is masked as-is, so the read path never
 * throws and never returns the stored bytes in the clear.
 */
export function maskSecretsForDisplay<T extends Record<string, unknown>>(values: T): T {
  const out: Record<string, unknown> = { ...values }
  for (const key of Object.keys(out)) {
    if (!isSecretSettingKey(key)) continue
    const raw = out[key]
    if (raw === undefined || raw === null || raw === '') {
      out[key] = ''
      continue
    }
    let plaintext = String(raw)
    if (isEncryptedPayload(plaintext)) {
      try {
        plaintext = decryptSecret(plaintext)
      } catch {
        // Leave the stored bytes as-is; masking below still hides them.
      }
    }
    out[key] = maskSecret(plaintext)
  }
  return out as T
}

/**
 * True when an incoming value is a mask we issued earlier, i.e. the operator
 * has not typed a new secret. The caller should then preserve the stored
 * ciphertext instead of re-encrypting the placeholder.
 *
 * Accepts the mask of the plaintext (current read path) and of the stored
 * bytes (legacy read path, or an undecryptable payload) so an echo-back is
 * recognised even when SETTINGS_ENCRYPTION_KEY has been rotated.
 */
export function isMaskedSecretValue(
  existingStored: string | null | undefined,
  incoming: string
): boolean {
  if (!existingStored) return false
  if (incoming === maskSecret(existingStored)) return true
  if (isEncryptedPayload(existingStored)) {
    try {
      return incoming === maskSecret(decryptSecret(existingStored))
    } catch {
      return false
    }
  }
  return false
}

/**
 * Mask secret values for API responses. Kept for callers that already hold
 * plaintext; prefer `maskSecretsForDisplay` when the values are stored bytes.
 */
export function maskSecretSettings<T extends Record<string, unknown>>(values: T): T {
  const out: Record<string, unknown> = { ...values }
  for (const key of Object.keys(out)) {
    if (!isSecretSettingKey(key)) continue
    const value = out[key]
    out[key] = value === undefined || value === null || value === '' ? '' : maskSecret(String(value))
  }
  return out as T
}
