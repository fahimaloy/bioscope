# Plan — CSS repair, shop layout, input-field overhaul (2026-11-15)

Authority: `docs/DESIGN_CONTRACT.md` (§1 tokens, §2 contrast, §5 surfaces,
§6 a11y, §7 frozen logic, §8 gates, §10 settled visual decisions).
Input primitive spec: `docs/design-system.md:282-300`.

## 0. Verified findings (evidence)

Pipeline is healthy — the breakage is token/config level, not build level:

- Tailwind 3.4 + PostCSS + globals.css directives are correctly wired; a fresh
  dev server compiles a complete 110KB stylesheet (utilities, `color-mix`,
  arbitrary values all present); `pnpm build` exits 0; class coverage on /shop
  is complete. Nothing in the build chain needs repair.
- **ROOT CAUSE 1 — inert legacy tokens.** `src/app/globals.css:592-606` defines
  `--primary --secondary --light --dark --bg-color --purple` **only inside
  `@media (prefers-contrast: high)`**. At normal contrast every consumer
  declaration is dropped by the CSS cascade: `body` background (:110) and the
  whole legacy class layer (`.btn-primary`, `.card h3`, `.badge-*`, scrollbar,
  `.skeleton`, `.tabs-trigger`, `.section-title`, `.pagination-item:hover`,
  `.sticker-peel`, `.sketch-underline`…), plus arbitrary usages in components
  (`var(--light)` ×94, `var(--primary)` ×56, `var(--secondary)` ×24,
  `var(--bg-color)` ×13, `var(--dark)` ×6, `var(--purple)` ×5 across src/).
  → transparent panels, missing borders/shadows, no body background: reads as
  "entire project CSS not working".
- **ROOT CAUSE 2 — dead Tailwind classes.** Classes used in components that
  this config cannot generate (verified against a real build output):
  `text-primary` ×130, `rounded-input` ×85, `text-body` ×88, `bg-primary` ×34,
  `border-3` ×34, `border-primary` ×38, `rounded-card` ×27, `ring-primary` +
  focus variants ×41, `text-8xl`/`md:text-8xl` ×1. No `primary`/`secondary`
  color, no `borderWidth.3`, no `borderRadius.card/input`, no
  `fontSize.body/7xl/8xl` in `tailwind.config.ts`.
- **ROOT CAUSE 3 — stale/broken runtime state (why it looked 100% dead).** A
  2h49m-old orphaned `next-server` on :3000 404s every route (mid-session
  `.next` rewrite; a `pnpm build` run concurrently with `next dev` wipes
  `.next` and wedges dev). Bundled with browser cache from the pre-rebuild
  build (whose sort control used inert `--light` + nonexistent
  `rounded-input` — the literal "filter options not visible"), the user saw a
  dead-looking site. Fix: kill orphans, `rm -rf .next`, restart, hard-reload.
- **Shop layout defects** (`src/app/(customer)/shop/page.tsx`): no `pt-*`
  offset for the fixed h-16 navbar (:104 — every sibling page uses `pt-24`);
  `min-h-screen` inside `<main className="flex-1">` double-counts the viewport
  → ~64px dead space on every render; hero `md:text-8xl` (:109) is a dead
  class. The filter bar itself renders correctly in current code (SSR-verified
  with all vars/classes defined); there is **no search input component** in the
  shop anywhere — a filter search must be explicitly requested (see Open
  decisions).
- **Input fields**: see section 3 (audit in progress at time of writing —
  login page SSR shows a working `Input`-style primitive with absolute
  floating labels + dead `text-primary`/`focus:ring-primary` on the remember-me
  checkbox; full inventory lands in the tasks file).

## 1. Phase A — token & config repair (project-wide CSS restoration)

Scope: `src/app/globals.css`, `tokens/src/*.json`, `tailwind.config.ts`,
`scripts/splice-tokens.mjs` (only if needed). **No component files.**

A1. Define the six legacy aliases in `tokens/src/color.json` as semantic
    aliases onto existing palette tokens, then `pnpm tokens` (regenerates the
    marked :root region — the contract-correct path, no hand-edits):
    `--primary → {pink.strong}`, `--secondary → {teal}`,
    `--light → {paper.deep}`, `--dark → {ink}`, `--bg-color → {paper}`,
    `--purple → {violet}`. **Pending owner sign-off — §10: these are visual
    decisions; the mappings above restore the closest existing token and are
    the recommended default.**
