# PLAN — Completion, Enhancement & Must-Have Features (2026-11-19)

> **Companion to** `2026-11-19-stability-and-completion.md` (Tracks A–D, reconciled).
> This plan adds **Track E** (UI/UX/layout/design/animation enhancement + feature
> completion + must-haves) from a fresh whole-project review on 2026-11-19, and
> records the controller rulings for the owner decisions the owner delegated with
> "check all remaining plans and tasks files and properly continue implementing all
> … include new plan and tasks to enhance ui - ux - layout - design and animations,
> complete features and functionalities, stabilization, complete working
> functionalities, new must have feature etc".
>
> **Authority:** `docs/DESIGN_CONTRACT.md` (visual), `AGENTS.md` + `.agent/` (gates).
> **Live state tracker:** SDD ledger `.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/progress.md`.
> **Branch:** `feat/bioscope-frontend-rebuild`, reconciled with `main` at merge
> `194df79` (Track A + admin-panel completeness + B1/B2-partial/B3; verify:mid
> 49 files / 455 tests green post-merge).

## Reconciliation — what the other plan files still owe

| Plan file | State after merge | Remaining |
|---|---|---|
| `2026-11-06-complete-ui-redesign.md` | **Superseded** by the frontend-rebuild plan (same date, newer spec). | None — archive marker only. |
| `2026-11-06-bioscope-frontend-rebuild.md` | Phases 0–1, tasks 2.1–2.7 closed; 2.8 superseded by B1 (done). | 2.9→C1 · 2.10→C2 · 2.11/2.12→C3 · 2.13→C4 · 3.1–3.6→C5 · 4.1→C6 · 4.2→C7 · 5.1→C8. |
| `2026-11-15-css-shop-inputs-*` | All three phases shipped (`841a7ae`, `6ed3581`). Legacy aliases restored at `:root` (owner-confirmed 2026-11-15) — **supersedes rebuild DECISION 2's "no aliases"**: legacy classes now compile; remaining rebuild tasks restyle, not repair. | `--border-ink` dead token cleanup (→C9); globals-tokens gate promotion (owner sign-off, still pending); Dropdown nested-button fixed on main (`9f71afe`). |
| `2026-11-15-shop-admin-auth-overhaul-tasks.md` | Passes 1/1.5/2/3/4.1/4.2 shipped; **4.3 + 4.4 shipped on main** (`893fc2c` secrets/payments/SMTP, `8c615a6` webhooks, `57e4994` API keys, `9dc4d5c` backup, `c389200` clone/CSV, `ecc5da3` revision loop + order-from-request, `e527ecd` realtime); 5.1.3 category API tests shipped (`f6e8895`). | 2.4.3 shop responsive check (→C7); 5.3 visual QA (agent-measurable parts →C7, eyeball owner-side). |
| `docs/TASKS.md` | Stale (2026-11-01 state) on this branch; main's `9c5ad66` re-verified it. **Not driven from** — the SDD ledger is live. | P5-06/P5-07 smoke + full order E2E → D14/C7. |
| `.agent/PROGRESS.md` | Parallel-session tracker (2026-11-18). Its "Pass 2 in progress / Pass 5 not started" rows are stale vs main. | Known-gaps list folded into C7/E11 below. Dark-mode toggle row is **rejected**: contract removes dark mode entirely. |

## Controller rulings (owner-delegated, 2026-11-19)

1. **B2 metrics:** `todayOrders` gets a real server aggregate (today, local tz).
   `conversionRate` has no session source and none will be invented — the card is
   **replaced by Average Order Value** (real: revenue ÷ paid-order count, same range).
2. **About stats:** fabricated numbers ("500 Happy Customers", "150 Projects Done")
   are **removed**, replaced by honest copy marked `TODO: owner copy`. No invented claims.
