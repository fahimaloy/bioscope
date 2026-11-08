# Bioscope Frontend Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire Bioscope UI layer — every page, component, theme, and motion — on a DTC-bold paper-craft design system, while leaving the working logic layer (server actions, API routes, pricing, order state, auth) untouched.

**Architecture:** The UI layer is rebuilt in place: all `src/app` route files, all `src/components`, `globals.css`, `tailwind.config.ts`, and the token/motion modules. A DTCG JSON token pipeline generates the CSS variables that `globals.css` and Tailwind both consume, so there is exactly one source of truth for color, type, shape, and motion. Logic under `src/lib` (actions, queries, pricing, order-status, validations, stores, auth, socket) is never edited except for one read-only `/track-order` lookup and the removal of the broken theme slice.

**Tech Stack:** Next.js 14.2 (App Router) + React 18 + TypeScript, Tailwind CSS v3 (CSS-variable mapping), Style Dictionary (DTCG → CSS vars + TS tokens), Radix primitives via shadcn copy-in pattern, Motion (framer-motion) + CSS animation, Lucide icons + custom SVG sprite, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-06-bioscope-frontend-design.md`

**Supersedes:** `docs/superpowers/plans/2026-11-06-complete-ui-redesign.md` and `docs/bioscope-redesign-plan.md`. Do not implement either.

---

## Global Constraints

- **Package manager:** pnpm only. Never npm/yarn.
- **Stack stays:** Next.js 14.2 + React 18 + Tailwind v3 + next-auth v5. No framework or Tailwind major upgrade in this plan.
- **Tokens:** DTCG JSON in `tokens/src/*.json`, compiled by `style-dictionary` into the marked `:root` region of `src/app/globals.css` and into `src/lib/design-tokens.ts`. `tailwind.config.ts` maps every color/radius/shadow/font token to `var(--…)`. **No hardcoded hex in any component.**
- **Logic layer is frozen:** everything in spec §8. The only permitted additions are (a) one read-only `trackOrder` server action + its API route, (b) removal of the `theme` slice from `uiStore`. Everything else under `src/lib` and `src/app/api` is read-only.
- **Compatibility:** `src/lib/motion.ts` must keep exporting `motionVariants` with every key currently consumed (`grep -rho 'motionVariants\.[a-zA-Z]*' src | sort -u` is the authority).
- **Footer** is mounted exactly once (root layout). `(customer)/layout.tsx` must not render it.
- **Copy:** English only. No new marketing claims or statistics without the owner.
- **Contrast:** WCAG AA for all text. Text on a folk accent is `--ink`; white text only on a `-strong` accent alias.
- **Decor:** one decor accent per section, maximum. Doodles are `aria-hidden`.
- **Motion is a first-class requirement, not decoration.** `transform`/`opacity` only; every animation has a `prefers-reduced-motion` fallback; nothing gates content visibility. **Every page must include at least one purposeful motion** (entrance, scroll reveal, hover spring, marquee, or a one-shot celebration). Restrained decor, rich motion — see spec §5.8.
- **Brand surfaces follow spec §5.8 (Paper + Pop):** 3px ink borders, hard offset shadows, `--gold`/`--pink`/`--violet` color blocks, rotated sticker badges, spring hover. Product cards and admin stay restrained.
- **Gates before every commit:** `pnpm verify` (runs type-check, lint, test:run, build, GitNexus `detect-changes --scope all`). A commit that skips it is not done.
- **Responsive:** mobile-first; no horizontal scroll at 320px; hit targets ≥ 44px.
- **Design decisions are settled** in spec §13. If a task seems to require a new visual decision, stop and ask — do not invent one.

---

## Review Focus

These are the failure modes the spec implies but no single task's tests will naturally exercise. Each is pinned to the task that owns it.

1. **Contrast on text-bearing folk accents** — primary buttons, badges, and status pills must pass AA. Test: `tests/unit/design-tokens.test.ts` (T0.1) plus a per-primitive render assertion (T0.4).
2. **Reduced motion** — with `prefers-reduced-motion: reduce`, no loop runs and no content is invisible. Test: `tests/unit/motion.test.ts` (T0.2) and T4.2's audit.
3. **No horizontal scroll at 320px** — every rebuilt page. Test: Playwright viewport assertion (T4.2).
4. **Focus-visible on every interactive element** — keyboard path through cart, checkout, and admin. Test: T4.2 audit + per-primitive render assertion (T0.4).
5. **The frozen logic layer still works** — auth, pricing, order transitions, cart re-pricing. Test: `pnpm test:run` must stay green across every task; T5.1 runs the full suite plus `pnpm e2e`.

---

## File Structure

**New**

```
tokens/src/color.json          # DTCG primitives + semantic aliases
tokens/src/type.json           # font families, scale, leading
tokens/src/shape.json          # radius, border, shadow, die-cut
tokens/src/motion.json         # easings, durations, springs
style-dictionary.config.cjs    # DTCG → globals.css region + design-tokens.ts
scripts/splice-tokens.mjs      # replaces the marked :root region in globals.css
scripts/gates.mjs              # pnpm verify implementation
src/lib/motion.ts              # replaced: tokens + motionVariants
src/components/brand/Wordmark.tsx
src/components/icons/{Icon.tsx,index.ts,brand/*.tsx}
src/components/motion/{Reveal,SpringHover,Slam,PageEnter,ConfettiBurst}.tsx
src/app/template.tsx
src/components/decorative/*    # rebuilt decor set
src/app/track-order/page.tsx
src/app/{faq,shipping,returns,privacy,terms,blog,careers,press,affiliates,accessibility}/page.tsx
tests/unit/design-tokens.test.ts
tests/unit/motion.test.ts
tests/unit/components/*.test.tsx
```

**Rebuilt (contents replaced, paths kept)**

`src/app/**/page.tsx`, `src/app/(customer)/layout.tsx`, `src/app/(admin)/layout.tsx`, `src/app/{loading,not-found,global-error}.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`, `src/components/**`.

**Untouched:** everything in spec §8.

---

### Task 0.0: Agent pre-setups and gates

**Files:**
- Modify: `package.json` (scripts: `verify`, `tokens`)
- Create: `scripts/gates.mjs`
- Create: `docs/DESIGN_CONTRACT.md` (the design-system contract — `AGENTS.md` is write-protected in this environment, so the contract lives here and every task brief references it)
- Modify: `.gitignore` (add `.superpowers/`)

**Interfaces:**
- Produces: `pnpm verify` → exit 0 when all gates pass; `pnpm tokens` → regenerates tokens.

- [ ] **Step 1: Add the gate script**

Create `scripts/gates.mjs` that runs, in order, `pnpm type-check`, `pnpm lint`, `pnpm test:run`, `pnpm build`, and `node .gitnexus/run.cjs detect-changes --scope all --repo .`, printing each result and exiting non-zero on the first failure. `pnpm build` may be skipped only when the task explicitly says so (never for Phase 0/1).

- [ ] **Step 2: Wire the scripts**

In `package.json` add `"verify": "node scripts/gates.mjs"` and `"tokens": "style-dictionary build && node scripts/splice-tokens.mjs"`.

- [ ] **Step 3: Write the design contract into `docs/DESIGN_CONTRACT.md`**

`AGENTS.md` is write-protected in this environment (a hook denied the write and instructed that it not be retried), so the contract lives in `docs/DESIGN_CONTRACT.md`. Write a section stating: token-only color usage (no hex), the one-accent-per-section rule, the contrast rule (including the per-accent `--on-<accent>` pairs from spec §5.2), the motion rules (including "every page has at least one purposeful motion"), the brand-surface rules from spec §5.8, the frozen-logic list, and that `pnpm verify` must pass before any commit.

- [ ] **Step 4: Add the MCP servers**

Enable Context7 (current package docs, so agents stop guessing Tailwind/Motion APIs) and Playwright (visual verification) through the MCP config tooling; keep GitNexus. If the tooling is unavailable in this environment, note it in the commit body and continue — the gates do not depend on it.

- [ ] **Step 5: Add the recurring-flow skills**

Add three short skills to the agent profile: "run the gates" (run `pnpm verify`), "token-first styling" (never hardcode hex), and "impact before edit" (GitNexus first). If skill tooling is unavailable, record the same three in AGENTS.md instead.

- [ ] **Step 6: Ignore the brainstorm workspace**

Add `.superpowers/` to `.gitignore`.

- [ ] **Step 7: Verify**

Run: `pnpm verify`
Expected: all five gates exit 0 (the codebase is green at the start of the rebuild).

- [ ] **Step 8: Commit**

```bash
git add package.json scripts/gates.mjs docs/DESIGN_CONTRACT.md .gitignore
git commit -m "chore: add design-system gates and agent contract"
```

---

### Task 0.1: Token pipeline (DTCG → CSS variables → Tailwind)

**Files:**
- Create: `tokens/src/color.json`, `tokens/src/type.json`, `tokens/src/shape.json`, `tokens/src/motion.json`
- Create: `style-dictionary.config.cjs`, `scripts/splice-tokens.mjs`
- Modify: `src/app/globals.css` (replace the `:root` block with a marked region)
- Modify: `tailwind.config.ts` (map every token to `var(--…)`)
- Create: `src/lib/design-tokens.ts` (generated typed token map)
- Test: `tests/unit/design-tokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--paper`, `--paper-deep`, `--paper-raised`, `--ink`, `--ink-soft`, `--ink-muted`, `--die-cut`, `--pink`, `--pink-strong`, `--violet`, `--orange`, `--lime`, `--teal`, `--blue`, `--gold`, `--red`, `--green`, `--brand`, `--on-brand`, `--accent`, `--info`, `--success`, `--warning`, `--error`, `--surface`, `--surface-raised`, `--surface-sunken`, `--text`, `--text-muted`, `--text-subtle`, `--text-inverse`, `--border`, `--border-strong`, `--ring`, `--overlay`, `--shadow-ink-1..4`, `--shadow-color`, `--shadow-die-cut`, `--radius-sm|md|lg|xl|pill`, `--radius-wobble-sm|md|lg`, `--border-ink`, `--border-strong`, `--ease-spring`, `--ease-out`, `--ease-in-out`, `--dur-micro|fast|base|slow|scene`, and the type scale `--text-xs…--text-6xl`.
- Produces: `designTokens` (typed object) and `DesignTokens` from `src/lib/design-tokens.ts`.

- [ ] **Step 1: Write the failing test**

`tests/unit/design-tokens.test.ts` asserts:
- `contrastRatio('#241B12', '#FAF3E3') >= 4.5` (ink on paper)
- `contrastRatio('#FFFFFF', '#C2185B') >= 4.5` (white on `--pink-strong`)
- `contrastRatio('#FFFFFF', '#9C27B0') >= 4.5` (white on `--violet`)
- `contrastRatio('#FFFFFF', '#2E7D32') >= 4.5` (white on `--green-strong`)
- `contrastRatio('#241B12', '#FF9800') >= 4.5` (ink on `--orange`)
- `contrastRatio('#241B12', '#009688') >= 4.5` (ink on `--teal`)
- a table-driven assertion that every `--on-<accent>` pair listed in spec §5.2 passes 4.5
- every semantic alias resolves to a primitive that exists in `tokens/src/color.json`.

Use a local `contrastRatio` helper (relative luminance, WCAG formula). No new dependency.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/design-tokens.test.ts`
Expected: FAIL — tokens module and/or token files do not exist.

- [ ] **Step 3: Author the DTCG tokens**

Write the four JSON files. Primitive color values are fixed by the spec: paper `#FAF3E3`, paper-deep `#F3E7CE`, paper-raised `#FFFDF7`, ink `#241B12`, ink-soft `#4A3B2C`, ink-muted `#7A6A57`, die-cut `#FFFFFF`, pink `#E91E63`, pink-strong `#C2185B`, violet `#9C27B0`, orange `#FF9800`, lime `#8BC34A`, teal `#009688`, blue `#2196F3`, gold `#FBC02D`, red `#D32F2F`, green `#388E3C`, green-strong `#2E7D32`. Semantic aliases resolve exactly as in spec §5.2, including the per-accent `--on-<accent>` pairs from the table there. Shape, type, and motion tokens as in spec §5.3–§5.5.

- [ ] **Step 4: Configure Style Dictionary**

`style-dictionary.config.cjs` has two targets: a CSS target emitting the `:root` block (with the semantic aliases and the `--shadow-die-cut` fix), and a TS target emitting `src/lib/design-tokens.ts` (`export const designTokens = … as const; export type DesignTokens = typeof designTokens`).

- [ ] **Step 5: Splice into globals.css**

`scripts/splice-tokens.mjs` replaces the region between `/* @tokens-start (generated) */` and `/* @tokens-end */` in `src/app/globals.css` with the generated block. Put those markers in `globals.css` in place of the current hand-written `:root`.

- [ ] **Step 6: Map tokens into Tailwind**

In `tailwind.config.ts`, replace every raw color with `var(--…)` and add radius, shadow, fontFamily, and motion mappings. Keep `darkMode: 'class'` (the class is gone, but leaving the key is harmless) — do not add dark tokens.

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/design-tokens.test.ts`
Expected: PASS.

