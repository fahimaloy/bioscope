// Server-only settings backup and restore.
//
// Export masks secrets by default; `includeEncryptedSecrets` returns the stored
// ciphertext instead, so a backup can be restored without losing credentials
// while still never exposing a plaintext secret.
//
// Import is deliberately conservative: unknown or malformed keys are skipped
// with a reason rather than aborting, and a masked value is treated as
// "unchanged" so restoring a default export cannot wipe a stored credential.

import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/api-utils'
import { isMaskedSecretValue, isSecretSettingKey, protectSecretSettings } from '@/lib/secret-settings'
import { decryptSecret, isEncryptedPayload, maskSecret } from '@/lib/crypto'

const KEY_PATTERN = /^[a-z][a-z0-9_]{0,79}$/
const SETTING_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const
const SETTING_CATEGORIES = ['TAX', 'DELIVERY', 'GENERAL', 'EMAIL', 'PAYMENT', 'WEBHOOK'] as const

const BACKUP_VERSION = 1

interface SettingRow {
  key: string
  value: string
  type: string
  category: string
  isPublic: boolean
  description: string | null
}

export interface SettingsBackup {
  version: number
  exportedAt: string
  settings: Record<
    string,
    {
      value: string | number | boolean
      type: string
      category: string
      isPublic: boolean
      description: string | null
      secret: boolean
    }
  >
}

export async function exportSettings(options?: { includeEncryptedSecrets?: boolean }): Promise<SettingsBackup> {
  const rows = await prisma.setting.findMany({
    orderBy: { key: 'asc' },
    select: { key: true, value: true, type: true, category: true, isPublic: true, description: true },
  })

  const settings: SettingsBackup['settings'] = {}
  for (const row of rows) {
    const secret = isSecretSettingKey(row.key)
    let value: string | number | boolean = row.value

    if (secret && !options?.includeEncryptedSecrets) {
      // Mask the plaintext so a default export never leaks a credential.
      // maskSecret must be called directly: maskSecretSettings keys on the
      // setting key, and a throwaway key like 'v' would leave it untouched.
      let plaintext = row.value
      if (isEncryptedPayload(plaintext)) {
        try {
          plaintext = decryptSecret(plaintext)
        } catch {
          plaintext = ''
        }
      }
      value = plaintext ? maskSecret(plaintext) : ''
    }

    settings[row.key] = {
      value,
      type: row.type,
      category: row.category,
      isPublic: row.isPublic,
      description: row.description,
      secret,
    }
  }

  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), settings }
}

export interface SettingsImportResult {
  applied: number
  skipped: Array<{ key: string; reason: string }>
}

interface NormalisedSetting {
  key: string
  value: string
  type: string
  category: string
  isPublic: boolean
  description?: string
}

export function normaliseSettingEntry(
  key: string,
  raw: unknown
): { value?: NormalisedSetting; reason?: string } {
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    const type =
      typeof raw === 'boolean' ? 'BOOLEAN' : typeof raw === 'number' ? 'NUMBER' : 'STRING'
    return { value: { key, value: String(raw), type, category: 'GENERAL', isPublic: false } }
  }

  if (Array.isArray(raw)) return { reason: 'unsupported entry' }

  if (raw && typeof raw === 'object') {
    const entry = raw as Record<string, unknown>
    if (entry.value === undefined) return { reason: 'missing value' }
    const rawValue = entry.value
    if (typeof rawValue !== 'string' && typeof rawValue !== 'number' && typeof rawValue !== 'boolean') {
      return { reason: 'value must be a string, number or boolean' }
    }
    const type = entry.type === undefined ? 'STRING' : String(entry.type)
    if (!SETTING_TYPES.includes(type as (typeof SETTING_TYPES)[number])) {
      return { reason: `unknown type "${type}"` }
    }
    const category = entry.category === undefined ? 'GENERAL' : String(entry.category)
    if (!SETTING_CATEGORIES.includes(category as (typeof SETTING_CATEGORIES)[number])) {
      return { reason: `unknown category "${category}"` }
    }
    return {
      value: {
        key,
        value: String(rawValue),
        type,
        category,
        isPublic: entry.isPublic === true,
        description: entry.description === undefined ? undefined : String(entry.description),
      },
    }
  }

  return { reason: 'unsupported entry' }
}

/**
 * Restore a backup. Secret values that are already encrypted payloads are
 * written back verbatim; masked values are skipped so a default export cannot
 * overwrite a stored credential.
 */
export async function importSettings(payload: unknown): Promise<SettingsImportResult> {
  const container = payload as { settings?: Record<string, unknown>; version?: number } | null
  if (!container || typeof container !== 'object' || !container.settings || typeof container.settings !== 'object') {
    throw new AppError(400, 'Invalid backup: expected { settings: { ... } }', 'INVALID_BACKUP')
  }

  const skipped: SettingsImportResult['skipped'] = []
  const normalised: NormalisedSetting[] = []

  for (const [key, raw] of Object.entries(container.settings)) {
    if (!KEY_PATTERN.test(key)) {
      skipped.push({ key, reason: 'invalid key' })
      continue
    }
    const { value, reason } = normaliseSettingEntry(key, raw)
    if (!value) {
      skipped.push({ key, reason: reason ?? 'unsupported entry' })
      continue
    }
    if (isSecretSettingKey(key)) {
      const existing = await prisma.setting.findUnique({ where: { key }, select: { value: true } })
      // A masked incoming value is "unchanged" even when nothing is stored yet,
      // so restoring a default export into a fresh DB cannot write a mask.
      if (value.value.includes('••') || isMaskedSecretValue(existing?.value, value.value)) {
        skipped.push({ key, reason: 'masked value — left unchanged' })
        continue
      }
      // Anything else is a real credential: encrypt before it touches the DB.
      value.value = protectSecretSettings({ [key]: value.value })[key] as string
    }
    normalised.push(value)
  }

  if (normalised.length > 0) {
    await prisma.$transaction(
      normalised.map((setting) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            type: setting.type,
            category: setting.category,
            isPublic: setting.isPublic,
            description: setting.description,
          },
          create: {
            key: setting.key,
            value: setting.value,
            type: setting.type,
            category: setting.category,
            isPublic: setting.isPublic,
            description: setting.description,
          },
        })
      )
    )
  }

  return { applied: normalised.length, skipped }
}

export type { SettingRow }