3. **Legal/content copy:** policy pages ship an honest "policy being finalized"
   body + working contact route + the operational facts we *can* state truthfully
   (delivery charges/threshold read live from public settings). No invented legal text.
   Blog/careers/press/affiliates ship as coming-soon shells so every Footer link resolves.
4. **Landing shell (C10):** move `/` into the `(customer)` group — mobile visitors get
   MobileNav; CartDrawer already lives at root (Task 1.5). Product decision recorded.
5. **Authenticated QA:** no owner session needed — bootstrap admin credential for
   admin surfaces, a throwaway customer registered via the API for customer surfaces
   (the pattern earlier fix rounds already used). Accounts are labelled throwaway.
6. **Payment provider (D3):** still owner's call — provider accounts/keys are required.
   Everything up to the provider boundary (initiation abstraction, webhook verification
   shape) may be prepared, but no provider is picked here.
7. **Nightly CI minutes:** owner's call; nightly.yml stays unenabled.
8. **ReviewForm:** revived (wired into product detail, E3) instead of purged — it is
   the missing half of a must-have feature, not dead weight.

## Track E — Enhancement, feature completion & must-haves (new)

Grounded in the 2026-11-19 review; every item cites the evidence found in code.

### E1 — Password-reset flow completion `[ ]` **P0**
- **Evidence:** login links `/forgot-password` (`login/page.tsx:163`) — **page does not
  exist**. `/reset-password` page also absent. `forgot-password/route.ts` creates the
  token but **never sends email** — in production it falls through to the generic
  success with no delivery at all; only dev gets `devToken`.
- **Work:** `/forgot-password` + `/reset-password` pages (token from query param,
  new-password + confirm, strength meter reuse); route sends the reset email via
  `src/lib/email.ts` when SMTP is configured (production path), keeps `devToken`
  dev-only; rate limit already wired (B3). Link the flow from login.
- **Accept:** full flow works end-to-end in dev (request → devToken → reset → sign in
  with new password); expired/used token → clear error; unit tests for the route's
  email path (mocked transport) + page tests.

### E2 — Working wishlist `[x]`
> **DONE 2026-11-19, commit `4cbd05e`, controller-executed.** wishlistStore (zustand+localStorage,
> cart pattern, guest-friendly survives login); ProductCard/ProductDetail/FeaturedProduct hearts
> wired (filled + aria-pressed + toggle label); /wishlist page (grid + remove + clear + empty state);
> Navbar icon + badge visible to guests. 6 jsdom tests; verify:mid 561/561; browser live heart
> false→true, badge 1, page shows item, persists across reload. detect-changes HIGH (ProductCard/
> Navbar) surfaced not waived. FeaturedProduct Add-to-Cart also dead → tracked for E8. Report:
> `.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/task-e2-report.md`.
- **Evidence:** `ProductCard.tsx:172-179` heart button has **no onClick** — decorative;
  `ProductDetail` same. No wishlist store exists.
- **Work:** `wishlistStore` (zustand + localStorage, cart-store pattern), heart toggles
  with filled state + aria-pressed, `/wishlist` page (grid, remove, add-to-cart,
  empty state with doodle), Navbar entry (authenticated or guest — guest wishlist is
  local, survives login).
- **Accept:** toggle persists across reload; card + detail + page agree on state;
  320px clean; unit tests (store + page).

### E3 — Review submission `[x]`
> **DONE 2026-11-19, commit `08793c0`, controller-executed.** ReviewForm revived (was dead code)
> as a token client component under ReviewList on /shop/[slug]: star rating (required) + optional
> title/comment → POST /api/reviews → toast + router.refresh(); guests get sign-in CTA with
> callbackUrl. Eligibility stated honestly (route flags isVerifiedPurchase, does NOT gate on
> purchase). Dead StarRating/ReviewHelpfulButton barrel exports removed. 4 jsdom tests; verify:mid
> 63 files; live POST 201 + visible in GET; browser guest CTA renders. Gate PARTIAL (barrel re-export,
> no symbols — tool limitation). **Tracked for C7:** pre-existing ProductDetail 320px overflow (Tabs
> 350px + share row 378). Report: `.superpowers/sdd/2026-11-06-bioscope-frontend-rebuild/task-e3-report.md`.
- **Evidence:** `ReviewForm.tsx` has zero consumers; product detail renders `ReviewList`
  only; `POST /api/reviews` exists and is unused by the UI.