A2. Remove the duplicate legacy definitions inside the `prefers-contrast: high`
    block for keys that now exist at :root (keep only true high-contrast
    overrides: `--error/--success/--warning/--info` + any that must stay).
A3. `tailwind.config.ts`: add `colors.primary: var(--primary)`,
    `colors.secondary: var(--secondary)`, `borderWidth: { 3: '3px' }`,
    `borderRadius: { card: var(--radius-lg), input: var(--radius-md) }`,
    `fontSize: { body: [var(--text-base), { lineHeight: '1.6' }] }`.
A4. `text-8xl` (shop hero): add `7xl`/`8xl` to `tokens/src/type.json`
    (72px/96px, matching the token ladder pattern) + `tailwind.config.ts`,
    `pnpm tokens`. One class usage — no component churn.
A5. Grep-guard: after A1–A4, `grep` for every legacy token/class and confirm
    each now resolves to a defined var; run the token unit test
    (`tests/unit/design-tokens.test.ts` asserts on-pairings).
A6. Environment hygiene (documented, not code): kill orphaned servers
    (`ss -ltnp | grep 3000`), `rm -rf .next`, `pnpm dev`, hard-reload. Never
    run `pnpm build` while `next dev` is live.

Validation (owner: implementer lane): `pnpm tokens` ✓, `pnpm type-check`,
`pnpm test:run`, `pnpm build`, then a render smoke of /, /shop, /login,
/admin (curl 200 + spot-check computed CSS contains the aliases), and
`pnpm exec playwright screenshot` of the same 4 pages (baseline for phases
B/C). Screenshots need a working vision provider to read — currently blocked
(see Known issues #1); static/computed-style checks stand in until then.

## 2. Phase B — shop layout

Scope: `src/app/(customer)/shop/page.tsx` (+ `[slug]`/sibling pages only if
the same offset pattern repeats).

B1. Add `pt-24` (navbar offset) to the shop root and replace `min-h-screen`
    with a flow-height wrapper — matching the convention on
    `shop/[slug]/page.tsx:48`, `orders/page.tsx:87`.
B2. Hero `md:text-8xl` becomes a real token via A4 (no code churn).
B3. Surface category-fetch errors instead of `.catch(() => {})`
    (page.tsx:65-70) so pills can't silently vanish.
B4. If the owner wants a filter **search**: new work item, small lane —
    `SearchInput` in the filter bar + client-side filter; currently absent.

Validation: `pnpm type-check && pnpm lint`; screenshot of /shop desktop +
mobile (iPhone 13 device) reviewed against the layout checklist in §6 of the
design contract (no h-scroll at 320px, 44px targets).

## 3. Phase C — input-field overhaul (remove legacy, rebuild one primitive)

Verified defects in the existing primitive `src/components/ui/Input.tsx`
(source-read, lines cited):
- D1 `text-body` in `fieldClasses` (:31) — dead class (no `fontSize.body`) →
  fields carry no explicit font-size/line-height from the token ladder.
- D2 floated label never rises: floated branch of `labelClasses` (:49-50) has
  no `top-*`; absolute label falls back to static position → stays centred
  inside the field instead of sitting on the top border as documented
  (`docs/design-system.md:296`). Unfloated/floated states both overlap field
  content; with a left icon (`pl-12`) the floated label overlaps the icon.
- D3 checkbox/radio surfaces use dead `text-primary` / `focus:ring-primary`
  (login SSR) — no color token named `primary` exists; `accent-color:
  var(--primary)` (globals.css:631-633) falls back to **browser blue
  app-wide**.
- D4 label float never tracks focus or live typing: `floated = hasValue ||
  placeholder` evaluated from initial props only (:134); `Boolean(value)`
  (:76) fails for `0`/`""`; no `:focus-within` rule → focusing an empty field
  leaves the label centered over typed text. Textarea's floated label sits at
  `top-3` INSIDE the field (:204) instead of crossing the border; Input's
  Select centers its label over the selected option when no `placeholder` prop
  is passed (:297).
- D5 duplicate global focus rules (`*:focus-visible` :523-526 ≡
  `:focus-visible` :609-612) fight utility focus rings — keep one canonical
  ring (`ui/shared.ts` FOCUS_VISIBLE) and delete both globals.
- D6 AddressForm checkbox (`appearance-none` + no background/check styling,
  AddressForm.tsx:245) → checkmark invisible in BOTH states; profile switch
  ON-state is an invisible empty pill (`border-3`/`bg-primary`/
  `border-primary` all dead, profile.tsx:463-486); admin search/filter inputs
  are square with zero focus feedback (4 drifting copies: orders:604,
  customers:224, ProductsPage:164, custom-requests:295 — two different
  paddings); SettingsForm file inputs have no `onChange` (:400,413 —
  non-functional); customers-page min-orders/date inputs no `onChange`
  (:263,267 — dead UI); dead `ui/Select` import at custom-sticker:11.
- **Audit inventory (verified)**: 10 distinct input "looks" today — shared
  floating-label primitive (~85 Input / 15 Textarea / 8 Select instances),
  duplicate Select, admin search ×4 copies, plain square selects, selects with
  divergent focus shadow (ReviewList/OrderStatusBadge), 4 checkbox variants
  (raw ×11, appearance-none, accent-ink, Radix ×4), 3 quantity steppers, 4
  file patterns, 3 range/slider implementations, 2 textareas.
  **Regression gate (audit recommendation, adopted)**: promote
  `tests/unit/globals-tokens.test.ts` from informational to failing + add a
  test that fails when a `className` references a color/radius/fontSize key
  absent from `tailwind.config.ts` (seeded by the audit's tailwind-output
  grep). This prevents the whole class of defect from recurring.

Scope: `src/components/ui/Input.tsx` (+ `ui/index.ts`), legacy form CSS in
`src/app/globals.css`, and all adopting pages. Logic layer stays frozen (§7).

C1. Delete legacy form CSS: `.form-group`, `.form-group input/textarea/select`,
    floating-label rules, `.input-error`, `.input-success`
    (globals.css:251-300, 715-722), the checkbox `accent-color` rule (:631),
    and any remaining input-touching legacy rules. Remove `form-group` usage
    from the 14 JSX sites (grep count) — none may depend on the floating-label
    CSS after the Input primitive carries labels itself.
C2. Rebuild `Input` as the single primitive per `docs/design-system.md:282-300`:
    floating label (float on value/focus), `error` (red border + ring +
    inline message + icon), `hint`, left/right `icon`, password show/hide
    toggle, `aria-invalid`/`aria-describedby` auto-wiring, `ref` forward +
    `cn()` class merge (§6), 2px ink border + `--shadow-ink-1` focus (§5),
    ≥44px target (§6), AA text roles only (§2). Follows the documented API
    exactly — no new visual decisions (§10).
C3. Consolidation: retire competing implementations in favor of the primitive
    — full verified inventory (10 distinct looks, per-file citations) is in
    the tasks file under C-03.
C4. Checkboxes/radios/selects/textareas/file inputs: one visual language with
    inputs (2px ink, focus ring, ≥44px), replacing `text-primary` dead-class
    usages with token classes.

Validation: `pnpm type-check && pnpm lint && pnpm test:run` (+ a primitives
unit test per §8's `UI_PRIMITIVE_EXPORTS` pin if the API surface changes),
login/register/profile/checkout/custom-sticker/admin screenshots, and manual
pass: tab order, focus ring, error states, reduced-motion.

## Decisions (owner-confirmed 2026-11-15)

1. **Locked alias mappings (A1)**: `--primary → pink-strong`, `--secondary →
   teal`, `--light → paper-deep`, `--dark → ink`, `--bg-color → paper`,
   `--purple → violet`. Owner confirmed the recommended defaults.
2. **Shop filter search**: YES — add a real search input to the filter bar
   (B4), since none exists today.

## Execution

Implementation was not part of this session's scope (research + plan only).
To execute: dispatch Phase A (token/config repair) first; B and C follow in
parallel once A lands, per the tasks file.

## Known issues

1. Screenshot review blocked: modlens vision providers fail on this machine
   (local claude CLI rejects model `poolside/laguna-s-2.1:free`; opencode-cli
   reuse fails opaquely). Fix = user repairs claude CLI model config or a
   provider key; until then verification uses computed-style/curl checks.
2. `pnpm build` while `next dev` runs wedges the dev server (A6) — sequence
   builds after stopping dev or use a separate `.next` build dir.
3. Legacy `--border-ink: 2px solid var(--ink)` token (:71-72) is unused dead
   weight; deletions deferred to post-repair cleanup.