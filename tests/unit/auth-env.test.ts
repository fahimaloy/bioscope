/**
 * B4 — boot-time auth environment validation (src/lib/auth-secret.ts).
 * Pure function; instrumentation.ts applies the verdict (fatal → exit(1)).
 * The quoted-URL case is the ledger's Task 1.2 UntrustedHost trap.
 */
import { describe, it, expect } from 'vitest'
import { validateAuthEnv, parseRememberMe } from '@/lib/auth-secret'

const GOOD_SECRET = 'x'.repeat(44)
const base = { AUTH_SECRET: GOOD_SECRET, AUTH_URL: 'https://shop.example.com' }

describe('validateAuthEnv', () => {
  it('accepts a complete production environment with no warnings', () => {
    const report = validateAuthEnv(base, 'production')
    expect(report.fatal).toBeUndefined()
    expect(report.warnings).toEqual([])
  })

  it('is fatal in every environment when no signing secret exists', () => {
    for (const nodeEnv of ['development', 'production']) {
      const report = validateAuthEnv({ AUTH_URL: base.AUTH_URL }, nodeEnv)
      expect(report.fatal).toMatch(/signing secret/i)
    }
  })

  it('falls back to the legacy NEXTAUTH_SECRET / NEXTAUTH_URL names', () => {
    const report = validateAuthEnv(
      { NEXTAUTH_SECRET: GOOD_SECRET, NEXTAUTH_URL: 'http://localhost:3000' },
      'production'
    )
    expect(report.fatal).toBeUndefined()
    expect(report.warnings).toEqual([])
  })

  it('warns (not fatal) on a short secret', () => {
    const report = validateAuthEnv({ ...base, AUTH_SECRET: 'short' }, 'production')
    expect(report.fatal).toBeUndefined()
    expect(report.warnings.join(' ')).toMatch(/shorter than 32/)
  })

  it('is fatal in production when no URL and no AUTH_TRUST_HOST', () => {
    const report = validateAuthEnv({ AUTH_SECRET: GOOD_SECRET }, 'production')
    expect(report.fatal).toMatch(/AUTH_URL/)
  })

  it('AUTH_TRUST_HOST=true substitutes for the URL in production', () => {
    const report = validateAuthEnv(
      { AUTH_SECRET: GOOD_SECRET, AUTH_TRUST_HOST: 'true' },
      'production'
    )
    expect(report.fatal).toBeUndefined()
  })

  it('only warns about a missing URL in development', () => {
    const report = validateAuthEnv({ AUTH_SECRET: GOOD_SECRET }, 'development')
    expect(report.fatal).toBeUndefined()
    expect(report.warnings.join(' ')).toMatch(/localhost:3000/)
  })

  it('detects the nested-quote .env trap (UntrustedHost) — fatal in prod, warning in dev', () => {
    const quoted = { AUTH_SECRET: GOOD_SECRET, NEXTAUTH_URL: '"http://localhost:3000"' }
    expect(validateAuthEnv(quoted, 'production').fatal).toMatch(/quotes|UntrustedHost/)
    const dev = validateAuthEnv(quoted, 'development')
    expect(dev.fatal).toBeUndefined()
    expect(dev.warnings.join(' ')).toMatch(/UntrustedHost/)
  })

  it('rejects an unparseable or non-http URL', () => {
    for (const bad of ['not a url', 'ftp://shop.example.com', 'shop.example.com']) {
      const report = validateAuthEnv({ AUTH_SECRET: GOOD_SECRET, AUTH_URL: bad }, 'production')
      expect(report.fatal, bad).toMatch(/clean origin/)
    }
  })
})

describe('parseRememberMe', () => {
  it('treats absent / true / "true" as remembered (30-day default)', () => {
    for (const raw of [undefined, null, true, 'true', 'on']) {
      expect(parseRememberMe(raw), String(raw)).toBe(true)
    }
  })

  it('treats only explicit false / "false" as the 1-day opt-in', () => {
    expect(parseRememberMe(false)).toBe(false)
    expect(parseRememberMe('false')).toBe(false)
  })
})
