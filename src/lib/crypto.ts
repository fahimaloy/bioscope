// Server-only symmetric encryption for secrets persisted in the database
// (payment-gateway credentials, webhook secrets, SMTP password).
//
// AES-256-GCM with a key derived from SETTINGS_ENCRYPTION_KEY. GCM is
// authenticated, so a tampered or truncated payload fails to decrypt instead of
// silently returning garbage. The payload is self-describing (`v1:iv:tag:data`)
// so the format can evolve without orphaning stored values.
//
// The environment key is the trust root: it is never stored, never logged, and
// never committed. Losing it makes stored secrets unrecoverable.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'v1'
const KEY_LENGTH = 32
const IV_LENGTH = 12 // 96-bit nonce, the GCM recommended size
const SALT = 'bioscope.settings-encryption.v1'

/** Derive a stable 32-byte key from the configured environment secret. */
function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, KEY_LENGTH)
}

/** True when the operator has configured an encryption key. */
export function isEncryptionConfigured(): boolean {
  return Boolean(process.env.SETTINGS_ENCRYPTION_KEY)
}

function requireKey(): string {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY
  if (!secret) {
    throw new Error(
      'SETTINGS_ENCRYPTION_KEY is not set; cannot encrypt settings. Add it to the environment.'
    )
  }
  return secret
}

/** Encrypt a secret for storage. Throws if the encryption key is missing. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, deriveKey(requireKey()), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':')
}

/** Decrypt a stored secret. Throws on a missing key, bad format, or tampering. */
export function decryptSecret(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error('Unrecognised encrypted-setting payload')
  }
  const [, iv, tag, data] = parts
  const decipher = createDecipheriv(ALGORITHM, deriveKey(requireKey()), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8')
}

/** True when a stored value looks like one of our encrypted payloads. */
export function isEncryptedPayload(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(`${PREFIX}:`)
}

/**
 * Render a secret for display. Keeps the first and last two characters so an
 * admin can recognise which key is stored without revealing it.
 */
export function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}${'•'.repeat(Math.min(8, value.length - 8))}${value.slice(-4)}`
}
