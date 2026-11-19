# PLAN — Stability, Security & Completion (2026-11-19)

> **Live tracker.** Reconciled 2026-11-19: `main` (Track A + admin-panel completeness)
> merged into `feat/bioscope-frontend-rebuild` (B1/B2-partial/B3). The earlier
> "withdrawn by parallel session" banner is superseded — the owner instructed
> "check all remaining plans and tasks files and properly continue implementing all"
> (2026-11-19), which is the confirmation the banner asked for. Execution records
> below; per-task state lives in the SDD ledger
> (`.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/progress.md`).

**Consolidates:** the open items from the 18–19 Nov code review
(`2026-11-15-shop-admin-auth-overhaul-tasks.md` §Follow-up 2026-11-19), the
remaining tasks of the frontend rebuild
(`2026-11-06-bioscope-frontend-rebuild.md`, tasks 2.8–5.1), the tracked defects
in the SDD ledger (`.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/progress.md`),
and a fresh whole-project review pass (2026-11-19).

**Authority:** `docs/DESIGN_CONTRACT.md` (visual), `AGENTS.md` + `.agent/` (gates).
**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done+verified.
**Gates:** `pnpm verify:fast` inner loop · `pnpm verify:mid` before done ·
GitNexus impact before every edit, `detect-changes` before every commit ·
`verify:full` is CI/nightly only.

## State at plan time (verified, not assumed)

- `main = d54072c`, clean, pushed. Secrets/security review fixes landed
  (`6dbd3ba`, `dc3b396`); verify:mid green (41 files / 367 tests).
- Rebuild plan: Phase 0, Phase 1, tasks 2.1–2.7 closed. **2.8–2.13, 3.1–3.6,
  4.1–4.2, 5.1 never ran.**
- Overhaul plan: 86/87 (5.3 visual QA is owner-side). Admin *features* are
  complete (realtime, inventory, customers, email, invoice, webhooks, API keys,
  backup, revision loop, order-from-request) but admin *visuals* still carry
  legacy token classes (17 files).
- **New P0 found by this pass: `/profile` renders `mockUser` ("John Doe") to
  every signed-in customer** — `profile/page.tsx:18,923,927`. Only the
  change-password call is real. `/api/user/me` (GET/PATCH) and `/api/addresses`
  already exist and are unused by the page.
- **New security finding: `/api/customers/export` has a local `csvEscape`
  without formula-injection neutralisation** — customer-supplied name/phone
  starting `= + - @` executes in Excel. The other three exporters use the shared
  `escapeCsvCell`; this one was missed.
- Confirmed still-live tracked defects: `DataTable` raw-key comparator
  (money sorts lexicographically; `ui/DataTable.tsx:87-96`), no-op sort keys
  (customers `orders/spent/joined`, products `price`), `shadow-[var(--shadow-*)]`
  compiles to `--tw-shadow-color` with **no box-shadow** (Tailwind probe
  2026-11-19: ambiguous arbitrary value → colour, ~30 sites incl. every Button),
  `?redirect=` links dropped by `/login` (reads only `callbackUrl`),
  `admin/ProductPreview.tsx` raw Decimal string compare.
- No rate limiting anywhere (auth, contact, webhook test, headless).
- Analytics page still ships `todayOrders/conversionRate/pendingCustomRequests = 0`
  placeholders (`analytics/page.tsx:110-113`) although `/api/orders/stats` and
  `/api/custom-requests/stats` exist.
- `/track-order`, `/faq`, `/shipping`, `/returns`, `/privacy`, `/terms` etc. do
  not exist; Footer links to them are dead.
- About page carries fabricated stats ("500 Happy Customers") — banned by the
  rebuild plan's copy constraint unless the owner approves.

---

## Track A — Security & stability fixes (review open items + new findings)

> Implemented 2026-11-19 in this pass unless marked otherwise. Each task lists
> the mechanism, not just the symptom. GitNexus: `dispatchWebhook` impact is
> **CRITICAL** (19 upstream callers — every order/custom-request mutation and
> checkout); changes to it preserve the never-throws contract and the
> `DeliveryResult` shape, and are covered by new regression tests.

