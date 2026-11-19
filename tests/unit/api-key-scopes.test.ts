import { describe, it, expect } from 'vitest'
import { hasAllScopes } from '@/lib/validations/api-key'

describe('hasAllScopes', () => {
  it('requires every requested scope, not just one', () => {
    expect(hasAllScopes(['orders:read'], ['orders:read', 'orders:write'])).toBe(false)
    expect(hasAllScopes(['orders:read', 'orders:write'], ['orders:read', 'orders:write'])).toBe(true)
  })

  it('accepts a key holding a superset of the required scopes', () => {
    expect(hasAllScopes(['orders:read', 'orders:write', 'products:read'], ['orders:read'])).toBe(true)
  })

  it('rejects a key with none of the required scopes', () => {
    expect(hasAllScopes(['products:read'], ['orders:read'])).toBe(false)
    expect(hasAllScopes([], ['orders:read'])).toBe(false)
  })
})
