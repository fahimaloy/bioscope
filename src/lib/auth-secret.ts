// Single source of truth for Auth.js / JWT signing secrets.
// Auth.js (@auth/core v5 beta) reads ONLY AUTH_SECRET* env vars. Legacy repos
// (and the documented contracts in AGENTS.md) use NEXTAUTH_SECRET, so the app
// accepts either but writes AUTH_SECRET everywhere new. Never hardcode secrets.
let _cached: string | undefined
export function authSecret(): string {
  if (_cached !== undefined) return _cached
  _cached = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? ''
  return _cached
}
export function authUrl(rootUrl?: string): string {
  return (
    rootUrl ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  )
}

export interface AuthEnvReport {
  /** Present when the server cannot safely serve auth at all — boot must stop. */
  fatal?: string
  warnings: string[]
}

/**
 * B4 — fail fast at boot instead of per-request `UntrustedHost` /
 * `Configuration` errors. Pure so it is unit-testable; instrumentation.ts
 * applies the verdict (fatal → exit(1), warnings → log).
 *
 * - A signing secret is mandatory in every environment: without one, every
 *   credentials sign-in fails and JWTs cannot be verified.
 * - A public URL (AUTH_URL / NEXTAUTH_URL) is mandatory in production unless
 *   AUTH_TRUST_HOST=true opts into host inference (proxy deployments).
 * - Short secrets are warned about, not rejected (dev convenience).
 */
export function validateAuthEnv(
  env: Record<string, string | undefined>,
  nodeEnv: string
): AuthEnvReport {
  const warnings: string[] = []
  const secret = env.AUTH_SECRET ?? env.NEXTAUTH_SECRET
  if (!secret) {
    return {
      fatal:
        'No auth signing secret. Set AUTH_SECRET (or legacy NEXTAUTH_SECRET) — generate one with `openssl rand -base64 32`. Every sign-in fails without it.',
      warnings,
    }
  }
  if (secret.length < 32) {
    warnings.push('Auth secret is shorter than 32 characters — use a generated 32+ byte secret in production.')
  }
  const url = env.AUTH_URL ?? env.NEXTAUTH_URL
  const trustHost = env.AUTH_TRUST_HOST === 'true'
  // The ledger's Task 1.2 trap: nested quotes in .env survive dotenv's one
  // layer of stripping, so next-auth sees a host of `"http://…"` and rejects
  // every auth request with UntrustedHost. Catch it at boot, not per-request.
  if (url && (/["']/.test(url) || !isParseableUrl(url))) {
    const msg = `AUTH_URL/NEXTAUTH_URL is not a clean origin (got a value with quotes or an unparseable URL). Remove nested quotes in .env — next-auth rejects malformed hosts with UntrustedHost on every auth request.`
    if (nodeEnv === 'production') return { fatal: msg, warnings }
    warnings.push(msg)
  }
  if (!url && !trustHost) {
    if (nodeEnv === 'production') {
      return {
        fatal:
          'No AUTH_URL (or legacy NEXTAUTH_URL) in production. Set it to the public origin (e.g. https://shop.example.com) or set AUTH_TRUST_HOST=true behind a trusted proxy — otherwise every auth request fails with UntrustedHost.',
        warnings,
      }
    }
    warnings.push('No AUTH_URL/NEXTAUTH_URL set — falling back to http://localhost:3000 (dev only).')
  }
  return { warnings }
}

/**
 * B4 — rememberMe arrives form-encoded from the credentials callback POST
 * ('true'/'false' strings) or as a boolean from direct signIn calls. Absent
 * means remembered (30 days); only an explicit false opts into the 1-day
 * session. Pure so the convention is unit-testable without prisma/bcrypt.
 */
export function parseRememberMe(raw: unknown): boolean {
  return raw !== 'false' && raw !== false
}

/** http(s) origin check — `new URL` accepts bare words, so pin the protocol. */
function isParseableUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