### A1 — Tier filter & customer export: aggregate in the database `[x]`
- **Was:** `buildCustomerWhere` loaded *every customer with every order row*
  into memory to resolve tiers (`src/lib/customers.ts:49-59`);
  `/api/customers/export` did the same per exported user. O(customers×orders)
  memory on a list page; falls over as order history grows.
- **Fix:** `prisma.order.groupBy({ by:['userId'], _sum:{ total:true } })` —
  one aggregated row per customer, computed by Postgres. New shared
  `lifetimeSpendByCustomer()` helper used by both the filter and the export.
  Customers with zero orders resolve to spend 0 (tier `New` unless overridden).
  `minOrders` intersection now uses a `Set` (was O(n²) `includes`).
- **Files:** `src/lib/customers.ts`, `src/app/api/customers/export/route.ts`.
- **Accept:** tier filter + export return identical cohorts to the old logic
  (unit-tested incl. override-wins and zero-order cases); no `orders:` include
  remains in either path.

### A2 — Product import: atomic upsert, per-row error isolation `[x]`
- **Was:** find-then-create/update race (`actions/product.ts:227-242`): two
  concurrent imports of the same slug both create → P2002 aborts the whole
  import mid-file with a 500 and no row report; any DB error mid-loop aborts
  remaining rows silently.
- **Fix:** per-row `try/catch` → row-level error report, import continues;
  P2002 on create retried once as an update (lost-create-race resolution);
  P2025 on update reported as a row error; duplicate slugs *within one file*
  rejected with a row error; row cap (500) bounds work. Dimension/quantity
  replacement stays a single nested Prisma write (atomic).
- **Files:** `src/lib/actions/product.ts`, `src/lib/product-csv.ts` (dup detection).
- **Accept:** concurrent same-slug imports converge to one product; a bad row
  never aborts the file; counters + errors accurate (unit tests).

### A3 — Webhook delivery log: PII redaction + retention pruning `[x]`
- **Was:** `WebhookDelivery.payload` stores the *full* order/custom-request
  payload (email, phone, shipping address) forever — PII retained with no
  pruning, readable by any admin via the delivery log.
- **Fix:** subscribers still receive the full payload over HTTPS (contract
  unchanged), but the *stored log copy* is redacted: `user`, `address`,
  `shipping*` fields and any `*email*`/`*phone*` key replaced with
  `[redacted]` (recursive, depth-bounded). Operational fields (orderNumber,
  status, totals, items) survive. Pruning: deliveries older than 30 days
  deleted opportunistically after dispatch, throttled to once/hour, wrapped so
  it can never throw into the triggering mutation.
- **Files:** `src/lib/server/webhooks.ts`.
- **Accept:** redaction unit tests (PII gone, operational fields kept, arrays
  and nesting handled); prune deletes only expired rows; dispatch never-throws
  property preserved when redact/prune fail.
- **Note:** existing rows keep their old payloads until they age out; a one-off
  cleanup is part of D2.

### A4 — Settings backup import: Zod envelope + bounded payload `[x]`
- **Was:** hand-rolled checks, no version gate (a `version: 99` file imports
  silently), no size/count bounds, `description`/`isPublic` untyped.
- **Fix:** Zod envelope (`version: 1` literal, `settings` record) parsed at the
  edge; per-entry Zod schema keeps the skip-with-reason semantics (one bad
  entry never aborts the restore); unknown version → 400
  `UNSUPPORTED_BACKUP_VERSION`; >500 entries → 400; value ≤ 10 000 chars;
  route caps the body at 1 MB. Secret handling (mask = unchanged, encrypt on
  write) untouched.
- **Files:** `src/lib/server/settings-backup.ts`, `src/app/api/settings/backup/route.ts`,
  `src/lib/validations/settings.ts`.
- **Accept:** malformed envelope 400; bad entries skipped with reasons;
  round-trip export→import still preserves credentials (existing live check).

