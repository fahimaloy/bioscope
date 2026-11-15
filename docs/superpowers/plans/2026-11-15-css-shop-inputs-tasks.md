# TASKS — CSS repair, shop layout, input overhaul (2026-11-15)

Companion to `2026-11-15-css-shop-inputs-overhaul.md`. Contract:
`docs/DESIGN_CONTRACT.md` — §7 frozen logic, §8 `pnpm verify` before commit,
§10 visual decisions need owner sign-off.
Legend: [ ] todo · [~] in progress · [x] done+verified. Blocking dependency:
**A-01** (owner token-mapping decision) → C-02. B and C are independent of
each other but both land after A.

## Phase 0 — Owner decisions (RESOLVED 2026-11-15)
- [x] P0-1 Alias mappings confirmed: `--primary→pink-strong`,
  `--secondary→teal`, `--light→paper-deep`, `--dark→ink`,
  `--bg-color→paper`, `--purple→violet`.
- [x] P0-2 Shop filter search: YES — build it (B-03 unblocked).

## Phase A — token & config repair (project-wide CSS restoration)
- [ ] A-01 Add the six legacy aliases to `tokens/src/color.json` as semantic
  aliases; run `pnpm tokens` (regenerates the marked `:root` region in
  globals.css; do not hand-edit that region). Verifies: grep shows the six
  vars defined at :root **outside** the contrast media query.
- [ ] A-02 `tailwind.config.ts`: add `colors.primary: var(--primary)`,
  `colors.secondary: var(--secondary)`, `borderWidth: { 3: '3px' }`,
  `borderRadius: { card: var(--radius-lg), input: var(--radius-md) }`,
  `fontSize.body: [var(--text-base), { lineHeight: '1.6' }]`. Fixes:
  text-primary ×130, rounded-input ×85, rounded-card ×27, border-3 ×34,
  bg/border/ring-primary ×113, text-body ×88 (counts from src/).
- [ ] A-03 `tokens/src/type.json` + config: add `7xl` (72px) and `8xl` (96px)
  following the existing ladder pattern; `pnpm tokens`. Fixes shop hero
  `md:text-8xl` without component churn.
- [ ] A-04 globals.css `@media (prefers-contrast: high)`: drop keys now
  defined at :root; keep genuine high-contrast overrides only
  (`--error/--success/--warning/--info`).
- [ ] A-05 Env hygiene: `ss -ltnp | grep 3000` → kill the orphaned
  `next-server` (pid 210918 at plan time); `rm -rf .next`; restart `pnpm dev`;
  hard-reload browser. Rule for the project: never run `pnpm build` while
  `next dev` is live.
- [ ] A-06 Verification: `pnpm type-check && pnpm test:run && pnpm build`;
  curl 200 for `/`, `/shop`, `/login`, `/admin`; computed-style spot-check
  that body background + one `bg-[var(--light)]` panel now paint;
  `pnpm exec playwright screenshot` baselines for /shop /login /register.

## Phase B — shop layout (`src/app/(customer)/shop/page.tsx`)
- [ ] B-01 Root (:104): add `pt-24` (fixed h-16 navbar offset, matching
  `shop/[slug]/page.tsx:48`, `orders/page.tsx:87`); replace `min-h-screen`
  with a flow-height wrapper to kill the double-viewport gap inside
  `<main className="flex-1">` (layout.tsx:86).
- [ ] B-02 Surface category-fetch errors instead of `.catch(() => {})`
  (:65-70) so pills can't silently vanish.
- [ ] B-03 (after P0-2) Optional: add `SearchInput` to the filter bar +
  client-side filter. No such component exists today — new work, small lane.
- [ ] B-04 Verification: desktop + iPhone-13 screenshots; contract §6 checks
  (no h-scroll at 320px, 44px targets).

## Phase C — input-field overhaul
- [ ] C-01 Delete the dead legacy form CSS in globals.css — `.form-group` +
  floating-label rules (:251-300), `.input-error`/`.input-success`
  (:715-722). Verified dead: all 14 `form-group` occurrences are the CSS rules
  themselves; zero JSX usage. Deduplicate the two global focus blocks
  (:523-526 ≡ :609-612) — delete both, keep ONE canonical ring
  (`ui/shared.ts` FOCUS_VISIBLE) so globals can't fight utility focus rings.
  Once A-01 lands, re-point `accent-color` (:631-633) at a defined token
  (`--ink`) instead of the (now-aliased) `--primary`.