- [ ] **Step 8: Verify the build**

Run: `pnpm build`
Expected: success; the page still renders (visually broken is fine at this stage — only the token layer changed).

- [ ] **Step 9: Commit**

```bash
git add tokens style-dictionary.config.cjs scripts/splice-tokens.mjs src/app/globals.css tailwind.config.ts src/lib/design-tokens.ts tests/unit/design-tokens.test.ts
git commit -m "feat(tokens): add DTCG token pipeline and map into Tailwind"
```

---

### Task 0.2: Fonts and motion system

**Files:**
- Modify: `src/app/layout.tsx` (fonts via `next/font/google`)
- Modify: `src/lib/motion.ts` (rewrite on motion tokens)
- Modify: `tailwind.config.ts` (fontFamily + motion tokens)
- Test: `tests/unit/motion.test.ts`

**Interfaces:**
- Consumes: `tokens/src/type.json`, `tokens/src/motion.json` (T0.1)
- Produces: `motionVariants` with keys `staggerContainer`, `staggerItem`, `pulseSoft`, `slideInRight`, `slideInLeft`, plus every key found by `grep -rho 'motionVariants\.[a-zA-Z]*' src | sort -u`.

- [ ] **Step 1: Write the failing test**

`tests/unit/motion.test.ts` imports `motionVariants` and asserts each key is a valid Motion variant object (has `initial` and/or `animate`), and that `staggerContainer` defines `staggerChildren`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/motion.test.ts`
Expected: FAIL — module missing or keys absent.

- [ ] **Step 3: Wire the fonts**

In `layout.tsx`, remove `Shantell_Sans`/`Caveat`/`Nunito` and the `globals.css` `@import`. Load `Shrikhand` (weight `400`), `Outfit` (`400,500,600,700`), `Caveat` (`400,600,700`) via `next/font/google`, assigned to `--font-display`, `--font-body`, `--font-hand`. Apply the variables to `<html>`.

- [ ] **Step 4: Rewrite the motion module**

`src/lib/motion.ts` exports `motionVariants` built from the motion tokens (spring presets: stiffness 400–550, damping 20–30; press 700/30). Keep the existing key names. Add `useReducedMotion` support in the variants that loop.

- [ ] **Step 5: Map fonts and motion into Tailwind**

`fontFamily.display/body/hand` → `var(--font-*)`; add `transitionTimingFunction` and `transitionDuration` from the motion tokens.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/motion.test.ts`
Expected: PASS.