- **Work:** revive ReviewForm onto the token system, mount under ReviewList on product
  detail (signed-in only; guests get a sign-in CTA with `callbackUrl` back to the
  product), star input + title/body, submit → POST → optimistic refresh + toast;
  surface the API's eligibility rule honestly (read the route first — if it requires
  purchase, say so in the UI).
- **Accept:** a signed-in customer can submit and see their review; duplicate/eligibility
  errors render as field messages; tests mock the real envelope.

### E4 — Promo codes at checkout + admin management `[x]`
> **DONE 2026-11-20, commit `93f9d73`, controller-executed.** Admin Promotions tab (PromoSettings:
> list/create/delete promo_<CODE> via settings API; deleteSetting action + DELETE [key] route).
> Checkout promo input → POST /api/promo/validate (server discount preview, never client math) →
> discount line + remove → createOrder re-prices. New validate route: requireUser + promo bucket
> 10/min, reads promo_<CODE> directly, computeDiscount (frozen pricing read-only). 12 tests;
> verify:mid 65 files; **live E2E same-session: create 200 → validate {E4QA,50} → order 201
> subtotal 420 discount 42 total 459 → delete 200 → validate 400.** Risk HIGH (checkout money path +
> SettingsForm) surfaced not waived; additive, pricing.ts only read. Report: `task-e4-report.md`.
- **Evidence:** `createOrder` accepts `promoCode` (settings key `promo_<CODE>`,
  percent/fixed — `actions/order.ts:132-142`); checkout has **no input**; no admin UI
  creates promo settings.
- **Work:** checkout promo input (apply → re-price via the server, never client math;
  show discount line + remove); admin Settings → Promotions tab (list/create/disable
  `promo_*` settings through the existing settings API).
- **Accept:** valid code reduces total by the server-computed amount; invalid code →
  inline error; admin can create a code and use it at checkout in the same session;
  pricing math stays server-side (frozen layer untouched).

### E5 — Customer notifications, live `[x]`
> **DONE 2026-11-20, commit `1cce395`, controller-executed.** useNotifications hook: fetch feed on
> mount (syncFromServer), subscribe notification:new socket (live), persist mark-read via
> POST [id]/read + /read-all. NotificationBell rebuilt on tokens (width-capped dropdown, no 320
> overflow), mounted in authenticated customer Navbar. 7 jsdom tests; verify:mid 66 files; live:
> status PATCH CONFIRMED → notification appears (unread 1) → mark-read persists (gone from
> unreadOnly). Socket server up + emitNotificationNew confirmed. Risk medium (additive Navbar mount).
> Report: `task-e5-report.md`.
- **Evidence:** `NotificationBell` reads `notificationStore` but **nothing fetches**
  `/api/notifications` into it, and the bell is **not mounted** in the customer Navbar
  (admin layout only). `SocketProvider` is a stub; `useSocket` has no customer consumer.
- **Work:** mount bell in Navbar (authenticated), fetch on mount + mark-read persisted
  via the API (check route shape first), subscribe to the user's notification event
  via `useSocket` (socket server now running), unread badge, empty state.
- **Accept:** a status change on the customer's order appears in the bell without
  reload (socket) and after reload (fetch); mark-read persists; tests for fetch + store.

