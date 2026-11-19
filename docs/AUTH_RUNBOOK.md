# Auth runbook (B4)

Operator-facing reference for authentication environment, session lifetimes,
and the admin password-reset path. Code: `src/lib/auth-secret.ts`,
`src/auth.config.ts`, `src/lib/auth.ts`, `src/instrumentation.ts`,
`src/lib/admin-bootstrap.ts`.

## 1. Required environment

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` (or legacy `NEXTAUTH_SECRET`) | **always** | JWT signing/encryption secret. Generate: `openssl rand -base64 32`. `AUTH_SECRET` wins when both are set. |
| `AUTH_URL` (or legacy `NEXTAUTH_URL`) | production | Public origin, e.g. `https://shop.example.com`. No path, no trailing slash, **no nested quotes**. |
| `AUTH_TRUST_HOST=true` | alternative | Only behind a trusted proxy that sets `X-Forwarded-Host`/`-Proto`; substitutes for `AUTH_URL` in production. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | optional | Bootstrap admin (see §3). |
| `ADMIN_BOOTSTRAP=0` | optional | Opts out of bootstrap reconcile entirely. |

**Fail-fast at boot.** `instrumentation.ts` runs `validateAuthEnv()` before
anything else on the node runtime:

- missing secret → **fatal in every environment** (`process.exit(1)` with a
  clear `[auth-env] FATAL` log) — without it every sign-in fails;
- missing URL in production without `AUTH_TRUST_HOST` → **fatal**;
- URL containing quote characters or not a parseable http(s) origin →
  **fatal in production, warning in dev**. This is the `.env` nested-quote
  trap: dotenv strips one layer of quotes, so `NEXTAUTH_URL=""http://…""`
  reaches next-auth as `"http://…"` and every auth request dies with
  `UntrustedHost`;
- secret shorter than 32 chars → warning;
- missing URL in dev → warning (falls back to `http://localhost:3000`).

Never commit `.env`; `.env.example` holds placeholders only.

## 2. Session lifetimes (rememberMe)

- Strategy: JWT (no adapter), cookie `maxAge` 30 days.
- **Remember me checked (the default):** session lives 30 days.
- **Remember me unchecked:** session expires **24 hours after sign-in,
  absolutely** — not 24h of inactivity.

Mechanism (verified against `@auth/core` 0.41.3): the encoder re-stamps
`iat`/`exp` on *every* session fetch, so rolling claims cannot express an
absolute lifetime. Instead the jwt callback writes an `authTime` claim at
sign-in and returns `null` once `authTime + 24h` has passed for a
non-remembered token. Returning null makes the session action **clear the
cookie**; middleware (`authorized`), server `auth()` and the client session
fetch all see no session — fail closed everywhere.

- The login form sends `rememberMe` through `signIn('credentials')`; the
  callback POST form-encodes it, so `parseRememberMe()` accepts `'false'`
  (string) and `false` (boolean) as the only opt-outs. Absent = remembered.
- Tokens minted before B4 carry no `authTime`/`rememberMe` and stay on the
  30-day default (no forced sign-out on deploy).
- Tests: `tests/unit/auth-session.test.ts` (incl. the iat-restamp regression
  guard), `tests/unit/auth-env.test.ts`.

## 3. Admin password reset (bootstrap reconcile)

There is **no separate reset mechanism to invent** — the bootstrap is the
reset path, and it runs on every server start:

1. Set `ADMIN_EMAIL` and the new `ADMIN_PASSWORD` in `.env` (email is
   lowercased/trimmed to match the credentials provider).
2. Restart the server (`pnpm dev` / `pnpm start`).
3. `instrumentation.ts` → `planAdminBootstrap()` compares the stored hash
   against `ADMIN_PASSWORD` and reconciles: re-hashes a drifted password,
   promotes a non-admin account, marks the email verified (credentials
   login requires it). Creates the account when missing.
4. Sign in at `/admin/login` with the env credentials.

Logs record only the action taken — never the email or password (PII rule).
A concurrent boot racing on create is tolerated (P2002 → "already exists").
Set `ADMIN_BOOTSTRAP=0` to disable; with it disabled the env credentials do
nothing and a locked-out admin needs a manual DB hash update.

## 4. Rotating `AUTH_SECRET`

Rotation invalidates **every existing session** (old JWTs can no longer be
decrypted) — all users sign in again. There is no dual-key grace period in
this setup; rotate during low traffic:

1. Generate a new secret (`openssl rand -base64 32`).
2. Replace `AUTH_SECRET` in the deployment environment.
3. Restart. Expect a one-time wave of sign-ins; nothing else migrates.

`SETTINGS_ENCRYPTION_KEY` is a **different** secret (encrypted settings
values — SMTP/webhook/payment credentials). Losing it makes stored
credentials unrecoverable by design; its custody/rotation runbook is Track
D11 (pending). Do not rotate it casually — it needs a re-encrypt sweep.

## 5. Rate limits on auth surfaces (B3 / E1)

Per-IP sliding window, in-process memory (`src/lib/rate-limit.ts`):
login 10/min, register 10/min, forgot-password 5/min, reset-password 5/min,
change-password 10/min, contact 5/min. 429 responses carry `Retry-After`.
Caveats: per-process (N instances ⇒ N× effective limit; Redis upgrade path
named in-file), node-side only, XFF spoofable without a trusted proxy — a
speed bump, not an access control.