- [ ] **Step 7: Verify no consumer broke**

Run: `grep -rho 'motionVariants\.[a-zA-Z]*' src | sort -u`
Expected: every key listed exists in the new module (the test in Step 1 already asserts this).

- [ ] **Step 8: Commit**

```bash
git add src/app/layout.tsx src/lib/motion.ts tailwind.config.ts src/app/globals.css tests/unit/motion.test.ts
git commit -m "feat(theme): wire Shrikhand/Outfit/Caveat and token-based motion"
```

---

### Task 0.3: Decor and doodle component set

**Files:**
- Create: `src/components/decorative/{WashiTape,StickerPeel,TornEdge,SketchUnderline,DoodleStar,DoodleHeart,DoodleArrow,DoodleSquiggle,DoodleSparkle,DoodleScatter,MarqueeRibbon,GrainOverlay,GridPaper}.tsx`
- Modify: `src/components/decorative/index.ts`
- Delete: `src/components/decorative/DoodleBackground.tsx`, `DoodleElements.tsx`, `DoodleScatter.tsx` (replaced)
- Test: `tests/unit/components/decor.test.tsx`

**Interfaces:**
- Produces: the fourteen components above, all `aria-hidden`, all styled exclusively with tokens.

- [ ] **Step 1: Write the failing test**

`tests/unit/components/decor.test.tsx` renders `DoodleStar`, `WashiTape`, `MarqueeRibbon`, and `DoodleScatter` and asserts each renders an element with `aria-hidden="true"` and no text content.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/decor.test.tsx`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement the set**

Build the components. `MarqueeRibbon` takes `items: string[]`, duplicates them for a seamless loop, pauses on hover, and is `aria-hidden`. `DoodleScatter` takes `count` (default 6, hard max 6) and positions children with inline `left/top/rotate` from a deterministic seed. `TornEdge`, `WashiTape`, `StickerPeel`, `SketchUnderline` are presentational. All colors come from `var(--…)`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/decor.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/decorative
git commit -m "feat(decor): rebuild the doodle/decor set on tokens"
```

---

### Task 0.4: Core UI primitives

**Files:**
- Modify: `src/components/ui/{Button,Card,Badge,Input,Select,Checkbox,Slider,ColorPicker,ImageUpload,Modal,Dropdown,Tabs,Tooltip,Accordion,Skeleton,Pagination,DataTable,ErrorBoundary,GlobalLoading}.tsx`
- Modify: `src/components/ui/index.ts`
- Test: `tests/unit/components/primitives.test.tsx`

**Interfaces:**
- Consumes: tokens (T0.1), motion (T0.2), decor (T0.3)
- Produces: primitives with token-based variants. `Button` variants: `primary` (ink text on `--gold`), `secondary` (white on `--pink-strong`), `outline`, `ghost`, `destructive` (white on `--red-strong`). Every interactive primitive forwards `ref`, merges `className` via `cn`, and has a visible focus ring.

- [ ] **Step 1: Write the failing test**

`tests/unit/components/primitives.test.tsx` asserts for Button, Badge, Input, Select, Checkbox, Modal, Tabs, Tooltip, Accordion, Skeleton, Pagination:
- renders its children/label,
- applies `aria-hidden` only where appropriate,
- has a `focus-visible` style rule in its class string (or a `data-*` hook the audit can check),
- Button renders each variant without throwing.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/primitives.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Rebuild the primitives**

Replace each component's internals. Rules:
- No raw hex; every color is `var(--…)` or a Tailwind token utility.
- `border-3`/`rounded-pill` and other undefined utilities are replaced with real Tailwind classes or config-mapped tokens.
- `Button` keeps `variant`/`size`/`loading`/`icon`/`iconPosition`/`fullWidth` props; the `doodle*` variants are removed (Paper + Pop is the default brand treatment now, not a variant).
- `Card` gets `elevation` (`flat|raised|sticker`) where `sticker` applies `--shadow-die-cut`.
- `Modal`/`Dropdown`/`Tabs`/`Tooltip` keep their Radix wiring; only styling changes.
- `DataTable` gets a `density` prop (`comfortable|compact`) for admin later.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/primitives.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify the build**

Run: `pnpm build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui tests/unit/components/primitives.test.tsx
git commit -m "feat(ui): rebuild primitives on the token system"
```

---

### Task 0.5: Brand assets and wordmark lockup

**Files:**
- Create: `src/components/brand/Wordmark.tsx`
- Create: `src/app/icon.svg`
- Create: `src/app/opengraph-image.tsx`
- Modify: `src/app/layout.tsx` (metadata/OG)
- Test: `tests/unit/components/wordmark.test.tsx`

**Interfaces:**
- Produces: `<Wordmark />` rendering the logo image + the Shrikhand `bioscope` wordmark; props `variant` (`light|dark`), `size` (`sm|md|lg`).

- [ ] **Step 1: Write the failing test**