### E6 — SEO & sharing must-haves `[x]`
> **DONE 2026-11-20, commit `5a3c366`, controller-executed.** sitemap.ts (static public + DB
> products/categories, DB-fail fallback, no private routes), robots.ts (disallow private + sitemap),
> manifest.ts (brand colors/icons), getSiteUrl helper (strips .env quotes), src/lib/seo.ts builders.
> Product page generateMetadata (metaTitle/metaDescription, canonical, OG/Twitter) + JSON-LD Product
> (real price/availability/aggregateRating). 11 tests; verify:mid 69 files; live /sitemap.xml +
> /robots.txt + /manifest.webmanifest 200, product HTML has JSON-LD + canonical + title template,
> sitemap 0 private routes. Risk medium (product page; rest additive). Report: `task-e6-report.md`.
- **Evidence:** no `sitemap.ts`, `robots.ts`, `manifest.ts` in `src/app`.
- **Work:** dynamic sitemap (static routes + products + categories from DB), robots
  (disallow admin/checkout/api), web manifest (brand colors/icons), per-page metadata
  audit (title/description/OG on every customer route), JSON-LD `Product` on product
  detail (price/availability from real data), canonical URLs.
- **Accept:** `/sitemap.xml` + `/robots.txt` serve 200 with correct entries; product
  page carries valid JSON-LD; no private route in the sitemap.

### E7 — Guest cart continuity `[x]`
> **DONE 2026-11-20, commit `bf81d7b`, controller-executed.** Guest items already survive login
> (localStorage), but the server cart was never populated (hydrate/setItems had zero callers). Added
> pure mergeCartItems (dedupe product+variant, sum, stock cap, no mutation) + useCartSync (guest→auth
> transition: GET server cart, merge local items, POST mode 'set' → no dup rows, hydrate client;
> failure keeps guest items 'local'). CartSync mounted in customer layout. 13 tests; verify:mid 68
> files; live server dedupe (two adds → 1 row qty 5, set 4 → 4). Risk medium (layout mount; rest
> additive). Report: `task-e7-report.md`.
- **Evidence:** cart is client localStorage; server cart is source of truth at checkout
  (AGENTS.md). Verify what happens to guest items at sign-in; if they are dropped,
  merge them into the server cart on login (dedupe by product+variant, sum quantities
  capped by stock).
- **Accept:** guest adds items → signs in → items still in cart; no duplicate rows;
  unit test for the merge function.

### E8 — Product detail UX `[x]`
> **DONE 2026-11-20, commit `ceaae4a`, controller-executed.** Fixed two dead buttons: FeaturedProduct
> Add to Cart (no onClick → adds default dim + drawer + toast, guest redirect) and ProductDetail Share
> (no onClick → navigator.share + clipboard fallback). Fixed pre-existing 320 overflow (header
> flex-wrap/min-w-0, TabsList max-w-full overflow-x-auto, removed stale Reviews-coming-soon tab).
> Sticky mobile add-to-cart bar (bottom-[72px] clears MobileNav) + spacer. Recently-viewed rail
> (localStorage last-8 dedupe, excludes current, mount-gated). Zoom + quantity stepper already
> existed. 6 tests; verify:mid 71 files; browser 320 scrollW 314<=320 (was 378), sticky bar bottom
> 772=844-72. Risk medium. Report: `task-e8-report.md`.
- Image zoom (hover magnify desktop / pinch or tap-expand mobile, reduced-motion safe),
  sticky add-to-cart bar on mobile, quantity stepper on the shared primitive,
  recently-viewed rail (localStorage, last 8, excludes current).
- **Accept:** zoom measurable in browser; sticky bar clears MobileNav (72px); rail
  renders only with history; 320px clean.

