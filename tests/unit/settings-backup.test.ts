import { describe, it, expect, vi } from 'vitest'

// settings-backup imports the shared api-utils, which pulls in next-auth; stub
// the auth module so the unit environment can resolve the import graph.
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { normaliseSettingEntry } from '@/lib/server/settings-backup'

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
})