Asserts `<Wordmark />` renders an `img` with `alt="bioscope"` and a text node `bioscope`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/wordmark.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`Wordmark` uses `next/image` for `/images/bioscope-logo.png` and renders the wordmark in `var(--font-display)`. `icon.svg` is the mark on a paper background. `opengraph-image.tsx` renders the lockup at 1200×630 using the same component.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/wordmark.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/brand src/app/icon.svg src/app/opengraph-image.tsx src/app/layout.tsx
git commit -m "feat(brand): add bioscope wordmark lockup and OG image"
```

---

### Task 0.6: Icon system

**Files:**
- Create: `src/components/icons/index.ts`
- Create: `src/components/icons/Icon.tsx`
- Create: `src/components/icons/brand/{StarIcon,HeartIcon,ArrowRightIcon,SquiggleIcon,SparkleIcon}.tsx`
- Modify: `src/components/ui/Button.tsx` (its `icon` prop accepts `ReactNode`, unchanged)
- Test: `tests/unit/components/icons.test.tsx`

**Interfaces:**
- Produces: `<Icon name={IconName} />` where `IconName` is a union of chrome names (`cart`, `search`, `chevron-down`, `plus`, `minus`, `x`, `truck`, `shield-check`, `package`, `sparkles`, `arrow-right`, `star`, `heart`, `upload`, `download`, `user`, `settings`, `log-out`) and brand names (`star`, `heart`, `arrow`, `squiggle`, `sparkle`). All render `aria-hidden="true"` and `focusable="false"` and inherit `currentColor`.

- [ ] **Step 1: Write the failing test**

`tests/unit/components/icons.test.tsx` asserts every name in `IconName` renders an `svg` with `aria-hidden="true"`, and that an unknown name throws.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/icons.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Chrome names map to `lucide-react` (already installed). Brand names are hand-authored inline SVGs with a consistent 2px stroke and rounded caps — no emoji, no icon font, no new dependency. Do not add Phosphor: Lucide plus the hand-authored set covers the spec.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/icons.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/icons tests/unit/components/icons.test.tsx
git commit -m "feat(icons): add Lucide-plus-sprite icon system"
```

---

### Task 0.7: Motion and interaction system

**Files:**
- Create: `src/components/motion/{Reveal,SpringHover,Slam,PageEnter,ConfettiBurst}.tsx`
- Create: `src/components/motion/index.ts`
- Create: `src/app/template.tsx`
- Modify: `src/components/ui/Button.tsx` (spring press + optional `slam` on click)
- Test: `tests/unit/components/motion.test.tsx`

**Interfaces:**
- Consumes: `motionVariants` (T0.2), tokens (T0.1), decor (T0.3)
- Produces: `<Reveal>` (whileInView, fires once), `<SpringHover>` (hover lift + shadow grow), `<Slam>` (scale 1.4→1 with a slight rotate on add-to-cart), `<PageEnter>` (used by `template.tsx`), `<ConfettiBurst>` (capped particles). All are `prefers-reduced-motion` safe.

- [ ] **Step 1: Write the failing test**

`tests/unit/components/motion.test.tsx` asserts:
- `Reveal` renders children and sets `whileInView` with `viewport={{ once: true }}`
- `ConfettiBurst` renders no canvas when `prefers-reduced-motion: reduce` is set (mock `window.matchMedia`)
- `Slam` wraps children and applies a `whileTap` scale
- `PageEnter` renders children

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/motion.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the primitives**

Build the five components on the motion tokens. `Reveal` uses `motionVariants.fadeInUp` with `whileInView` and `viewport={{ once: true, margin: '-80px' }}`. `SpringHover` grows the shadow one step and lifts 4px. `Slam` is `scale: [1.4, 1], rotate: [-6, 0]` on `whileTap`. `PageEnter` is a 250ms fade/slide. `ConfettiBurst` is a small canvas with a 60-particle cap, fired once, and skipped entirely under reduced motion.

- [ ] **Step 4: Add the page template**

`src/app/template.tsx` wraps `{children}` in `<PageEnter>`. This gives every route a light, consistent enter animation under App Router without a client wrapper.

- [ ] **Step 5: Wire the button press**

`Button` gets a spring press (`whileTap`) from the motion tokens. Do not add `slam` to every button — only add-to-cart and order-success actions use `Slam`.

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/motion.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/motion src/app/template.tsx src/components/ui/Button.tsx tests/unit/components/motion.test.tsx
git commit -m "feat(motion): add the interaction system and page enter animation"
```

---

### Task 1.1: Root layout, providers, and Footer dedupe

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(customer)/layout.tsx`
- Modify: `src/components/providers/{Providers,QueryProvider,SocketProvider,AuthProvider}.tsx`
- Delete: `src/components/providers/ThemeProvider.tsx`
- Modify: `src/lib/stores/uiStore.ts` (remove `theme`)

**Interfaces:**
- Consumes: tokens, motion, primitives (T0.1–T0.4)
- Produces: a root shell with `Navbar`? No — navbar is T1.2. This task owns the shell and providers only.

- [ ] **Step 1: Remove the theme machinery**

Delete `ThemeProvider.tsx`, remove `theme`/`setTheme`/`resolvedTheme` from `uiStore`, drop `next-themes` from `Providers.tsx` and `package.json` if unused elsewhere.

- [ ] **Step 2: Mount the Footer once**

Root layout renders `<Footer />`; `(customer)/layout.tsx` must not. Delete the import and the element from the customer layout.

- [ ] **Step 3: Rebuild the shell**

`<body>` uses `var(--paper)` background and `var(--font-body)`. `MotionConfig reducedMotion="user"` stays. `Toaster` stays but is restyled via the token-based `toastOptions` class.

- [ ] **Step 4: Verify**

Run: `pnpm verify`
Expected: all gates pass; the app renders with one footer.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx "src/app/(customer)/layout.tsx" src/components/providers src/lib/stores/uiStore.ts package.json
git commit -m "feat(shell): rebuild root layout, remove broken theme, mount footer once"
```

---

### Task 1.2: Navbar and MobileNav

**Files:**
- Modify: `src/components/layout/{Navbar,MobileNav}.tsx`
- Modify: `src/app/layout.tsx` (mount the navbar)
- Test: `tests/unit/components/navbar.test.tsx`

**Interfaces:**
- Consumes: `Wordmark` (T0.5), primitives (T0.4), cart store
- Produces: `<Navbar />` with the lockup, nav links (Shop, Custom Sticker, About, Contact), a cart button with count, and a mobile menu.

- [ ] **Step 1: Write the failing test**

Asserts `<Navbar />` renders the wordmark, the four links, and the cart control; asserts the mobile menu is closed initially and opens on the menu button.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/navbar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Navbar: paper background, 2px ink bottom border, `<Wordmark size="md" />`, links as pills that fill on hover with a spring. Mobile: full-width panel below the bar, staggered link entrance, `aria-expanded` wired. **Mount `<Navbar />` at the top of `<body>` in `src/app/layout.tsx`, replacing any existing navbar element.**

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/navbar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout tests/unit/components/navbar.test.tsx
git commit -m "feat(layout): rebuild navbar and mobile nav"
```

---

### Task 1.3: Footer with real destinations

**Files:**
- Modify: `src/components/layout/Footer.tsx`
- Test: `tests/unit/components/footer.test.tsx`