### E9 — Animation & micro-interaction pass `[x]`
> **DONE 2026-11-20, commit `a2c60c5`, controller-executed.** Added (customer)/template.tsx route-level
> fade/rise (opacity+y8, 0.18s ≤200ms, transform/opacity-only, reduced-motion instant opacity-only via
> useReducedMotion + root MotionConfig). Audit: accordion height reveal reduced-motion-aware, cart badge
> bounceIn (no layout shift), springs centralized in motion.ts, global reduced-motion rules, add-to-cart
> feedback (E8). 3 tests; verify:mid 74 files; browser home+shop render through template, shop grid 8
> products scrollW 1272<=1280. Pure addition. Report: `task-e9-report.md`.
- Route-level page transition (`template.tsx` fade/rise, ≤200ms, reduced-motion off),
  staggered `whileInView` reveals audited for consistency (landing/shop/about),
  skeleton→content crossfade, add-to-cart feedback (badge pulse + toast, no layout
  shift), consistent tap/hover springs from `motion.ts` (no ad-hoc easings),
  FAQ/accordion height animation, cart badge count animation.
- **Accept:** every animation transform/opacity-only (contract §4); global
  reduced-motion rule covers all; no new JS loop outside `motion.ts`/globals keyframes.

### E10 — Shop search UX `[x]`
> **DONE 2026-11-20, commit `06b86d9`, controller-executed.** ProductSearchBox: debounced (250ms)
> suggestions (top 5 /api/products?search=), keyboard nav (Arrow/Enter/Escape), recent searches
> (localStorage ≤5), clear button, honest empty state, combobox/listbox ARIA. AbortController cancels
> stale fetches (no fetch per keystroke). Typing still drives grid filter. 6 tests; shop.test.tsx got
> a next/navigation mock; verify:mid 72 files; browser typing 'sticker' → 4 real suggestions + clear.
> Risk medium. Report: `task-e10-report.md`.
- Debounced suggestions (top 5 from the existing search API, keyboard navigable,
  Escape closes), recent searches (localStorage, ≤5), clear button, honest empty state.
- **Accept:** suggestions track the query with ≤300ms debounce; arrow keys + Enter
  work; no fetch per keystroke; tests for debounce + keyboard.

### E11 — Performance budget `[ ]`
- `@next/bundle-analyzer` run (record top chunks), dynamic-import heavy libs
  (fabric/recharts already route-split? verify), `next/image` audit of the 24
  eslint-disabled `<img>` sites (convert where the loader allows), LCP/CLS measured
  on `/` and `/shop/[slug]` in Chromium, font loading verified `display: swap`.
- **Accept:** measured numbers recorded in the ledger; no chunk > 300KB gzipped
  without a recorded justification; LCP < 2.5s on the dev-prod build (isolated).

### E12 — Empty/error state polish `[x]`
> **DONE 2026-11-20, commit `ae4fedb`, controller-executed.** Reusable FetchErrorState (doodle Card +
> AlertCircle + retry, role=alert). Orders page tracks error state (non-ok + network catch) → shows
> recoverable error with retry instead of misleading 'No orders yet'. Sweep: wishlist already doodle
> empty (E2), notifications empty (E5), profile form field-errors+toast. 3 tests; verify:mid 73 files.
> Risk medium. Report: `task-e12-report.md`.
- Orders/wishlist/notifications empty states on the doodle language; every fetch
  surface gets a retry affordance (profile/orders pattern already exists — sweep the
  rest); offline banner optional, skip if it adds risk.

## Track D picks for this pass (cheap, no owner input)

D5 `/api/health` (DB probe; socket probe optional) · D6 security headers (HSTS,
X-Content-Type-Options, Referrer-Policy, frame-ancestors; CSP report-only after an
inline-style audit) · D2 retention sweep (maintenance route + cron secret; prunes
pre-A3 PII webhook rows, old notifications) · D11 secrets runbook (docs) ·
D7 headless idempotency key · D15 product soft-delete/archive · D10 pg_trgm indexes
(migration-only) · D4 status-change + welcome emails · D1 webhook retry w/ backoff ·
D8 admin audit trail (settings/API-key/webhook CRUD) · D9 streaming exports.
**D3 (payment provider) and D13 (imagery) remain owner-blocked.** D14 full order E2E
folds into C7's authenticated sweep.

## Execution order (serialized; one implementer at a time)