### A5 — Export/list filters validated; customers CSV injection closed `[x]`
- **Was:** `orders/export` and `custom-requests/export` cast
  `status as never` (invalid enum → Prisma 500) and feed raw strings to
  `new Date()` (Invalid Date → 500); `getOrders` likewise unvalidated;
  `customers/export` used a local escape **without formula neutralisation**.
- **Fix:** Zod filter schemas (`orderExportFiltersSchema`,
  `customRequestExportFiltersSchema`, `orderFiltersSchema` for `getOrders`) —
  status enums from Prisma, trimmed search ≤ 200 chars, coerced dates,
  non-negative amounts. Invalid input → 400 with field errors via
  `handleRouteError`. Customers export switched to shared `escapeCsvCell`.
- **Files:** `src/lib/validations/order.ts`, `src/lib/validations/custom-request.ts`,
  `src/app/api/orders/export/route.ts`, `src/app/api/custom-requests/export/route.ts`,
  `src/lib/actions/order.ts` (getOrders), `src/app/api/customers/export/route.ts`.
- **Accept:** invalid status/date → 400 (route tests); `=HYPERLINK(...)` in a
  customer name exports as `'=HYPERLINK(...)`; valid filters unchanged.

### A6 — DataTable: numeric-aware sort + real sort keys `[x]`
- **Was:** raw `<`/`>` on row values — serialized Decimals sort
  lexicographically (`"110.00" < "80.00"`); customers `orders/spent/joined` and
  products `price` keys match no row field → sorting silently disabled.
- **Fix:** comparator coerces numeric strings (both finite) to numbers,
  handles null/undefined deterministically, falls back to `localeCompare`;
  keys corrected to `orderCount`/`totalSpent`/`createdAt`/`basePrice`.
- **Files:** `src/components/ui/DataTable.tsx`,
  `src/app/(admin)/admin/customers/page.tsx`, `src/components/admin/ProductsPage.tsx`.
- **Accept:** unit test sorts `['1200.00','80.00','900.00']` →
  `80, 900, 1200`; every `sortable` column key exists on its row type.
- **Risk:** GitNexus CRITICAL (5 admin pages consume DataTable) — comparator
  only, no API change; covered by tests.

### A7 — Shadow utilities: replace ambiguous arbitrary values `[x]`
- **Was:** `shadow-[var(--shadow-ink-N)]` is type-ambiguous to Tailwind v3 →
  compiles to `--tw-shadow-color` with **no box-shadow** (probe-verified).
  Every Button, Card, builder panel renders flat.
- **Fix:** mechanical rename to the mapped theme utilities
  `shadow-ink-1…4` / `shadow-die-cut` (incl. `hover:`/`focus:` variants),
  ~30 sites / 14 files. Regression test bans `shadow-[var(` in `src/`.
- **Files:** `src/components/ui/{Button,Card,Skeleton,ErrorBoundary,GlobalLoading,ColorPicker}.tsx`,
  `src/components/custom-sticker/*`, `src/app/(customer)/custom-sticker/page.tsx`.
- **Accept:** compiled CSS emits `box-shadow` for the renamed classes (probe);
  scan test green; no visual API change.
- **Risk:** GitNexus CRITICAL (Button: 106 upstream) — class-string only.

### A8 — Login: accept `?redirect=`, guard open redirect `[x]`
- **Was:** four call sites link `/login?redirect=…` but the page reads only
  `callbackUrl` → post-login destination silently dropped (ledger cross-task
  gap from Task 2.4). No validation of the callback target either.
- **Fix:** `safeCallbackUrl()` in `src/lib/utils.ts` — accepts `callbackUrl`
  then `redirect`, allows only single-slash relative paths (blocks `//evil.com`
  and absolute URLs), defaults `/`. Login page uses it for the post-signIn
  push. The four link sites keep working unchanged.
- **Accept:** unit tests for the guard; `?redirect=/checkout` lands on
  `/checkout` after sign-in; `?callbackUrl=https://evil.com` lands on `/`.