**Interfaces:**
- Consumes: `Wordmark` (T0.5)
- Produces: footer with the link columns that match the 11 real routes (T2.11/T2.12 own those pages).

- [ ] **Step 1: Write the failing test**

Asserts the footer links to `/faq`, `/shipping`, `/returns`, `/track-order`, `/privacy`, `/terms`, `/blog`, `/careers`, `/press`, `/affiliates`, `/accessibility`, `/shop`, `/custom-sticker`, `/about`, `/contact`, `/orders`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/footer.test.tsx`
Expected: FAIL (some routes absent).

- [ ] **Step 3: Implement**

Ink background, paper text, four columns (Shop, Company, Support, Legal) plus a contact block and the wordmark. One decor accent: a single `MarqueeRibbon` above the columns or a `TornEdge` at the top.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/footer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Footer.tsx tests/unit/components/footer.test.tsx
git commit -m "feat(layout): rebuild footer with real destinations"
```

---

### Task 1.4: Admin layout and sidebar

**Files:**
- Modify: `src/app/(admin)/layout.tsx`
- Modify: `src/components/layout/AdminSidebar.tsx`
- Test: `tests/unit/components/admin-sidebar.test.tsx`

**Interfaces:**
- Consumes: `motionVariants` (T0.2), primitives (T0.4)
- Produces: admin chrome with the `isAdmin` guard preserved and a sidebar nav.

- [ ] **Step 1: Write the failing test**

Asserts the sidebar renders Dashboard, Products, Orders, Custom Requests, Customers, Analytics, Settings; asserts the guard still redirects a non-admin (mock `useAuth`).

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/admin-sidebar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Calm-pro treatment (spec §13): near-white surfaces, hairline borders, one teal accent, dense type. The active item gets a gold left bar. Keep the `isAdmin` check and the logout action exactly as they are. **Mount `<AdminSidebar />` in `(admin)/layout.tsx`.**

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/admin-sidebar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/layout.tsx" src/components/layout/AdminSidebar.tsx tests/unit/components/admin-sidebar.test.tsx
git commit -m "feat(admin): rebuild admin layout and sidebar as a calm pro tool"
```

---

### Task 1.5: Cart drawer and page wrapper

**Files:**
- Modify: `src/components/cart/CartDrawer.tsx`
- Modify: `src/components/layout/PageWrapper.tsx`
- Modify: `src/app/layout.tsx` (mount the drawer)
- Test: `tests/unit/components/cart-drawer.test.tsx`

**Interfaces:**
- Consumes: cart store, primitives, decor
- Produces: `<CartDrawer />` (open/closed, items, qty steppers, subtotal, checkout CTA) and `<PageWrapper />` (`background` prop: `default|grid|none`).

- [ ] **Step 1: Write the failing test**

Asserts the drawer is hidden when closed, lists items when open, and disables checkout when empty.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/cart-drawer.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Drawer: paper surface, 3px ink left border, ink offset shadow, spring entrance, focus trap, ESC to close, `aria-label="Cart"`. PageWrapper: applies the page background and optional `GridPaper`. **Mount `<CartDrawer />` in the root layout next to the `Toaster`.**

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/cart-drawer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/cart/CartDrawer.tsx src/components/layout/PageWrapper.tsx tests/unit/components/cart-drawer.test.tsx
git commit -m "feat(cart): rebuild cart drawer and page wrapper"
```

---

### Task 2.1: Landing page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/product/ProductCard.tsx`
- Test: `tests/unit/components/product-card.test.tsx`

**Interfaces:**
- Consumes: `ProductCard` (this task owns it), decor, primitives, real featured-products query (`src/lib/queries/products.ts` — read-only)
- Produces: `<ProductCard product={…} />` in the **Clean sheet** treatment (spec §13), and the landing page with the **Editorial** hero.

- [ ] **Step 1: Write the failing test**

Asserts `<ProductCard />` renders the product name, price formatted with the BDT symbol, and an add-to-cart control; asserts the landing renders a heading containing "stick".

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/components/product-card.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement ProductCard (Clean sheet)**

Flat 2px ink border, colored offset shadow (`--shadow-color`), 1:1 image area with the default image (`/images/stickers/skull_sticker.png` when `product.images` is empty), name, price, add-to-cart. Hover: spring lift + shadow grow. No rotation, no die-cut outline.

- [ ] **Step 4: Implement the landing**

Editorial hero (spec §13): oversized Shrikhand headline with the word "fun" in `--pink`, an organic blob frame around the sticker, a hand-written CTA line, and two real CTAs (Browse Stickers, Design Custom). Below: a `MarqueeRibbon`, then featured products (real query, fallback to a static list only if the query returns empty), then a custom-sticker CTA band. One decor accent per section.

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm vitest run tests/unit/components/product-card.test.tsx`
Expected: PASS.

- [ ] **Step 6: Verify the build**

Run: `pnpm build`
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/components/product/ProductCard.tsx tests/unit/components/product-card.test.tsx
git commit -m "feat(landing): editorial hero, featured products, clean-sheet card"
```

---

### Task 2.2: Shop page

**Files:**
- Modify: `src/app/(customer)/shop/page.tsx`
- Modify: `src/components/product/{ProductGrid,ProductCard}.tsx` (grid only)
- Test: `tests/unit/pages/shop.test.tsx`

**Interfaces:**
- Consumes: `ProductCard` (T2.1), `parsePagination`/`buildPagination` from `src/lib/utils.ts` (read-only)
- Produces: uniform 1:1 grid (2 cols mobile, 3 tablet, 4 desktop), category filter pills, sort select, pagination.

- [ ] **Step 1: Write the failing test**

Asserts the shop renders a grid of `ProductCard` elements and that changing the category filter changes the rendered set (mock the query).

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/shop.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Server Component shell; filter/sort/pagination as client islands. Grid uses the Clean sheet card. Pagination uses the rebuilt `Pagination`. Empty state uses a `DoodleSparkle` + a clear-filters CTA.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/shop.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/shop/page.tsx" src/components/product tests/unit/pages/shop.test.tsx
git commit -m "feat(shop): uniform 1:1 grid with filters and pagination"
```

---

### Task 2.3: Product detail

**Files:**
- Modify: `src/app/(customer)/shop/[slug]/page.tsx`
- Modify: `src/components/product/{ProductDetail,ProductConfigurator,DimensionSelector,QuantitySelector,ReviewForm,ReviewList}.tsx`
- Test: `tests/unit/pages/product-detail.test.tsx`

**Interfaces:**
- Consumes: pricing (`src/lib/pricing.ts`, read-only), `ProductCard` (T2.1)
- Produces: gallery, configurator (dimension chips + quantity), price block, reviews, related products.

- [ ] **Step 1: Write the failing test**

Asserts the configurator renders the allowed dimensions from the product, updates the displayed price when a dimension is selected (using the real `pricing` helper), and renders the review list.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/product-detail.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Two-column layout (gallery left, config right) collapsing to one column. Dimension chips use the `Button` outline/primary pair. Price uses the display font. Related products use the Clean sheet card in a 4-column grid.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/product-detail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/shop/[slug]/page.tsx" src/components/product tests/unit/pages/product-detail.test.tsx
git commit -m "feat(product): rebuild detail page and configurator"
```

