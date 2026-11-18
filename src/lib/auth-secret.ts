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