### Track A completion report (2026-11-19)

**Commits (main):** `be53905` (A1/A2/A5 data) · `f5430aa` (A3 webhooks) ·
`78d0d82` (A4 backup) · `41fcaee` (A6/A7/A8 ui) · `c6c5987` (backup response
envelope, found by the live smoke — see below).

**Extra defect found by the live smoke, fixed:** `POST /api/settings/backup`
returned `ok({data: result})` → `json.data.data`, while `BackupSettings.tsx`
reads `json.data.applied` / `json.data.skipped.length`. A successful restore
showed "Restored undefined settings" and the result panel threw a TypeError.
Route now returns `ok(result)`; regression test pins the UI's exact shape.

**Verification**
- Gate: `pnpm verify:mid` green — type-check, lint, **47 files / 416 tests**
  (up from 41/367; +49 regression tests incl. the envelope pin).
- Live smoke against the dev server with the bootstrap admin credential:
  **14/14** — admin session; orders/custom-requests export + orders list
  reject unknown status and malformed dates with 400; valid filters export
  CSV; tier-filtered list + export work via the DB aggregate; no
  unneutralised formula cells in the customer export; backup version gate
  400 `UNSUPPORTED_BACKUP_VERSION`; malformed envelope 400 `INVALID_BACKUP`;
  masked-echo restore applied=16 skipped=0 with settings byte-identical
  after the round-trip.
- Tailwind probe (real project config): `shadow-ink-*` / `shadow-die-cut`
  emit `box-shadow`; the old `shadow-[var(--shadow-*)]` form emitted only
  `--tw-shadow-color`. Scan gate bans the old form.
- GitNexus: impact run before every edit; `dispatchWebhook` **CRITICAL**
  (19 upstream), DataTable CRITICAL (5 pages), Button CRITICAL (106) —
  surfaced, not waived; contracts preserved and pinned by tests.
  `detect-changes` complete (no partial) before each commit; risk
  critical/high on the webhook/backup diffs is expected by design.
- Two smoke assertions initially failed on wrong expectations (Node's
  TextDecoder strips the CSV BOM; the double envelope above) — corrected
  and re-run clean, same lesson as the 18–19 Nov review.

**Not verified (needs owner session / browser):** post-login `?redirect=`
landing in a real browser (unit-tested guard + code path only); visual
effect of the restored shadows on every surface (compile-verified, not
eyeballed); webhook redaction against a live subscriber (unit-tested with
a mocked fetch; no endpoint configured in the dev DB).

---

## Track B — P0 functional gaps (write briefs, then dispatch)

### B1 — Profile page: real data instead of `mockUser` (rebuild task 2.8) `[x]`
> **DONE 2026-11-19, commit `6dc21b3` (controller-completed after the implementer was
> interrupted).** Report: `.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/task-b1-report.md`.
> Gates: verify:fast 0/0, full suite 275/275. Notifications/Orders tabs dropped
> (no persistence backend / duplicated `/orders`) — flagged for owner, not silently accepted.
> Live 320px + persistence check still open (C7).
- **Priority: P0 — customers currently see "John Doe", a fake address list and
  fake counts.** The page is otherwise functional-looking, which makes this
  worse than a broken page.
- **Exists today:** `GET /api/user/me` returns `{ user }` with addresses +
  `_count{orders,customRequests,reviews}`; `PATCH /api/user/me` updates
  name/phone/avatar (`updateProfileSchema`); `/api/addresses` CRUD exists;
  change-password already posts to `/api/auth/change-password`.