---

### Task 2.4: Cart page

**Files:**
- Modify: `src/app/(customer)/cart/page.tsx`
- Modify: `src/components/cart/{CartItem,CartSummary,PromoCode}.tsx`
- Test: `tests/unit/pages/cart.test.tsx`

**Interfaces:**
- Consumes: cart store, `CartDrawer` styling language (T1.5)
- Produces: cart page with line items, quantity steppers, order summary, and checkout CTA.

- [ ] **Step 1: Write the failing test**

Asserts the cart page renders the items from the store, updates quantity, and shows the correct subtotal via the real pricing helper.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/cart.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Two-column (items | summary) collapsing to stacked. Empty state with a `DoodleArrow` and a shop CTA. Summary card is receipt-styled with a dashed border.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/cart.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/cart/page.tsx" src/components/cart tests/unit/pages/cart.test.tsx
git commit -m "feat(cart): rebuild cart page and summary"
```

---

### Task 2.5: Checkout

**Files:**
- Modify: `src/app/(customer)/checkout/page.tsx`
- Modify: `src/components/checkout/{AddressForm,CheckoutProgressStepper,OrderSummary,PaymentMethod,OrderConfirmation}.tsx`
- Test: `tests/unit/pages/checkout.test.tsx`

**Interfaces:**
- Consumes: server actions (`src/lib/actions/order.ts`, read-only), cart store
- Produces: 3-step checkout (address → payment → confirm), order confirmation with a one-shot confetti burst.

- [ ] **Step 1: Write the failing test**

Asserts the stepper advances only when the current step is valid, and that the confirmation step renders the order number.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/checkout.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Keep the existing action calls and re-pricing exactly as they are. Restyle: receipt card, dashed separators, stepper as numbered ink circles with a dashed connector. Confetti only on the confirmation step, capped particles, reduced-motion safe.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/checkout.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/checkout/page.tsx" src/components/checkout tests/unit/pages/checkout.test.tsx
git commit -m "feat(checkout): rebuild checkout flow and confirmation"
```

---

### Task 2.6: Custom sticker builder

**Files:**
- Modify: `src/app/(customer)/custom-sticker/page.tsx`
- Modify: `src/components/custom-sticker/{StickerCanvas,UploadZone,EditingTools,DimensionControls,ColorAdjustments,PreviewPanel,LayerPanel,ExportPreview}.tsx`
- Test: `tests/unit/pages/custom-sticker.test.tsx`

**Interfaces:**
- Consumes: `fabric` (already installed), upload route, `useStickerBuilder` (read-only)
- Produces: three-panel builder (tools | canvas | preview) collapsing to tabs on mobile.

- [ ] **Step 1: Write the failing test**

Asserts the builder renders the canvas panel, the tools panel, and the preview panel, and that the mobile tab control switches panels.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/custom-sticker.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Grid-paper background on the canvas area only. Panels are sticky-note tinted cards with a `WashiTape` header. Keep all Fabric.js behaviour and the existing upload/request flow unchanged.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/custom-sticker.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/custom-sticker/page.tsx" src/components/custom-sticker tests/unit/pages/custom-sticker.test.tsx
git commit -m "feat(builder): rebuild custom sticker builder surfaces"
```

---

### Task 2.7: Orders list and detail

**Files:**
- Modify: `src/app/(customer)/orders/page.tsx`
- Modify: `src/app/(customer)/orders/[id]/page.tsx`
- Modify: `src/components/admin/OrderStatusBadge.tsx`, `OrderTimeline.tsx` (shared)
- Test: `tests/unit/pages/orders.test.tsx`

**Interfaces:**
- Consumes: `canTransition`/`order-status` (read-only), queries (read-only), socket hook
- Produces: order list cards, order detail with timeline and items.

- [ ] **Step 1: Write the failing test**

Asserts the list renders one card per order with a status badge, and the detail renders the timeline steps.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/orders.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Status badges use the token semantic colors (pending `--warning`, processing `--info`, shipped `--teal`, delivered `--success`, cancelled `--error`) with `--ink` text. Timeline is a vertical dashed line with ink dots. Keep the realtime socket updates.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/orders.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/orders" src/components/admin/OrderStatusBadge.tsx src/components/admin/OrderTimeline.tsx tests/unit/pages/orders.test.tsx
git commit -m "feat(orders): rebuild order list and detail"
```

---

### Task 2.8: Profile and addresses

**Files:**
- Modify: `src/app/(customer)/profile/page.tsx`
- Test: `tests/unit/pages/profile.test.tsx`

**Interfaces:**
- Consumes: `useAuth`, address API routes (read-only)
- Produces: tabbed profile (Account, Addresses, Orders, Security).

- [ ] **Step 1: Write the failing test**

Asserts the tabs switch panels and the address list renders addresses from the mocked fetch.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/profile.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Folder-tab styling with the display font. Keep the existing actions and validation messages.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/profile.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/profile/page.tsx" tests/unit/pages/profile.test.tsx
git commit -m "feat(profile): rebuild profile and addresses"
```

---

### Task 2.9: Login and register

**Files:**
- Modify: `src/app/(customer)/login/page.tsx`
- Modify: `src/app/(customer)/register/page.tsx`
- Test: `tests/unit/pages/auth.test.tsx`

**Interfaces:**
- Consumes: `src/lib/actions/auth`? (auth uses API routes + `useAuth`), validations (read-only)
- Produces: centered auth cards with the existing password toggle and strength meter.

- [ ] **Step 1: Write the failing test**

Asserts the login form renders email/password and a submit, and that the password toggle changes `type` and `aria-label`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/auth.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Keep all existing behaviour (toggle, strength meter, match validation). Restyle as a paper card with a single `WashiTape` accent.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/auth.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/login/page.tsx" "src/app/(customer)/register/page.tsx" tests/unit/pages/auth.test.tsx
git commit -m "feat(auth): rebuild login and register"
```

---

### Task 2.10: About and contact

**Files:**
- Modify: `src/app/(customer)/about/page.tsx`
- Modify: `src/app/(customer)/contact/page.tsx`
- Test: `tests/unit/pages/content.test.tsx`

**Interfaces:**
- Produces: about page (story, materials, values, team) and contact page (form, details, FAQ accordion).

- [ ] **Step 1: Write the failing test**

Asserts the contact form renders the fields and the FAQ accordion expands on click.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/content.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

