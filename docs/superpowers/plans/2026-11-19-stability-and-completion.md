# PLAN — Stability, Security & Completion (2026-11-19)

> **STATUS: WITHDRAWN BY A PARALLEL SESSION — preserved for reference, 2026-11-19 ~09:40.**
> This file was read in full at the start of a controller turn and had been **deleted from the
> repo by the time the turn ended**; `docs/TASKS.md` and
> `2026-11-15-shop-admin-auth-overhaul-tasks.md` were rewritten at 09:19 and commits `cd3ca87`,
> `dc7a526`, `d83423b`, `91afd54` landed that the controller did not make. Recreated here so the
> content survives and the work stays auditable. **Do not dispatch from this file without
> confirming with the owner** — it may have been superseded.

**Consolidates:** the open items from the 18–19 Nov code review, the remaining tasks of the
frontend rebuild (`2026-11-06-bioscope-frontend-rebuild.md`, tasks 2.8–5.1), the tracked defects
in the SDD ledger, and a fresh whole-project review pass (2026-11-19).

**Authority:** `docs/DESIGN_CONTRACT.md` (visual), `AGENTS.md` + `.agent/` (gates).

## Track A — Security & stability fixes — **SHIPPED**

Commits `be53905` (A1/A2/A5 data) · `f5430aa` (A3 webhooks) · `78d0d82` (A4 backup) ·
`41fcaee` (A6 DataTable numeric sort + real sort keys, A7 shadow utilities, A8 login redirect) ·
`c6c5987` (backup response envelope).

A6 and A7 independently fixed the two items the controller's Decimal-boundary audit had found
(`decimal-boundary-audit.md`): the lexicographic money sort and the `shadow-[var(--shadow-*)]`
utilities that compiled to no `box-shadow`.

Verification: `verify:mid` green, 47 files / 416 tests; live smoke 14/14.

## Track B — P0 functional gaps

### B1 — Profile page: real data instead of `mockUser` — **DONE, commit `6dc21b3`**
Controller-completed (the dispatched implementer was interrupted after 28 API calls). The page
now loads `/api/user/me` and does address CRUD against `/api/addresses`; loading/error/empty
states included. Report: `.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/task-b1-report.md`.
Gates: `verify:fast` type-check 0 / lint 0, full suite **275/275**.
- **Controller repairs:** page imported `validations/auth` while both server routes use
  `validations/profile` (auth's `changePasswordSchema` is a refined `ZodEffects` → `.extend`
  threw at import); tests queried `role="button"` for triggers rendering `role="tab"`; jsdom
  lacked `ResizeObserver`/`IntersectionObserver`; `z.input` vs `z.output` on defaulted fields;
  exact-string matchers against a `<br>`-separated address block.
- **Reverted:** the implementer's edit to the frozen `/api/addresses` GET envelope.
- **OWNER DECISION PENDING:** the brief said keep the tab structure; **Notifications** and
  **Orders** were dropped (no persistence backend / duplicated the real `/orders`).
- **UNVERIFIED:** live 320px check + browser persistence — needs an owner session.

### B2 — Analytics: replace the three zero placeholders — **PARTIALLY BLOCKED**
`analytics/page.tsx:110-113` hardcodes `pendingCustomRequests`, `conversionRate`, `todayOrders`
to `0`.
- `pendingCustomRequests` — **wireable now**: `getCustomRequestStats()` already returns
  `{ total, pending, priced, completed }` (`src/lib/actions/customRequest.ts:247`), exposed at
  `/api/custom-requests/stats`. No frozen-layer change needed.
- `todayOrders` — **needs a decision**: `getOrderStats()` (`src/lib/actions/order.ts:506`) has no
  today count, and `parseRange` supports only `7d/30d/90d/12mo`. Either add a today aggregate
  (frozen layer) or drop the card.
- `conversionRate` — **needs a decision**: no checkout-session source exists. Drop the card or
  define a real source. No fake metrics.

### B3 — Rate limiting on public write endpoints — **DONE, commit `899f740`**
No throttling existed anywhere. `src/lib/rate-limit.ts` (132 lines, no new deps) is a sliding-window
log keyed `bucket:clientIP`, fail-open on store errors, nothing about the caller logged;
`enforceRateLimit(request, bucket)` returns a ready 429 `NextResponse` carrying `Retry-After`, which
kept `src/lib/api-utils.ts` untouched. Wired into register, forgot-password, reset-password,
change-password and contact. Limits 10/5/5/10/5 per minute.
**Verified:** `tests/unit/rate-limit.test.ts` imports the **real route handlers** and loops all five,
firing `limit` requests from one IP then asserting request N+1 is 429 with `Retry-After` and a
generic `RATE_LIMITED` body; plus window expiry on fake timers, per-IP isolation, missing-IP
fallback, fail-open and unchanged valid traffic. Full suite **301/301** across 29 files;
`verify:fast` type-check 0 / lint 0.
**Caveats recorded in the file:** per-process memory (N instances ⇒ N× effective limit; Redis
upgrade path named, API unchanged), node-side only, and `x-forwarded-for` spoofable without a
trusted proxy — a speed bump, not an access control. No headless/webhook route exists yet, so
those were not invented.

### B4 — Admin password-reset / session hygiene — **TODO**
`AUTH_SECRET`/`AUTH_URL` boot validation (fail fast instead of per-request `UntrustedHost`),
session maxAge review, documented admin-password reset path (bootstrap reconcile already exists).

## Track C — Remaining frontend rebuild (reconciled with the overhaul)

C1 login/register (2.9) · C2 about/contact (2.10, owner copy decision) · C3 content pages
(2.11/2.12, owner legal copy) · C4 track-order (2.13, the one new backend piece) ·
C5 admin visual rebuild (3.1–3.6; 17 files still carry legacy classes; **includes the
`ProductPreview` Decimal compare fix**) · C6 global states (4.1) · C7 a11y/motion/responsive
audit (4.2, needs owner session) · C8 full verification + baselines (5.1) · C9 dead-code purge ·
C10 landing shell gap (owner decision) · C11 globals.css utility token gaps.

## Track D — Hardening & feature proposals (owner prioritises)

D1 webhook retry with backoff · D2 retention sweep · D3 payment gateway (owner picks provider) ·
D4 transactional email expansion · D5 observability (`/api/health`, request ids) · D6 security
headers · D7 headless idempotency · D8 admin audit trail · D9 streaming exports · D10 search
indexes · D11 secrets runbook · D12 CI nightly + e2e · D13 product imagery (owner) ·
D14 full order E2E · D15 soft-delete/archive products.

## Owner decisions pending

| Decision | Blocks |
|----------|--------|
| About-page stats copy | C2 |
| Legal/content copy | C3 |
| Landing shell (MobileNav/cart on `/`) | C10 |
| Nightly CI minutes | C8, D12 |
| First payment provider | D3 |
| Authenticated QA session | B1 accept, C7 |
| `conversionRate` card | B2 |
| `todayOrders` card | B2 |
| **Profile tabs: restore Notifications/Orders?** | **B1** |

## Execution order

1. ~~Track A~~ — shipped.
2. ~~B1~~ done, ~~B3~~ done. **Remaining Track B: B2 (two metrics blocked on owner decisions) and
   B4 (session hygiene, self-contained).**
3. C1/C2/C6 → C4 → C3 (owner copy) → C5 → C9 → C7 → C8.
4. Track D by owner priority; D2/D6/D11 cheap and recommended first.

**Serialization rule:** one implementer at a time on this provider — concurrent agents exhaust
the fair-share limit and die mid-run. Controller-completed work is an accepted fallback and must
be labelled as such.
