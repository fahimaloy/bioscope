import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// settings-backup imports the shared api-utils, which pulls in next-auth; stub
// the auth module so the unit environment can resolve the import graph.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  setting: { findUnique: vi.fn(), upsert: vi.fn() },
  $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
}))
vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({
  prisma: { setting: mocks.setting, $transaction: mocks.$transaction },
}))

import { normaliseSettingEntry, importSettings } from '@/lib/server/settings-backup'
import { isEncryptedPayload } from '@/lib/crypto'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.SETTINGS_ENCRYPTION_KEY = 'unit-test-encryption-key-with-enough-entropy'
  mocks.setting.findUnique.mockResolvedValue(null)
  mocks.setting.upsert.mockResolvedValue({ key: 'k' })
})

afterEach(() => {
  delete process.env.SETTINGS_ENCRYPTION_KEY
})

describe('normaliseSettingEntry', () => {
  it('accepts a plain scalar as a STRING setting', () => {
    expect(normaliseSettingEntry('site_name', 'BIOSCOPE')).toEqual({
      value: { key: 'site_name', value: 'BIOSCOPE', type: 'STRING', category: 'GENERAL', isPublic: false },
    })
  })

  it('infers BOOLEAN and NUMBER types', () => {
    expect(normaliseSettingEntry('flag', true).value?.type).toBe('BOOLEAN')
    expect(normaliseSettingEntry('threshold', 2000).value?.type).toBe('NUMBER')
  })

  it('accepts a structured export entry', () => {
    expect(
      normaliseSettingEntry('global_tax_percent', {
        value: 7,
        type: 'NUMBER',
        category: 'TAX',
        isPublic: true,
        description: 'Tax',
      })
    ).toEqual({
      value: {
        key: 'global_tax_percent',
        value: '7',
        type: 'NUMBER',
        category: 'TAX',
        isPublic: true,
        description: 'Tax',
      },
    })
  })

  it('rejects entries with no value', () => {
    expect(normaliseSettingEntry('k', { type: 'STRING' }).reason).toBe('missing value')
  })

  it('rejects unknown types and categories rather than guessing', () => {
    expect(normaliseSettingEntry('k', { value: 'x', type: 'DATE' }).reason).toContain('unknown type')
    expect(normaliseSettingEntry('k', { value: 'x', category: 'NOPE' }).reason).toContain('unknown category')
  })

  it('rejects non-scalar values and unsupported shapes', () => {
    expect(normaliseSettingEntry('k', { value: { nested: true } }).reason).toContain('must be a string')
    expect(normaliseSettingEntry('k', null).reason).toBe('unsupported entry')
    expect(normaliseSettingEntry('k', ['x']).reason).toBe('unsupported entry')
  })

  it('bounds value and description lengths', () => {
    expect(normaliseSettingEntry('k', 'x'.repeat(10001)).reason).toBe('value too long')
    expect(normaliseSettingEntry('k', { value: 'x', description: 'd'.repeat(501) }).reason).toBe(
      'description too long'
    )
  })
})

describe('importSettings envelope validation', () => {
  it('rejects a future backup version with UNSUPPORTED_BACKUP_VERSION', async () => {
    await expect(
      importSettings({ version: 99, settings: { site_name: 'X' } })
    ).rejects.toMatchObject({ status: 400, code: 'UNSUPPORTED_BACKUP_VERSION' })
    expect(mocks.setting.upsert).not.toHaveBeenCalled()
  })

  it('rejects a malformed envelope with INVALID_BACKUP', async () => {
    await expect(importSettings(null)).rejects.toMatchObject({ status: 400, code: 'INVALID_BACKUP' })
    await expect(importSettings({ version: 1 })).rejects.toMatchObject({ code: 'INVALID_BACKUP' })
    await expect(
      importSettings({ version: 1, settings: 'not-an-object' })
    ).rejects.toMatchObject({ code: 'INVALID_BACKUP' })
  })

  it('rejects an oversized settings map', async () => {
    const settings: Record<string, string> = {}
    for (let i = 0; i < 501; i += 1) settings[`key_${i}`] = 'v'
    await expect(importSettings({ version: 1, settings })).rejects.toMatchObject({
      status: 400,
      code: 'BACKUP_TOO_LARGE',
    })
  })

  it('applies valid entries and skips bad ones with reasons', async () => {
    const result = await importSettings({
      version: 1,
      exportedAt: '2026-11-19T00:00:00.000Z',
      settings: {
        site_name: 'BIOSCOPE',
        global_tax_percent: { value: 5, type: 'NUMBER', category: 'TAX', isPublic: true },
        'BAD KEY': 'x',
        broken: { value: 'x', type: 'DATE' },
      },
    })
    expect(result.applied).toBe(2)
    expect(result.skipped).toEqual([
      { key: 'BAD KEY', reason: 'invalid key' },
      { key: 'broken', reason: 'unknown type "DATE"' },
    ])
    expect(mocks.$transaction).toHaveBeenCalledTimes(1)
  })

  it('never writes a masked secret, even into a fresh database', async () => {
    const result = await importSettings({
      version: 1,
      settings: { smtp_password: 'Live••••••••et99' },
    })
    expect(result.applied).toBe(0)
    expect(result.skipped[0].reason).toContain('masked')
    expect(mocks.setting.upsert).not.toHaveBeenCalled()
  })

  it('encrypts a real credential before it touches the database', async () => {
    const result = await importSettings({
      version: 1,
      settings: { smtp_password: 'a-real-password' },
    })
    expect(result.applied).toBe(1)
    const upsert = mocks.setting.upsert.mock.calls[0][0]
    expect(isEncryptedPayload(upsert.create.value)).toBe(true)
    expect(upsert.create.value).not.toContain('a-real-password')
  })
})

describe('POST /api/settings/backup response envelope', () => {
  it('returns applied/skipped at data.* — the shape BackupSettings reads', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'u-admin', email: 'admin@example.com', role: 'ADMIN' } })
    const { POST } = await import('@/app/api/settings/backup/route')
    const res = await POST(
      new Request('http://localhost/api/settings/backup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version: 1, settings: { site_name: 'BIOSCOPE' } }),
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    // The UI does json.data.applied and json.data.skipped.length — a double
    // envelope (data.data) crashes the restore panel with a TypeError.
    expect(json.success).toBe(true)
    expect(json.data.applied).toBe(1)
    expect(Array.isArray(json.data.skipped)).toBe(true)
  })
})