About: editorial hero + material swatches + team polaroids. Contact: form card + contact detail cards + accordion. Copy is placeholder until the owner supplies real content — do not invent claims.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/content.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(customer)/about/page.tsx" "src/app/(customer)/contact/page.tsx" tests/unit/pages/content.test.tsx
git commit -m "feat(content): rebuild about and contact"
```

---

### Task 2.11: Content pages — shop policies

**Files:**
- Create: `src/app/{faq,shipping,returns,privacy,terms}/page.tsx`
- Create: `src/components/content/ContentPage.tsx` (shared shell: hero + prose body + FAQ accordion)
- Test: `tests/unit/pages/content-pages.test.tsx`

**Interfaces:**
- Produces: `<ContentPage title eyebrow sections[]>`, where a section is `{ heading: string; body: string[] }`.

- [ ] **Step 1: Write the failing test**

Asserts `<ContentPage />` renders the title and every section heading, and that the FAQ page's accordion expands.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/content-pages.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Body copy is clearly marked placeholder (`<!-- TODO: owner copy -->`) — no invented policy text. FAQ uses the rebuilt `Accordion`; Shipping/Rates and Returns use tables/lists.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/content-pages.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/faq src/app/shipping src/app/returns src/app/privacy src/app/terms src/components/content tests/unit/pages/content-pages.test.tsx
git commit -m "feat(content): add shop policy pages"
```

---

### Task 2.12: Content pages — company

**Files:**
- Create: `src/app/{blog,careers,press,affiliates,accessibility}/page.tsx`
- Modify: `src/components/content/ContentPage.tsx` (add an article-list variant)
- Test: `tests/unit/pages/company-pages.test.tsx`

**Interfaces:**
- Consumes: `ContentPage` (T2.11)

- [ ] **Step 1: Write the failing test**

Asserts each route renders a page (import each page module and render it) and that the blog index renders the article list.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/company-pages.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Blog: index + `[slug]` article template with placeholder posts. Careers/Press/Affiliates/Accessibility: single content pages. All copy placeholder-marked.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/company-pages.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/blog src/app/careers src/app/press src/app/affiliates src/app/accessibility src/components/content tests/unit/pages/company-pages.test.tsx
git commit -m "feat(content): add company pages"
```

---

### Task 2.13: Track order (the one new backend piece)

**Files:**
- Create: `src/lib/actions/trackOrder.ts`
- Create: `src/app/api/orders/track/route.ts`
- Create: `src/app/track-order/page.tsx`
- Test: `tests/unit/track-order.test.ts`

**Interfaces:**
- Consumes: `prisma` (read-only), `handleRouteError`, `ok` from `src/lib/api-utils.ts` (read-only), `requireUser` — **not** required here (public lookup)
- Produces: `trackOrder(input: { orderNumber: string; email: string })` returning `{ orderNumber, status, placedAt, items, total }` or throwing `AppError(404)`.

- [ ] **Step 1: Write the failing test**

Asserts `trackOrder` returns the order for a matching number+email and throws `AppError` with status 404 for a mismatch.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/track-order.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the action**

`trackOrder` validates with Zod (`orderNumber` string min 3, `email` email), queries `prisma.order.findFirst` where `orderNumber` and `user.email` match, and returns a narrow shape. No writes, no session.

- [ ] **Step 4: Implement the route**

`src/app/api/orders/track/route.ts` wraps the action in `try/catch → handleRouteError`, returns `ok(data)`. This is the only new file under `src/app/api`.

- [ ] **Step 5: Implement the page**

Public page with an order-number + email form, the result card, and a link to `/orders`. Rate-limit by the existing middleware? No — keep it simple; note it in the commit body.

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm vitest run tests/unit/track-order.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/actions/trackOrder.ts src/app/api/orders/track/route.ts src/app/track-order/page.tsx tests/unit/track-order.test.ts
git commit -m "feat(orders): add public track-order lookup"
```

---

### Task 3.1: Admin dashboard

**Files:**
- Modify: `src/app/(admin)/admin/dashboard/page.tsx`
- Modify: `src/components/admin/StatsCards.tsx`
- Test: `tests/unit/pages/admin-dashboard.test.tsx`

**Interfaces:**
- Consumes: `src/lib/queries/orders.ts` / `products.ts` (read-only), `recharts` (installed)
- Produces: stat cards, revenue chart, recent orders, activity feed.

- [ ] **Step 1: Write the failing test**

Asserts the dashboard renders the four stat cards and the recent-orders table.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/admin-dashboard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Calm-pro surfaces (spec §13): near-white, hairline borders, one teal accent, dense type, no offset shadows except on the primary action. Chart colors come from tokens.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/admin-dashboard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/dashboard/page.tsx" src/components/admin/StatsCards.tsx tests/unit/pages/admin-dashboard.test.tsx
git commit -m "feat(admin): rebuild dashboard"
```

---

### Task 3.2: Admin products

**Files:**
- Modify: `src/app/(admin)/admin/products/page.tsx`
- Modify: `src/components/admin/{ProductsPage,ProductForm,ProductPreview}.tsx`
- Test: `tests/unit/pages/admin-products.test.tsx`

**Interfaces:**
- Consumes: `src/lib/actions/product.ts` (read-only), `src/lib/validations/product.ts` (read-only), `DataTable`
- Produces: product table with image, name, price, stock, status, and a create/edit modal.

- [ ] **Step 1: Write the failing test**

Asserts the table renders a row per product and the modal opens from the "New product" button.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/admin-products.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Keep the existing actions and validation messages exactly. Default image is `/images/stickers/skull_sticker.png` when none is uploaded.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/admin-products.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/products/page.tsx" src/components/admin tests/unit/pages/admin-products.test.tsx
git commit -m "feat(admin): rebuild products admin"
```

---

### Task 3.3: Admin orders

**Files:**
- Modify: `src/app/(admin)/admin/orders/page.tsx`
- Test: `tests/unit/pages/admin-orders.test.tsx`

**Interfaces:**
- Consumes: `canTransition` (read-only), order actions (read-only), `OrderStatusBadge`, `OrderTimeline`
- Produces: orders table with a status-transition control that disables invalid transitions.

- [ ] **Step 1: Write the failing test**

Asserts that for an order in `PENDING`, the control offers only the transitions `canTransition` allows, and that invalid ones are disabled.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/admin-orders.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Keep the transition logic untouched. Restyle as a dense calm-pro table with a bulk-action bar.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/admin-orders.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/orders/page.tsx" tests/unit/pages/admin-orders.test.tsx
git commit -m "feat(admin): rebuild orders admin"
```

---

### Task 3.4: Admin custom requests

**Files:**
- Modify: `src/app/(admin)/admin/custom-requests/page.tsx`
- Modify: `src/components/admin/{DeliveryConfig.tsx,NotificationList.tsx}`
- Test: `tests/unit/pages/admin-custom-requests.test.tsx`

**Interfaces:**
- Consumes: custom-request actions (read-only), `canTransition` (read-only)
- Produces: request queue with image preview, pricing input, approve/reject.

- [ ] **Step 1: Write the failing test**

Asserts the request list renders with status badges and that the pricing input is disabled unless the request is in a pricing state.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/admin-custom-requests.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Queue layout: a filter rail (status tabs with counts) and a request list. Each request row shows the uploaded art thumbnail, dimensions, material, quantity, and the customer's note. The pricing input is enabled only when the request is in a pricing-eligible state; approve/reject call the existing actions and refresh via `revalidatePath`. Restyle `DeliveryConfig` and `NotificationList` as calm-pro cards.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/admin-custom-requests.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/custom-requests/page.tsx" src/components/admin tests/unit/pages/admin-custom-requests.test.tsx
git commit -m "feat(admin): rebuild custom requests admin"
```

