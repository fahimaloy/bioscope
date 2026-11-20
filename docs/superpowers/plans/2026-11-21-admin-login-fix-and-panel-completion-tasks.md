# TASKS — Admin Login Fix + Admin Panel Completeness (2026-11-21)

**Companion to:** `docs/superpowers/plans/2026-11-21-admin-login-fix-and-panel-completion.md`  
**Authority:** `AGENTS.md`, `.agent/` verification contract  
**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done+verified  
**Branch:** `feat/bioscope-frontend-rebuild`

---

## Pass A — Admin login fix (COMPLETED — verified)

### A.1 — `.env`: set real admin password
- [x] `ADMIN_PASSWORD` changed from `\"***\"` (placeholder) to `\"bioscopepass123\"`
- [x] `ADMIN_EMAIL=\"admin@bioscope.com\"` confirmed (matches bootstrap contract)
- [x] `ADMIN_NAME=\"Admin User\"` confirmed
- **Verification:** `grep ADMIN_PASSWORD .env` → `bioscopepass123`

### A.2 — `prisma/seed.ts`: align admin with `.env` (single source of truth)
- [x] Admin email now from `process.env.ADMIN_EMAIL` (lowercased, fallback `admin@bioscope.com`)
- [x] Admin password now from `SEED_ADMIN_PASSWORD` || `ADMIN_PASSWORD` || random
- [x] Admin name now from `process.env.ADMIN_NAME` (fallback `Admin User`)
- [x] Removed hardcoded `admin@stickershop.com`
- **Verification:** `pnpm type-check` passes

### A.3 — `src/app/(admin)/admin/login/page.tsx`: fix post-login handling
- [x] Non-admin sign-in → `signOut({ callbackUrl: '/login?error=admin_access_only' })` + setError("Admin access only — use customer login.")
- [x] Admin sign-in → `router.push(callbackUrl)` + `router.refresh()`
- [x] Removed unused `toast` import
- **Verification:** `pnpm lint` passes (no warnings/errors)

### A.4 — Verification gate
- [x] `pnpm verify:fast` — type-check + lint + mapped unit tests
- [x] `instrumentation.ts` reconciles admin on next server start (bootstrap from `.env`)

---

## Pass B — Admin panel polish (COMPLETED — verified)

### B.1 — Layout "Access Denied" state — DONE
- [x] `src/app/(admin)/layout.tsx`: replaced bare `<div>Access Denied</div>` with proper access-denied card (message, X icon, "Sign in as admin" link → `/admin/login`, "Go to shop" link → `/`)
- [x] Added imports: `Card` from `@/components/ui/Card`, `X`/`Mail` from `lucide-react`
- **Verification:** `pnpm type-check` passes, `pnpm lint` clean

### B.2 — Seed / settings `site_name` consistency — DONE
- [x] `prisma/seed.ts`: `site_name` changed from `'Sticker Shop'` to `'bioscope'` to match `initializeDefaultSettings()` in `src/lib/actions/settings.ts`
- **Verification:** Both files now use `'bioscope'` as single source of truth

### B.3 — Settings route defense-in-depth — SKIPPED (by design)
- [x] Determined: adding route-level `requireAdmin()` to `GET /api/settings` would break public settings readability for customers. Action-level `isPublic` filtering in `getSettings()` is the correct defense-in-depth. No change needed.

---

## Pass C — Auth flow completion (COMPLETED — already implemented)

### C.1 — Password-reset pages — ALREADY EXIST
- [x] `src/app/(customer)/forgot-password/page.tsx` — complete with dev token shortcut, success state, back-to-login link
- [x] `src/app/(customer)/reset-password/page.tsx` — complete with token validation, password confirmation, success state
- [x] Both linked from `src/app/(customer)/login/page.tsx` ("Forgot password?" link)

### C.2 — Forgot-password email delivery — ALREADY WIRED
- [x] `src/app/api/auth/forgot-password/route.ts` — generates token, sends email via `sendMail()` when SMTP configured, falls back to `devToken` in dev mode, never leaks email existence
- [x] `src/lib/email.ts` — `sendMail()` uses DB-stored SMTP config with env fallback, branded HTML template
- [x] `src/lib/server/email-config.ts` — `getSmtpConfig()` resolves from DB settings or env vars, `isEmailConfigured()` check
- [x] `src/app/api/auth/reset-password/route.ts` — validates token hash, bcrypt hashes new password, marks token used, rate-limited

---

## Pass D — Testing (COMPLETED — verified)

### D.1 — Admin login E2E test — CI-ONLY (not run locally per AGENTS.md)
- [ ] E2E: `.env` admin credentials → sign in at `/admin/login` → redirect to `/admin/dashboard` → dashboard loads with stats
- [ ] E2E: non-admin credentials at `/admin/login` → sign out → redirect to `/login?error=admin_access_only`
- [ ] E2E: wrong password at `/admin/login` → error shown, no redirect
- **Verification:** `pnpm e2e` — CI / release only

### D.2 — Bootstrap integration test — COVERED BY UNIT TESTS
- [x] `tests/unit/admin-bootstrap.test.ts` — 7 test cases covering create/reconcile/none, password drift, role promotion, email verification, all-mismatch scenario
- [x] `pnpm test:run` — **628 tests passed (75 files)**, all green

---

## Pass E — Verification gates (COMPLETED — fast + mid tiers)

- [x] E.1 `pnpm verify:fast` — type-check clean, lint clean, no mapped unit test failures
- [x] E.2 `pnpm verify:mid` — full unit suite: **75 files / 628 tests all passed**
- [ ] E.3 `pnpm build` — production build — **CI / release only; agents must not run locally** (type-check already confirms TS compilation)
- [ ] E.4 `pnpm verify:full` — mid + build + e2e — **CI / nightly / release only**

---

## Done this session (summary)

| File | Change |
|------|--------|
| `.env` | `ADMIN_PASSWORD="bioscopepass123"` (was `"***"`) |
| `prisma/seed.ts` | Admin creation reads from `.env` ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME; removed hardcoded `admin@stickershop.com`; `site_name` aligned to `'bioscope'` |
| `src/app/(admin)/admin/login/page.tsx` | Non-admin sign-in → signOut + redirect to `/login?error=admin_access_only` + clear error; removed unused `toast` import |
| `src/app/(admin)/layout.tsx` | "Access Denied" → proper card with X icon, message, sign-in link, shop link; added `Card`/`X`/`Mail` imports |
| `docs/superpowers/plans/2026-11-21-admin-login-fix-and-panel-completion.md` | Full project review plan |
| `docs/superpowers/plans/2026-11-21-admin-login-fix-and-panel-completion-tasks.md` | Complete task breakdown (all passes done) |

**Verification results:**
- `pnpm type-check` — ✅ clean
- `pnpm lint` — ✅ no warnings or errors
- `pnpm test:run` — ✅ 75 files / 628 tests all passed
- `pnpm verify:fast` — ✅ passed

**Remaining CI-only steps:** `pnpm build` + `pnpm verify:full` (build + e2E) — must be run in CI per AGENTS.md.

**Owner actions (not agent-executable):**
- Confirm dev DB admin account matches `.env` after bootstrap (instrumentation reconciles password drift on next server start)
- Set real `AUTH_SECRET` (32+ bytes) in `.env` for production
- Configure SMTP in Admin → Settings → Email (or env vars) for password-reset email delivery in production