- [ ] C-02 Rebuild `src/components/ui/Input.tsx` (Input/Textarea/Select) per
  `docs/design-system.md:282-300`, fixing verified defects:
  D1 `text-body` → token class (:31);
  D2 `focus:border-[var(--ink)]` ≡ default border → no focus color change;
  give focus a real border/shadow transition;
  D3 floated label: add explicit `top-*` so it crosses the border instead of
  overlapping content (:45-53); Textarea gets the same border-crossing
  treatment (today `top-3` inside the field, :204); Select must not center its
  label over the selected option (:297);
  D4 float state must track live value AND focus — add focus/blur (or
  `:focus-within`) state and a truthy-safe value check (today `Boolean(value)`
  :76 misses `0`/`""`, and post-mount typing never floats);
  D5 checkbox/radio dead `text-primary`/`focus:ring-primary` → token classes.
  Keep the documented API (label/error/hint/icon/toggleIcon), ref forward +
  `cn()` merge (§6), 2px ink border, AA text roles only (§2).
- [ ] C-03 Consolidate competing implementations (10 looks → 1 language):
  one `Select` (barrel exports Input.tsx's :74; shop/custom-sticker/
  ProductsPage deep-import ui/Select.tsx — migrate, delete the loser, remove
  the dead import at custom-sticker:11); one Checkbox (4 variants today: raw
  ×11, AddressForm appearance-none, Dropdown accent-ink, Radix ×4) onto
  `ui/Checkbox.tsx`; one SearchInput (4 drifting admin copies:
  orders:604 py-2, customers:224 py-3, ProductsPage:164, custom-requests:295);
  one QuantityStepper (QuantitySelector:88, ProductConfigurator:125,
  ProductDetail:341); one FileDropzone (ImageUpload:244, UploadZone:152,
  profile:668, SettingsForm:400); one Slider/range (ColorPicker:197-264,
  ColorAdjustments:215, Slider.tsx); one Textarea (EditingTools:334 raw).
- [ ] C-04 Fix functional input bugs from the audit: customers-page
  Min-Orders/Date inputs missing `onChange` (:263,267 — dead UI); SettingsForm
  file inputs missing `onChange` (:400,413); AddressForm appearance-none
  checkbox renders an invisible check in both states (:245); profile switch
  ON-state invisible (border-3/bg-primary dead — fixed by A-02, verify);
  DimensionSelector selected-card state (dead classes — fixed by A-02,
  verify); profile eye buttons hardcoded `top-[38px]` (:787/804/821) →
  primitive-owned toggle.
- [ ] C-05 Per-page adoption sweep in audit's lowest-risk order: admin
  toolbars (square/no-focus) → profile (invisible toggle) → product/quantity
  steppers → login/register/contact → custom-sticker builder. Every raw
  `<input>`/`<select>`/`<textarea>` replaced with the primitive where covered.
- [ ] C-06 Regression gates (adopted from audit): promote
  `tests/unit/globals-tokens.test.ts` from informational to FAILING; add a
  test that fails when any `className` references a color/radius/fontSize key
  absent from `tailwind.config.ts` (seeded by the audit's tailwind-output
  grep — e.g. `text-primary`, `rounded-input`, `text-body`, `border-3`).
- [ ] C-07 Verification: `pnpm type-check && pnpm lint && pnpm test:run`;
  screenshots login/register/profile/checkout/custom-sticker/admin surfaces;
  manual pass — tab order, visible focus ring, error states, reduced-motion;
  `pnpm verify` before commit (§8).

## Cross-cutting validation (once per phase, after all writers reconcile)
- `pnpm type-check` → 0 · `pnpm lint` clean · `pnpm test:run` green ·
  `pnpm build` exit 0 · `pnpm verify` (contract §8) before any commit.
- Visual: `pnpm exec playwright screenshot --browser chromium` baselines
  (needs `pnpm exec playwright install chromium-headless-shell` once).
  Machine-reading screenshots is currently blocked (plan §Known issues #1) —
  computed-style/curl checks stand in until a vision provider works.

## Known issues carried forward
1. Screenshot review blocked: modlens providers fail on this machine (local
   claude CLI rejects model `poolside/laguna-s-2.1:free`; opencode-cli reuse
   fails opaquely). User to repair claude CLI model config or add a provider
   key.
2. `pnpm build` while `next dev` runs wedges dev (A-05).
3. Legacy `--border-ink` token (globals.css:71-72) unused — cleanup deferred.