1. ~~Merge main~~ (`194df79`, verify:mid 455/455) — done.
2. **B2** analytics metrics (small) → **E1+B3-leftover** auth flow completion
   (forgot/reset pages, reset email, login rate limit) → **B4** session hygiene.
3. **C4** track-order → **C6** global states → **C1** login/register visual rebuild
   (after E1, same surfaces) → **C10** landing shell.
4. **C2** about/contact → **C3** content pages (11 routes, one ContentPage shell).
5. **E2** wishlist → **E3** reviews → **E4** promo → **E5** notifications → **E7** cart merge.
6. **C5** admin visual rebuild — six surfaces, feature layer frozen, ProductPreview
   Decimal fix in the products task.
7. **E6** SEO → **E8** product UX → **E9** animation pass → **E10** search → **E12** states.
8. **C9** dead-code purge (re-grep consumers; ReviewForm now owned by E3) → **C11** token gaps.
9. **Track D** cheap picks in the order listed.
10. **C7** a11y/motion/responsive audit (authenticated browser sweep, 320px, focus,
    reduced motion; includes overhaul 2.4.3 + 5.3 measurable rows + D14 order E2E).
11. **C8** verification + baselines (verify:mid + e2e locally; verify:full CI-only)
    → **E11** performance numbers.

**Standing rules:** ledger updated after every task · impact before edit,
detect-changes before commit · never build while dev server shares `.next` ·
tests mock the real API envelope · no fake metrics/copy · frozen logic layer
untouched except the granted trackOrder exception and stability-track fixes.

---

## Newly identified follow-ups (discovered during the 2026-11-20 implementation pass)

Proposals surfaced while implementing E2–E12/C5/C9 — not yet scheduled. Owner
prioritises; cheap ones flagged.

- **E13 — ProductDetail customization buttons are decorative.** The material /
  finish / cut-type option buttons in `ProductDetail.tsx` have no `onClick` (they
  highlight nothing and feed nothing into `addItem`). The real customization path
  is the `/custom-sticker` builder. Either wire these into the cart item's
  `customization` payload or replace them with a "Customize this sticker" link to
  the builder. (Defect; medium.)
- **E14 — Admin login visual rebuild.** `admin/login/page.tsx` still uses the
  `DoodleBackground` shim (the last consumer keeping it alive — C9 retained it).
  Rebuild onto tokens + capped doodle scatter, then delete the shim. (Cheap.)
- **E15 — Dark mode.** The token system already defines semantic roles, but there
  is no `darkMode` config and no `prefers-color-scheme` block — the app is
  light-mode-only. Add a dark palette + `darkMode:'class'` toggle once the owner
  wants it; C5's token migration makes this far cheaper now. (Enhancement; owner.)
- **E16 — `generateMetadata` double-fetch.** The product page calls
  `getProductBySlug` in both `generateMetadata` and the page body (Prisma is not
  auto-deduped like `fetch`). Wrap it in React `cache()` to halve the query.
  (Cheap perf.)
- **E17 — Order-status email + welcome email (Track D4)** and **webhook retry
  with backoff (D1)**, **retention cron (D2)**, **admin audit trail (D8)**,
  **streaming exports (D9)**, **pg_trgm search indexes (D10)**, **product
  soft-delete/archive (D15)**, **headless idempotency key (D7)**, **secrets
  runbook docs (D11)** remain as proposed in Track D. D3 (payment provider) and
  D13 (imagery) stay owner-blocked.

### Status after the 2026-11-20 pass
Done & verified (verify:mid 75 files): B4, C1, C2, C3, C4, C5, C6, C9, C10, C11,
E2, E3, E4, E5, E6, E7, E8, E9, E10, E12, D5, D6 (+ Footer 320 fix).
Remaining: C7 (authenticated a11y/motion/responsive sweep — needs owner session),
C8 (verify:full + baselines — CI/nightly only), E11 (perf numbers — isolated
build), E13–E17 above, and the Track D larger features.