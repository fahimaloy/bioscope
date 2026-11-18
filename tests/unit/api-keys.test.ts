import { describe, it, expect, vi } from 'vitest'
import { createHash } from 'crypto'

// api-keys imports the shared api-utils, which pulls in next-auth; the unit
// environment cannot resolve next-auth's next/server peer, so stub the auth
// module the way the route-handler tests do.
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { apiKeyCreateSchema, API_KEY_SCOPES } from '@/lib/validations/api-key'
import { hashApiKey } from '@/lib/server/api-keys'

describe('apiKeyCreateSchema', () => {
  it('accepts a name and scopes', () => {
    expect(apiKeyCreateSchema.safeParse({ name: 'Nightly sync', scopes: ['orders:read'] }).success).toBe(true)
  })

  it('accepts an expiry', () => {
    const expiry = new Date(Date.now() + 86_400_000).toISOString()
    expect(apiKeyCreateSchema.safeParse({ name: 'Temp', scopes: ['orders:read'], expiresAt: expiry }).success).toBe(true)
  })

  it('rejects an unknown scope', () => {
    expect(apiKeyCreateSchema.safeParse({ name: 'Bad', scopes: ['orders:delete'] }).success).toBe(false)
  })

  it('rejects no scopes and a too-short name', () => {
    expect(apiKeyCreateSchema.safeParse({ name: 'Bad', scopes: [] }).success).toBe(false)
    expect(apiKeyCreateSchema.safeParse({ name: 'x', scopes: ['orders:read'] }).success).toBe(false)
  })

  it('exposes only read/write resource scopes', () => {
    expect(API_KEY_SCOPES.every((scope) => scope.includes(':'))).toBe(true)
    expect(API_KEY_SCOPES).toContain('orders:read')
  })
})

describe('hashApiKey', () => {
  it('is SHA-256 of the plaintext, so a dump cannot replay the key', () => {
    const plaintext = 'bsk_live_' + 'a'.repeat(64)
    expect(hashApiKey(plaintext)).toBe(createHash('sha256').update(plaintext).digest('hex'))
    expect(hashApiKey(plaintext)).not.toContain(plaintext)
  })

  it('changes when the plaintext changes', () => {
    expect(hashApiKey('bsk_live_a')).not.toBe(hashApiKey('bsk_live_b'))
  })
})