- **Steps:** replace `mockUser` with a `load()` fetch of `/api/user/me`
  (stable `vi.hoisted` router mock in tests — ledger pitfall); wire AccountTab
  save → PATCH; AddressesTab → `/api/addresses` CRUD with `type="button"` on
  every non-submit control (Task 2.5's order-submitting-address bug class);
  avatar upload only if an upload path exists, else hide the control; keep the
  existing tab structure; token classes per contract (legacy `DoodleBackground`
  out, decor from `@/components/decorative`); loading/error/empty states.
- **Accept:** signed-in user sees their own name/email/phone/addresses/counts;
  profile edit persists; address add/edit/delete/default works; jsdom tests
  mock the **real** envelope (`data.user`, `data.addresses`); 320px no
  horizontal scroll (authenticated browser check — needs owner session).
- **Verify:** focused test + `verify:fast`; live check with dev credential.

### B2 — Analytics: replace the three zero placeholders `[x]`
> **DONE 2026-11-19, controller-executed.** `pendingCustomRequests` wired (`4703009`);
> `todayOrders`/`todayRevenue` now a real server aggregate in `/api/analytics/orders`
> (`today` block, local midnight, paid-definition revenue); `conversionRate` removed
> (no session source — ruling: no fake metrics), card replaced by Pending Requests.
> Fake StatsCards trend badges removed too. verify:mid 461/461; live smoke matches DB.
- `todayOrders` ← `/api/orders/stats` (or a `?range=today` aggregate),
  `pendingCustomRequests` ← `/api/custom-requests/stats`,
  `conversionRate` ← delivered orders ÷ checkout sessions **only if** a session
  source exists; otherwise remove the card (owner decision: no fake metrics).
- **Files:** `src/app/(admin)/admin/analytics/page.tsx`, `src/lib/analytics.ts`.
- **Accept:** no hardcoded 0 metrics remain; values match DB aggregates
  (unit test with mocked prisma + one live check).

### B3 — Rate limiting on public write endpoints `[x]`
> **DONE 2026-11-19, commit `899f740`.** `src/lib/rate-limit.ts` sliding-window log,
> `enforceRateLimit(request, bucket)` → ready 429 + Retry-After; wired into register,
> forgot/reset/change-password, contact (10/5/5/10/5 per min). Tests import the real
> route handlers (301/301). Live-verified: POST /api/contact → 429 RATE_LIMITED.
> Caveats in-file: per-process memory, node-side only, XFF spoofable without trusted proxy.
> Report: `.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/task-b3-report.md`.
> Not yet wired: login attempts, track-order (C4), headless, webhook test.
- **Why:** registration, login, contact, password-reset/change, webhook test
  and headless order creation have no throttling — credential stuffing and
  spam are free today.
- **Design:** small in-memory sliding-window limiter keyed by IP+route in
  `src/lib/rate-limit.ts` (no new deps), applied in the route handlers
  (middleware is edge — keep the limiter node-side). Limits: auth 10/min/IP,
  contact 5/min/IP, headless 60/min/key. 429 + `Retry-After`. Document the
  multi-instance caveat (per-process memory; Redis upgrade path named).
- **Accept:** unit tests (window expiry, per-key isolation); 429 shape via
  `handleRouteError` (`AppError(429,…)`); no PII in logs.

### B4 — Admin password-reset / session hygiene `[ ]`
- Owner-facing runbook + code: `AUTH_SECRET`/`AUTH_URL` env validation at boot
  (fail fast with a clear log, not per-request `UntrustedHost`), session
  maxAge review, and a documented admin-password reset path (bootstrap
  reconcile already exists — document it, don't reinvent).

---

## Track C — Remaining frontend rebuild (reconciled with the overhaul)

> The overhaul shipped admin *features*; these tasks rebuild *visuals* onto the
> token system **without re-plumbing any of it**. Every brief must freeze the
> feature layer (realtime hooks, modals, exports, inventory, history) and say
> so explicitly. Standing rules from the ledger apply: legacy colour/radius
> classes renamed in the same pass; no dynamic class interpolation; three text
> roles only; one decor accent per section; motion on every page.

### C1 — Login & register rebuild (task 2.9) `[ ]`
- Includes A8's convention permanently; register keeps the `signIn('credentials')`
  flow (do not regress to raw POST); admin-rejection toast preserved.
- Files: `(customer)/login/page.tsx`, `(customer)/register/page.tsx`.

### C2 — About & contact rebuild (task 2.10) `[ ]`
- **Owner decision first:** fabricated stats ("500 Happy Customers", "150
  Projects Done") must be removed or replaced with approved copy — the plan
  bans unapproved marketing claims. Contact form already posts `/api/contact`;
  keep the contract, add rate limit (B3) server-side.

### C3 — Content pages: policies + company (tasks 2.11/2.12) `[ ]`
- `/faq`, `/shipping`, `/returns`, `/privacy`, `/terms` (+ blog/careers/press/
  affiliates/accessibility only if owner wants them now). Shared
  `ContentPage` component; **owner must supply or approve legal copy** —
  placeholder legal text is a liability, ship with "coming soon" + working
  contact link rather than invented policy.

### C4 — Track order (task 2.13 — the one new backend piece) `[ ]`
- Read-only `trackOrder` action + `/api/track-order` route (orderNumber +
  email/phone match, rate-limited, no enumeration: generic error on miss) +
  public page. Explicit exception to the frozen logic layer (already granted
  in the rebuild plan).

### C5 — Admin visual rebuild (tasks 3.1–3.6) `[ ]`
- 17 files still carry `text-primary` / `--surface-card` / `shadow-card`
  legacy classes (scan list in the ledger). One task per surface: dashboard,
  products (+ProductForm/Preview), orders, custom-requests, customers,
  analytics+settings. **Freeze:** all overhaul features; `ProductPreview`
  Decimal compare fixed in the products task (tracked defect). DataTable
  already fixed by A6 — do not re-fix.

### C6 — Global states (task 4.1) `[ ]`
- `loading.tsx`, `not-found.tsx`, `global-error.tsx` onto tokens; not-found
  still references undefined `--surface-card`/`text-primary`.

### C7 — Accessibility / motion / responsive audit (task 4.2) `[ ]`
- Includes the four auth-gated surfaces never browser-measured
  (`/custom-sticker`, `/orders`, `/orders/[id]`, `/profile`) — needs an
  authenticated session (owner). Focus trap under reduced motion (deferred
  from Task 1.5), keyboard path through cart/checkout/admin, 320px sweep.

### C8 — Full verification + visual baselines (task 5.1) `[ ]`
- CI/nightly only: `verify:full` + 48-viewport visual baselines re-recorded
  after C1–C6. Owner: nightly minutes decision still pending.

### C9 — Dead-code purge `[ ]`
- Zero-consumer modules confirmed by the ledger: `ExportPreview.tsx` (395
  lines), `ProductConfigurator.tsx`, `ReviewForm.tsx`, `OrderConfirmationCard`,
  `SimplePaymentMethod`, `DoodleBackground` shim (after its last consumer is
  rebuilt — profile/about/contact still import it). Re-grep consumers at
  dispatch time; delete only at zero.

### C10 — Landing page shell gap (owner decision) `[ ]`
- `/` sits outside `(customer)/layout.tsx` → no MobileNav, no CartDrawer on
  the landing page; cart entry points render only when authenticated. Either
  move `/` into the group or mount the shell explicitly — **owner picks**
  (product decision recorded in the ledger, Task 1.5).

### C11 — globals.css utility-rule token gaps `[ ]`
- Re-scan at dispatch: Task 1.6 closed most; verify `--shadow-btn/card/input/
  stat/glass` utility rules and the admin legacy classes resolve; the
  `globals-tokens` test is the gate.

---

## Track D — Hardening & feature proposals (owner prioritises)

| ID | Proposal | Why / mechanism | Size |
|----|----------|-----------------|------|
| D1 | Webhook retry with backoff | Failed deliveries are fire-and-forget today; a subscriber outage loses events. Add `attempt`/`nextRetryAt` to WebhookDelivery + a bounded retry sweep (3 attempts, exponential), reusing the never-throws dispatch. | M |
| D2 | Retention sweep (cron/nightly) | One-off + scheduled pruning of WebhookDelivery (incl. pre-A3 PII rows), old notifications, orphaned uploads. Nightly workflow already exists — add a maintenance route guarded by a cron secret. | S |
| D3 | Payment gateway integration | Settings keys for Stripe/SSLCommerz/bKash/Nagad already exist encrypted; checkout is COD-only. Pick **one** provider first (SSLCommerz or bKash for BD market), server-side initiation + webhook verification + idempotent payment capture. Feature project — needs provider accounts (owner). | L |
| D4 | Transactional email expansion | SMTP wired; only order-confirmation + manual send exist. Add status-change emails (canTransition-driven), revision-request email, welcome email. Template reuse from `src/lib/email.ts`. | M |
| D5 | Observability | `/api/health` (DB+socket probe), structured error logging with request ids, optional Sentry. Today errors are `console.error` only. | S–M |
| D6 | Security headers | `next.config.js` headers: CSP (report-only first — inline styles/scripts audit), HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors. Cookie flags audit (next-auth defaults). | S |
| D7 | Headless idempotency | `POST /api/headless/orders` accepts an `Idempotency-Key` header; dedupe window prevents duplicate orders on retry. | S |
| D8 | Admin audit trail | Settings changes, API-key/webhook CRUD and stock adjustments record actor+before/after (OrderStatusHistory pattern already exists). | M |
| D9 | Streaming exports | Exports buffer ≤10 000 rows in memory; stream via `ReadableStream` + cursor pagination when catalogs grow. | S |
| D10 | Search indexes | `contains` searches are sequential scans; add pg_trgm GIN indexes on user(name,email), order(orderNumber), product(name) when data grows. Migration-only. | S |
| D11 | Secrets runbook | Document `SETTINGS_ENCRYPTION_KEY` custody + rotation (re-encrypt sweep), DB backup/restore drill, `AUTH_SECRET` rotation. Losing the key = unrecoverable credentials (by design). | S (docs) |
| D12 | CI: nightly + e2e | Owner minutes decision; then enable nightly.yml and add the smoke e2e to ci.yml (currently build-only). | S |
| D13 | Product imagery | Still the shared placeholder asset — content, owner-side. | owner |
| D14 | Full order E2E (P5-07) | Checkout→payment→status→notification/socket record check with a throwaway account; `createOrderFromCustomRequest` already live-verified 17/17. | S |
| D15 | Soft-delete/archive products | Deleting a product with order history breaks FKs or cascades history; add `isArchived` + guard (categories already have the HAS_PRODUCTS guard pattern). | S |

---

## Owner decisions pending

| Decision | Blocks | Options |
|----------|--------|---------|
| About-page stats copy | C2 | remove / approve real numbers |
| Legal/content copy | C3 | owner supplies / ship "coming soon" |
| Landing shell (MobileNav/cart on `/`) | C10 | move into group / explicit mount / keep as-is |
| Nightly CI minutes | C8, D12 | approve / skip |
| First payment provider | D3 | SSLCommerz / bKash / Stripe / none yet |
| Authenticated QA session | B1 accept, C7 | owner logs in once / provide dev credential |
| conversionRate card | B2 | remove / define a real source |

## Execution order

1. ~~Track A~~ — shipped on main (`be53905..c6c5987`), merged here 2026-11-19.
2. ~~B1~~ done (`6dc21b3`) · ~~B3~~ done (`899f740`) · B2 partial (`4703009`).
   **Remaining Track B: B2 (two metrics) and B4 (session hygiene).**
3. **C1/C2/C6** (small surfaces) → C4 track-order → C3 content (owner copy) →
   C5 admin rebuild (one surface per task) → C9 purge → C7 audit → C8 baselines.
4. **Track D** by owner priority; D2/D6/D11 are cheap and recommended first.

**Serialization rule (ledger):** one implementer at a time on this provider —
concurrent agents exhaust the fair-share limit and die mid-run (three review
sub-agents died this way on 18 Nov). Controller-completed work is an accepted
fallback and must be labelled as such.