---

### Task 3.5: Admin customers

**Files:**
- Modify: `src/app/(admin)/admin/customers/page.tsx`
- Test: `tests/unit/pages/admin-customers.test.tsx`

**Interfaces:**
- Consumes: customers query (read-only), `DataTable`

- [ ] **Step 1: Write the failing test**

Asserts the table renders customers with an order-count column and a status badge.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/admin-customers.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Dense table: name, email, phone, order count, total spent, status badge, joined date. Keep the existing customers query and any pagination untouched. Row click opens a detail drawer with that customer's orders (reuse the order timeline components from T2.7).

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/admin-customers.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/customers/page.tsx" tests/unit/pages/admin-customers.test.tsx
git commit -m "feat(admin): rebuild customers admin"
```

---

### Task 3.6: Admin analytics and settings

**Files:**
- Modify: `src/app/(admin)/admin/analytics/page.tsx`
- Modify: `src/app/(admin)/admin/settings/page.tsx`
- Modify: `src/components/admin/SettingsForm.tsx`, `TaxConfig.tsx`
- Test: `tests/unit/pages/admin-analytics-settings.test.tsx`

**Interfaces:**
- Consumes: settings actions (read-only), `recharts`

- [ ] **Step 1: Write the failing test**

Asserts the analytics page renders the chart containers and the settings page renders the settings form sections.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/admin-analytics-settings.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Keep the settings actions and field validation untouched. Restyle as calm-pro cards.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/admin-analytics-settings.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/analytics/page.tsx" "src/app/(admin)/admin/settings/page.tsx" src/components/admin tests/unit/pages/admin-analytics-settings.test.tsx
git commit -m "feat(admin): rebuild analytics and settings"
```

---

### Task 4.1: Global states

**Files:**
- Modify: `src/app/loading.tsx`, `src/app/not-found.tsx`, `src/app/global-error.tsx`
- Create: `src/app/error.tsx`
- Modify: `src/components/ui/{Skeleton,GlobalLoading,ErrorBoundary}.tsx`
- Test: `tests/unit/pages/global-states.test.tsx`

**Interfaces:**
- Produces: route-level loading skeletons matching real content dimensions, a 404, a 500, and a root error boundary.

- [ ] **Step 1: Write the failing test**

Asserts `not-found` renders a "not found" message and a home link, and that `error.tsx` renders the error UI with a retry control.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/pages/global-states.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Skeletons mirror the card/table dimensions exactly. 404 uses a `DoodleScatter` + a friendly line. `error.tsx` has a `reset()` button.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/unit/pages/global-states.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/loading.tsx src/app/not-found.tsx src/app/global-error.tsx src/app/error.tsx src/components/ui tests/unit/pages/global-states.test.tsx
git commit -m "feat(states): rebuild loading, error, and not-found"
```

---

### Task 4.2: Accessibility, motion, and responsive audit

**Files:**
- Create: `e2e/regression.spec.ts` (viewport sweep)
- Modify: `playwright.config.ts` only if needed
- Test: `tests/unit/a11y.test.tsx`

**Interfaces:**
- Consumes: every rebuilt page

- [ ] **Step 1: Write the failing test**

`tests/unit/a11y.test.tsx` renders each primitive and asserts it has an accessible name or label. `e2e/regression.spec.ts` visits every route at 375×768 and 1280×800 and asserts `document.documentElement.scrollWidth <= window.innerWidth + 1`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/a11y.test.tsx && pnpm e2e --grep regression`
Expected: FAIL on at least one route or primitive.

- [ ] **Step 3: Fix the failures**

Fix contrast, focus, and overflow issues until both pass. Do not weaken the assertions.

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm vitest run tests/unit/a11y.test.tsx && pnpm e2e --grep regression`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/a11y.test.tsx e2e/regression.spec.ts
git commit -m "test(a11y): add accessibility and responsive regression sweep"
```

---

### Task 5.1: Full verification and visual baseline

**Files:**
- Modify: `e2e/visual.spec.ts` (regenerate baselines)
- Modify: `docs/superpowers/specs/2026-11-06-bioscope-frontend-design.md` (mark implemented)

**Interfaces:**
- Consumes: everything

- [ ] **Step 1: Run the full gates**

Run: `pnpm verify`
Expected: type-check 0, lint 0, tests pass, build ok, detect-changes clean.

- [ ] **Step 2: Run the e2e suite**

Run: `pnpm e2e`
Expected: all specs pass.

- [ ] **Step 3: Regenerate the visual baseline**

Run: `pnpm e2e:visual:sharded:update`
Expected: baselines captured for mobile, tablet, desktop.

- [ ] **Step 4: Clean dead code**

Run: `pnpm dlx knip` and remove unused exports flagged in `src/components/**` and `src/lib/design-tokens.ts`.

- [ ] **Step 5: Verify again**

Run: `pnpm verify`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add e2e docs/superpowers/specs/2026-11-06-bioscope-frontend-design.md
git commit -m "chore: capture visual baseline and verify the rebuild"
```

---

## Execution Order

```
T0.0 gates → T0.1 tokens → T0.2 fonts/motion → T0.3 decor → T0.4 primitives → T0.5 brand → T0.6 icons → T0.7 interaction system
T1.1 shell → T1.2 navbar → T1.3 footer → T1.4 admin shell → T1.5 drawer/wrapper
T2.1 landing (owns ProductCard) → T2.2 shop → T2.3 product → T2.4 cart → T2.5 checkout
T2.6 builder → T2.7 orders → T2.8 profile → T2.9 auth → T2.10 about/contact
T2.11 policies → T2.12 company → T2.13 track-order
T3.1…T3.6 admin (parallel with T2 after T1.5)
T4.1 states → T4.2 audit → T5.1 verification
```

T0.1 must land before anything visual. T2.1 must land before T2.2 (it owns `ProductCard`). T1.1 must land before T1.2–T1.5. Everything else can run in parallel once its dependencies are met.

---

## Notes for Implementers

1. **Every task ends with a green `pnpm verify`.** No task is done while the build is broken.
2. **Never edit the frozen logic layer.** If a page needs data, add a read-only query or use the existing one.
3. **If a visual decision appears that the spec does not cover, stop and ask.** The spec §13 log is the authority.
4. **Copy is placeholder until the owner supplies real content.** Mark it `<!-- TODO: owner copy -->`; do not invent policy text, testimonials, or statistics.
5. **The one tension to hold:** loud brand surfaces, restrained cards and admin. When in doubt, restrain.
