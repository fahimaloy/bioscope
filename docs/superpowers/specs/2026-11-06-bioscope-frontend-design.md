# Bioscope — Frontend Design Doc

**Date:** 2026-11-06
**Status:** Proposed — awaiting approval
**Supersedes:** `docs/bioscope-redesign-plan.md` (2026-11-02, "Doodlebook") and `docs/superpowers/plans/2026-11-06-complete-ui-redesign.md` (same-day, MAFTS palette). Those two disagree with each other and with the logo; this document replaces both.

---

## 1. Intent

Bioscope is a sticker shop for a young audience. Customers browse admin-added sticker products, buy them with size/finish/quantity configurations, or request a custom print; the admin approves, prints, and home-delivers.

The current frontend does not carry that brand. It is a leftover palette (coral/teal/yellow "MAFTS") with a half-applied doodle layer on top, broken tokens, two competing font systems, and markup that bypasses the design system it claims to use. The goal is not a reskin — it is a rebuild of the entire UI layer on a single tokenized design system that makes the logo feel inevitable: die-cut stickers, bold ink linework, saturated folk color, springy purposeful motion, and a premium finish that a young audience reads as "cool", not "kids' app".

**The why:** the storefront is the product. If the site looks broken and generic, the stickers look generic too. The redesign is a revenue surface, not decoration.

---

## 2. Goals, non-goals, anti-goals

### Goals
- One tokenized design system, authored in DTCG JSON, compiled to CSS variables, mapped into Tailwind. No hardcoded hex in components.
- Every page rebuilt against that system: consistent spacing rhythm, type scale, ink borders, offset shadows, die-cut surfaces.
- Motion with a clear job: sticker-peel, wiggle, hover lift, scroll reveals, one-shot celebration. Fast, springy, reduced-motion safe.
- Fully responsive, mobile-first, 44px+ hit targets.
- Accessible: WCAG AA contrast, visible focus, semantic landmarks, keyboard path through cart/checkout/admin.
- The logo's folk-craft identity carried through every surface — color, linework, texture, type.
- An agent-ready repo: rules, gates, and docs that make the next 1,000 edits consistent.

### Non-goals
- No backend, data-model, or business-logic changes. Pricing, order status, auth, and validation stay exactly as they are.
- No new commerce features (wishlist, reviews engine, CMS, loyalty). Redesign only — with one exception: the footer already promises 11 destinations that do not exist, and the owner has decided they get built (see §7.1).
- No new framework major version in this pass (see §4.3).
- No literal deletion of the working logic layer (see §4.1).

### Anti-goals
- A UI that looks like a generic template with a logo swapped in.
- Motion for its own sake, or motion that gates content visibility.
- Maximalism without hierarchy — "stickerbomb" as noise rather than as accents.
- A design system that exists in docs but not in the code.
- Breaking auth, checkout, pricing, or order transitions.

---

## 3. Constraints

- **Stack stays:** Next.js 14.2 (App Router) + React 18, Tailwind CSS v3, Prisma/PostgreSQL, next-auth v5 (JWT + credentials), socket.io standalone server, Cloudinary/Uploadthing. pnpm only.
- **Architecture rules in `AGENTS.md` still bind:** server actions call `requireUser()`/`requireAdmin()` themselves; routes wrap in `try/catch → handleRouteError`; money is re-priced server-side with `src/lib/pricing.ts`; order status changes only through `canTransition()`; theming comes from CSS variables.
- **Existing verification must keep passing:** `pnpm type-check`, `pnpm lint`, `pnpm test:run`, `pnpm build`, `pnpm e2e`.
- **Brand:** `bioscope`. All `MAFTS` and `Sticker Shop` leftovers are removed from source.
- **Logo:** `public/images/bioscope-logo.png` is an illustrative folk-art mark with Bengali lettering and **no Latin wordmark**. It is treated as final; the design system adds a Latin "bioscope" display lockup beside it (see §5.1).
- **Assets:** no product photography or illustration library is available beyond the logo and placeholder art; the design must not depend on assets that do not exist.

---

## 4. Approaches considered

### 4.1 Scope of teardown

| Option | What it means | Trade-off |
|---|---|---|
| **1. Rebuild the UI layer, keep the brain** ✅ picked | Preserve `src/lib/actions`, `src/app/api`, `src/lib/{pricing,order-status,validations,queries,mutations,stores,hooks,prisma,auth,socket}`, `prisma/`, `socket-server/`, `src/middleware.ts`, `src/auth.config.ts`. Rebuild from scratch: route pages, components, `globals.css`/Tailwind theme, icons, motion. | Coherent result without re-testing money math and auth. The UI layer is genuinely rewritten, not patched. |
| 2. Literal full rewrite | Delete the frontend and re-write actions, routes, and lib too, against the same database. | Maximum cleanliness on paper, maximum risk and time in practice. Tested pricing and order logic get re-written for no functional gain. |
| 3. Restyle in place | Keep the current file structure and component APIs; swap tokens and restyle. | Fastest, but the inconsistent structure and code quality the redesign is meant to fix stay baked in. |

**Picked: 1.** In scope (rebuilt): `src/app/**/page.tsx`; every other UI-rendering file under `src/app/**` — `(customer)/layout.tsx`, `(admin)/layout.tsx`, `loading.tsx`, `not-found.tsx`, `global-error.tsx`, and any `template.tsx`/`error.tsx`; all of `src/components/**`; `src/app/globals.css`; `tailwind.config.ts`; and `src/lib/{design-tokens,motion}.ts`. Out of scope (logic, stays): everything listed in §8.

Two consequences the builder must honor:

- **The Footer is mounted twice today** — root `layout.tsx:79` and `(customer)/layout.tsx:16`. The rebuilt shell mounts it exactly once, in the root layout.
- **`motionVariants` must survive.** `src/lib/motion.ts` is replaced, but twelve files import `motionVariants` (including `(admin)/layout.tsx`). The new motion module keeps a `motionVariants` export with the same keys (`staggerContainer`, `staggerItem`, `pulseSoft`, `slideInRight`, `slideInLeft`, `fadeInUp`, …), reimplemented on the new motion tokens. Consumers migrate only where the rebuild touches them anyway.

### 4.2 Visual direction

Grounded in the logo: thick black ink contours, a white die-cut border, flat saturated fills (pink `#E91E63`, violet `#9C27B0`, orange `#FF9800`, lime `#8BC34A`, teal `#009688`, blue `#2196F3`) over camera red `#D32F2F`, leaf green `#388E3C`, and gold `#FBC02D`.

| Option | Description | Trade-off |
|---|---|---|
| **A. Paper and Ink, carrying the folk palette** ✅ picked | Warm paper background, ink borders with hard offset shadows, die-cut white card outlines, washi tape, torn edges, paper grain — with the logo's saturated folk accents instead of a muted craft palette. | Premium-stationery calm on the surface, maximalist sticker color in the details. Product art stays legible. Makes the logo feel inevitable. |
| B. Midnight Stickerbomb | Near-black ink background, neon coral/teal/yellow/pink, glow shadows, sticker-bomb collage. | Most "young + premium modern", and a natural dark mode — but fights the craft logo and makes product photography harder to read. |
| C. Retro 90s Stickerbomb | Cream base, chunky stickers, halftone dots, misregistration, orange/blue/yellow/magenta. | Closest to the logo's energy, but the hardest to keep premium across 20 pages; tips into chaos fast. |

**Picked (owner, via the visual board): B · Paper + Pop for the shop.** Thick ink borders, hard offset shadows, bold pink/violet/gold color blocks, sticker badges. The restrained brief is carried by the product cards (Clean sheet), the admin panel (calm pro), and the one-accent-per-section decor rule — so the brand is loud without becoming noise. The landing hero is the **Editorial** composition. **C · Midnight** is dropped, and dark mode is removed entirely (see §5.2).

### 4.3 Stack and tooling

| Option | Trade-off |
|---|---|
| **Stay on Next 14.2 + React 18 + Tailwind v3; add DTCG JSON tokens compiled to CSS variables; shadcn copy-in primitives on Radix; Motion + CSS + optional GSAP.** ✅ picked | Honors the repo's own conventions and `AGENTS.md`. The token system is the real fix; the Tailwind version is not the problem. Lowest risk, fastest to a coherent result. |
| Upgrade Next 16 + React 19 + Tailwind v4 first, then redesign | "Best practice" on paper, but async `params`/`searchParams`, `middleware.ts` → `proxy.ts`, and a Tailwind config migration would land in the same diff as a full UI rebuild. Regressions become unreadable, and next-auth v5 beta, socket.io, fabric, and uploadthing all need re-verification. |
| Keep everything, hand-write `:root` tokens | No build step, but the token set rots immediately — which is exactly the state the repo is in now. |

**Picked: the first.** A framework upgrade is a legitimate follow-up project, run separately with its own verification.

### 4.4 Typography

| Option | Trade-off |
|---|---|
| **Shrikhand (display) + Outfit (body) + Caveat (hand)** ✅ picked | Shrikhand's rounded retro weight echoes the logo's bubble lettering; Outfit keeps UI and product copy legible; Caveat supplies the handmade annotation layer. All SIL OFL, self-hosted via `next/font`. |
| Bagel Fred (display) + Outfit + Caveat | Chunkier and more literally "sticker", but less premium and narrower in Latin coverage. |
| Gluten (display) + Space Grotesk + Caveat | Marker energy, better on dark; weaker match to the logo's roundness. |

**Picked: Shrikhand + Outfit + Caveat.** The `Bangers`/`Outfit` `@import` in `globals.css` and the `Shantell_Sans`/`Caveat`/`Nunito` load in `layout.tsx` are both removed; `next/font/google` becomes the single source.

### 4.5 UI primitives

| Option | Trade-off |
|---|---|
| **shadcn/ui pattern: copy-in source on Radix, restyle everything** ✅ picked | No default look to fight; the repo already ships the Radix primitives. Full control over the doodle aesthetic. |
| Styled kit (Mantine / Chakra) | Fast to build, low override ceiling, and its own design language leaks through. Wrong for a brand-led shop. |
| Bare Radix with hand-written styles | Same control, more code to maintain. shadcn is the same thing with the boilerplate already written. |

### 4.6 Motion

| Option | Trade-off |
|---|---|
| **Motion (already installed) for component animation + CSS for micro-interactions + GSAP only if a scroll/SVG stroke-draw scene earns it** ✅ picked | Covers springs, gestures, `whileInView`, layout animation. CSS handles hovers and presses. GSAP is added only if the design needs it — not by default. |
| GSAP everywhere | Powerful, but imperative lifecycle code in every component and a second mental model. Overkill for a shop. |
| CSS only | Cannot express springs, stagger children, or shared-element transitions cleanly. |

**Also decided:** no Lenis in the first pass (scroll-jacking risk on mobile); no marquee on body copy; confetti only on add-to-cart and order success, capped particles; every animation has a `prefers-reduced-motion` fallback.

---

## 5. The design system

### 5.1 Brand marks and lockup

- **Primary mark:** `public/images/bioscope-logo.png`, used at small sizes (navbar, footer, favicon reference) inside a white die-cut treatment.
- **Lockup:** logo mark + a Latin wordmark set in Shrikhand, `bioscope`, with the "o" characters allowed to carry the folk accent colors as a nod to the mark. Used in the navbar and as the default OG image. **(Owner-confirmed via the visual board: Shrikhand.)**
- **No Latin wordmark exists in the mark today** — the lockup is a design-system deliverable, not an asset copy exercise.
- **Bengali lettering:** the mark carries Bengali script. It is treated as a finished brand asset; no attempt is made to redraw or replace it. If the brand later needs bilingual UI copy, `Hind Siliguri` is the candidate webfont, but that is out of scope here.

### 5.2 Color tokens

Authored as DTCG JSON in `tokens/`, compiled by Style Dictionary into CSS variables in `globals.css`, mapped into Tailwind. Two layers: primitives (the scales) and semantics (the aliases components actually use).

**Neutrals — warm paper craft**

| Token | Value | Role |
|---|---|---|
| `--paper` | `#FAF3E3` | App background |
| `--paper-deep` | `#F3E7CE` | Alt surface, sticky notes, table header |
| `--paper-raised` | `#FFFDF7` | Cards, sheets |
| `--ink` | `#241B12` | Text, borders, offset shadows |
| `--ink-soft` | `#4A3B2C` | Secondary text |
| `--ink-muted` | `#7A6A57` | Tertiary text, captions |
| `--die-cut` | `#FFFFFF` | Sticker white outline |

**Folk accents — from the logo**

| Token | Value | Use |
|---|---|---|
| `--pink` | `#E91E63` | Primary brand / primary action |
| `--violet` | `#9C27B0` | Accent, badges |
| `--orange` | `#FF9800` | Accent, warnings |
| `--lime` | `#8BC34A` | Accent, success-adjacent |
| `--teal` | `#009688` | Accent, links, secondary action |
| `--blue` | `#2196F3` | Info |
| `--gold` | `#FBC02D` | Highlights, washi tape, starbursts |
| `--red` | `#D32F2F` | Error / destructive |
| `--green` | `#388E3C` | Success |

**Semantic aliases (what components consume)**

```
--brand          → --pink
--on-brand       → #FFFFFF (used ONLY against --pink-strong, never on --pink)
--accent         → --gold
--info           → --blue
--success        → --green
--warning        → --orange
--error          → --red
--surface        → --paper
--surface-raised → --paper-raised
--surface-sunken → --paper-deep
--text           → --ink
--text-muted     → --ink-soft
--text-subtle    → --ink-muted
--text-inverse   → --paper-raised
--border         → --ink
--border-strong  → --ink
--ring           → --gold
--overlay        → color-mix(--ink, 55% transparent)
```

**Every accent gets an explicit "on" color, and the pairing is measured, not assumed.** White on `--pink` (#E91E63) is 4.35:1 — below AA. Ink on `--violet` is 2.68:1, ink on `--red` is 3.69:1, ink on `--green` is 4.11:1 — all below AA. So the token layer defines an `--on-<accent>` pairing for every accent that carries text:

| Accent | Text on it | Ratio | Use |
|---|---|---|---|
| `--pink` `#E91E63` | `--ink` | 3.89 | display and decoration only — never body text |
| `--pink-strong` `#C2185B` | `#FFFFFF` | 5.87 | primary buttons, badges |
| `--violet` `#9C27B0` | `#FFFFFF` | 6.31 | badges, accent surfaces |
| `--red` `#D32F2F` | `#FFFFFF` | 4.59 | destructive actions, errors |
| `--green-strong` `#2E7D32` | `#FFFFFF` | 5.13 | success |
| `--teal` `#009688` | `--ink` | 4.60 | links, secondary buttons |
| `--orange` `#FF9800` | `--ink` | 7.85 | warnings, highlights |
| `--gold` `#FBC02D` | `--ink` | 10.2 | washi, starbursts, primary CTA fill |
| `--blue` `#2196F3` | `--ink` | 5.41 | info |
| `--lime` `#8BC34A` | `--ink` | 8.06 | accents |

- `--on-brand` maps to `#FFFFFF` and is used **only** against `--pink-strong`.
- `--green` gets a `-strong` alias (`#2E7D32`) for text-bearing surfaces, exactly as pink does.
- These exact pairs are asserted in `tests/unit/design-tokens.test.ts`.

The vivid accents stay vivid for display type, decoration, borders, and illustration; text-bearing surfaces use the AA-safe pairing. This is a builder call, flagged for the owner.

**Elevation and ink**

| Token | Value |
|---|---|
| `--shadow-ink-1` | `2px 2px 0 var(--ink)` |
| `--shadow-ink-2` | `4px 4px 0 var(--ink)` |
| `--shadow-ink-3` | `6px 6px 0 var(--ink)` |
| `--shadow-ink-4` | `10px 10px 0 var(--ink)` |
| `--shadow-color` | `8px 8px 0 var(--accent)` |
| `--shadow-die-cut` | `0 0 0 3px var(--die-cut), var(--shadow-ink-2)` |

**Dark mode is deliberately removed in this rebuild (owner decision).** It exists in the code today but is broken — `ThemeProvider` writes a `.dark` class that no CSS selector reads, and the OS media-query path is unstyled. The brand direction is a light paper-craft system, and shipping a half-designed dark theme would double the visual QA surface for no benefit. The token architecture stays dark-capable (semantic aliases everywhere, never raw values), so a dark theme can be added later without another rebuild. `ThemeProvider` and the `theme` slice of `uiStore` are removed.

**Contrast rule:** body text is `--ink` on `--paper` or `--paper-raised`; inverse text on a folk accent must pass AA or fall back to `--ink` on that accent. Contrast is checked per token pair at build time, not eyeballed.

### 5.3 Type scale

- **Display (Shrikhand 400):** wordmark, page titles, hero, prices, stat numbers. Never faux-bolded. Two sizes maximum per page.
- **Body (Outfit 400/500/600/700):** UI, product copy, descriptions, tables.
- **Hand (Caveat 400/600/700):** annotations, washi-tape labels, empty-state asides, "handwritten" notes. Never for body copy or data.

| Token | Size / leading |
|---|---|
| `--text-xs` | 12 / 1.5 |
| `--text-sm` | 14 / 1.5 |
| `--text-base` | 16 / 1.6 |
| `--text-lg` | 18 / 1.6 |
| `--text-xl` | 20 / 1.4 |
| `--text-2xl` | 24 / 1.3 |
| `--text-3xl` | 30 / 1.2 |
| `--text-4xl` | 36 / 1.15 |
| `--text-5xl` | 48 / 1.1 |
| `--text-6xl` | 64 / 1.05 |

### 5.4 Shape, elevation, texture

| Token | Value |
|---|---|
| `--radius-sm` | `6px` |
| `--radius-md` | `10px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `24px` |
| `--radius-pill` | `999px` |
| `--radius-wobble-sm` | `255px 15px 225px 15px / 15px 225px 15px 255px` |
| `--radius-wobble-md` | `18px 6px 20px 8px / 8px 20px 6px 18px` |
| `--radius-wobble-lg` | `30px 10px 34px 12px / 12px 34px 10px 30px` |
| `--border-ink` | `2px solid var(--ink)` |
| `--border-strong` | `3px solid var(--ink)` |

Texture and surface treatments:
- **Paper grain:** inline SVG `feTurbulence` overlay at ~3% opacity, fixed, pointer-events none.
- **Grid paper:** crosshatch gradient for the custom-sticker builder only.
- **Torn edge:** clip-path zigzag on section transitions.
- **Washi tape:** rotated strip with ink border and offset shadow.
- **Die-cut card:** white 3px outline outside the ink border, then the offset ink shadow.

### 5.5 Motion tokens

| Token | Value |
|---|---|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-micro` | `150ms` |
| `--dur-fast` | `200ms` |
| `--dur-base` | `300ms` |
| `--dur-slow` | `500ms` |
| `--dur-scene` | `800ms` |

Spring presets for Motion: `stiffness 400–550, damping 20–30`; press uses `stiffness 700, damping 30`. Entrance scenes cap at 600ms. `whileInView` reveals fire once. All motion is `transform`/`opacity` only. `@media (prefers-reduced-motion: reduce)` disables loops and collapses durations.

### 5.6 Icon system

- **Lucide** (already installed) for UI chrome: cart, search, chevrons, close, plus/minus, admin glyphs, status icons.
- **Custom SVG sprite** for brand and doodle art: stars, hearts, arrows, squiggles, lightning, sparkle, sticker outlines. Built once, referenced by symbol, `currentColor`, animatable.
- **Phosphor Duotone** is an optional accent layer for empty states and hero illustration, added only if the design needs it.
- Stroke weights stay consistent within a surface — no mixing 1.5px and 2.5px "doodle" clip-art.

### 5.7 Doodle / decor layer

Rebuilt as a small, explicit set (replacing the current `FloatingShapes`/`FloatingEmojis`/`DoodleScatter` grab-bag):

`WashiTape`, `StickerPeel`, `TornEdge`, `SketchUnderline`, `DoodleStar`, `DoodleHeart`, `DoodleArrow`, `DoodleSquiggle`, `DoodleSparkle`, `DoodleScatter` (composed, capped at 6 elements per section), `MarqueeRibbon`, `GrainOverlay`, `GridPaper`, `StickerSlam` (add-to-cart feedback), `ConfettiBurst`.

Rule: **one decor accent per section, max.** Doodles are `aria-hidden` and never carry meaning.

---

### 5.8 Brand surface rules (Paper + Pop)

The shop's brand surfaces are loud; the product cards, the admin panel, and the decor discipline are restrained. Concretely:

- **Ink borders:** 3px solid `--ink` on cards, buttons, badges, and section frames. 2px on dense/data surfaces (tables, inputs, admin).
- **Offset shadows:** hard, never blurred — `--shadow-ink-2` (4px) on small elements, `--shadow-ink-3` (6px) on cards, `--shadow-ink-4` (10px) on hero and CTA bands. Hover grows the shadow one step and lifts 3–4px on a spring.
- **Color blocks:** section bands and CTAs use `--gold`, `--pink`, or `--violet` fills with ink borders. No gradients, no glass.
- **Sticker badges:** pills with an ink border and a 2–4° rotation, for "New", "Sale", "Free delivery", and status.
- **Type:** Shrikhand for display (headings, prices, CTAs), Outfit for body, Caveat for annotations only.
- **One accent per section:** one doodle, one washi tape, or one color block — never all three.

**Restrained decor, rich motion.** The "restrained" decision applies to static decoration only. Motion is a first-class requirement from the original brief: every page carries at least one purposeful motion (entrance, scroll reveal, hover spring, marquee, or a one-shot celebration), and brand surfaces feel alive. Motion never gates content visibility and always has a reduced-motion fallback.

---

## 6. Component inventory (rebuilt against the system)

- **Primitives (`src/components/ui/`):** Button, Card, Badge, Input, Select, Checkbox, Modal, Dropdown, Tabs, Tooltip, Slider, Skeleton, Pagination, DataTable, Accordion, ColorPicker, ImageUpload, ErrorBoundary, GlobalLoading.
- **Layout:** Navbar, Footer, MobileNav, AdminSidebar, NotificationBell, CartDrawer, PageWrapper.
- **Product:** ProductCard, ProductDetail, ProductConfigurator, DimensionSelector, QuantitySelector, ReviewForm, ReviewList.
- **Cart / checkout:** CartItem, CartSummary, PromoCode, AddressForm, CheckoutProgressStepper, OrderConfirmation, OrderSummary, PaymentMethod.
- **Custom sticker builder:** StickerCanvas, UploadZone, EditingTools, DimensionControls, ColorAdjustments, PreviewPanel, LayerPanel, ExportPreview.
- **Admin:** ProductForm, ProductPreview, ProductsPage, OrderStatusBadge, OrderTimeline, StatsCards, TaxConfig, DeliveryConfig, SettingsForm, NotificationList.
- **Decor / motion / providers:** everything under `src/components/{decorative,animations,providers}/`. `ThemeProvider` is removed (see §5.2); the remaining providers (auth, query, socket, UI store) are restyled and narrowed.

Each primitive keeps its current public prop names where callers depend on them; internals are rewritten. Variants are redefined in terms of tokens.

---

## 7. Page inventory

**Customer:** `/` (landing), `/shop`, `/shop/[slug]`, `/cart`, `/checkout`, `/custom-sticker`, `/orders`, `/orders/[id]`, `/profile`, `/login`, `/register`, `/about`, `/contact`.

**Admin:** `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/custom-requests`, `/admin/customers`, `/admin/analytics`, `/admin/settings`.

Every page is a Server Component shell with `'use client'` islands only where interactivity requires it. Metadata is declared per route.

### 7.1 New content pages (owner decision)

The footer already promises 11 destinations; 10 of them do not exist. All are built as real, designed pages in Phase 2.

| Route | Nature | Notes |
|---|---|---|
| `/faq` | Static content | Accordion, searchable |
| `/shipping` | Static content | Zones, rates, delivery times |
| `/returns` | Static content | Policy and steps |
| `/track-order` | **Functional** | Public lookup by order number + email. The only new backend code in the rebuild: one read-only server action over existing order queries. No new data model. |
| `/privacy` | Static content | |
| `/terms` | Static content | |
| `/blog` | Static content | Editorial index + article template, authored in the page. No CMS. |
| `/careers` | Static content | Open roles |
| `/press` | Static content | Press kit and brand assets |
| `/affiliates` | Static content | Program information |
| `/accessibility` | Static content | Accessibility statement |

`/contact` already exists and is redesigned in place.

**Flag for approval:** `/blog` and `/affiliates` are static content pages, not a CMS or a program with accounts. If the owner wants a real CMS or an affiliate dashboard, that is a separate project. `/track-order` needs the one read-only server action noted above.

---

## 8. What stays untouched

`src/lib/actions/**`, `src/app/api/**`, `src/lib/{pricing,order-status,validations,queries,mutations,stores,hooks,prisma,auth,cloudinary,uploadthing,utils,api-utils}.ts`, `src/lib/server/socket-emit.ts`, `src/lib/socket.ts`, `prisma/**`, `socket-server/**`, `src/middleware.ts`, `src/auth.config.ts`, `tests/**`, `e2e/**` (beyond updating visual baselines).

`src/lib/design-tokens.ts` and `src/lib/motion.ts` are replaced by the new token/motion system. The `theme` slice is removed from `src/lib/stores/uiStore.ts` along with `ThemeProvider`. Copy-only changes to validations are allowed if a message is user-facing.

---

## 9. Agent-driven pre-setups

- **`docs/DESIGN_CONTRACT.md`** holds the design system contract (`AGENTS.md` is write-protected in this environment, so the contract lives here and every task brief references it): token-only color usage, the motion rules, the decor rule (one accent per section), the do-not-touch logic list, and the gate commands.
- **`.cursor/rules/*.mdc`** for scoped conventions (optional, only if the team uses Cursor).
- **`pnpm verify`** runs `type-check`, `lint`, `test:run`, `build`, and GitNexus `detect-changes --scope all`; a pre-commit hook runs the same on staged files.
- **MCP:** keep GitNexus (impact before edit, detect-changes before commit); add Context7 so agents read current package docs instead of guessing Tailwind/Motion APIs; Playwright MCP for visual verification.
- **Skills:** a repo skill for "run the gates" and "token-first styling" so the conventions are executable, not just documented.
- **Docs:** this design doc, a generated token reference, and per-component API notes replace `docs/design-system.md` / `DESIGN_TOKENS.md` / `docs/bioscope-redesign-plan.md`.

---

## 10. Phasing

- **Phase 0 — Foundation:** DTCG tokens → CSS variables → Tailwind map; fonts via `next/font`; motion tokens; decor set; primitives rebuilt. No page changes yet.
- **Phase 1 — Layout shell:** Navbar (with lockup), Footer, MobileNav, AdminSidebar, CartDrawer, PageWrapper.
- **Phase 2 — Customer pages:** landing, shop, product, cart, checkout, custom builder, orders, profile, auth, about, contact.
- **Phase 3 — Admin pages:** sidebar, dashboard, products, orders, custom requests, customers, analytics, settings.
- **Phase 4 — Polish:** loading/error/empty states, accessibility audit, motion audit, responsive sweep.
- **Phase 5 — Verification:** full gates, visual baseline capture, dead-code cleanup.

Each phase ends with the gates green. Phases 2 and 3 can run in parallel once Phase 1 lands.

---

## 11. What's left to the builder

- Per-page copy and microcopy (the current copy is placeholder-ish in places; no new marketing claims without the owner).
- Exact spacing rhythm per section, within the token scale.
- Which doodle SVGs to draw and exactly where (within the one-accent-per-section rule).
- Skeleton shapes for each async surface.
- Admin table density and column ordering.
- Form field ordering and validation message wording.
- Whether to keep or drop individual legacy primitives that no page uses.

---

## 12. Builder-check questions

An independent builder reviewed this document against the repo and raised five questions. Resolutions:

1. **Which non-`page.tsx` files under `src/app` are in scope?** — Settled (builder call): all UI-rendering app files are in scope, including `(customer)/layout.tsx`, `(admin)/layout.tsx`, `loading.tsx`, `not-found.tsx`, `global-error.tsx`. See §4.1.
2. **`--brand-ink: #FFFFFF` vs. the AA contrast rule** — Settled (builder call): the contrast rule wins. `--brand-ink` is removed; text on folk accents is `--ink`, and AA-safe `-strong` accent aliases are added. See §5.2.
3. **The Footer links to 11 routes that do not exist** — Owner decision: build all of them as real pages. See §7.1. `/track-order` needs one read-only server action; `/blog` and `/affiliates` are static content, not a CMS or a program.
4. **Dark mode exists but is broken.** — Owner decision: ship light-only, remove the broken dark machinery deliberately, keep the token architecture dark-capable. See §5.2.
5. **`--die-cut` defined twice (color and shadow)** — Settled (builder call): the shadow token is renamed `--shadow-die-cut`. See §5.4.

---

## 13. Owner decisions log

From the clarifying-question batch (2026-11-06):

| Question | Decision |
|---|---|
| Premium reference | Craft-premium stationery **combined with** DTC sticker/streetwear boldness |
| Product imagery | One default image per product (`skull_sticker.png`); admins CRUD products and upload their own art |
| Doodle intensity | **Restrained** — paper craft, a few precise accents, premium first |
| Admin feel | **Calm pro tool with doodle accents** — dense, fast, restrained decoration |
| Language | **English only** |
| Shop grid | **Uniform 1:1 grid** |
| Landing leads with | **Featured products + custom sticker CTA** |
| Cart | **Drawer + full cart page** |
| Logo lockup | **Mark is final; design a Latin "bioscope" wordmark** |

From the visual board (2026-11-06):

| Decision | Pick |
|---|---|
| Overall look | **B · Paper + Pop** |
| Wordmark | **Shrikhand** |
| Product card | **Clean sheet** |
| Landing hero | **Editorial** |
| Admin | **Calm pro, minimal brand** |

**The tension to hold:** the shop's brand surfaces are loud (Paper + Pop), while the product cards, the admin panel, and the decor discipline stay restrained. The card is what repeats at scale, so restraint there is what keeps a loud brand from becoming noise. Every later decision should be checked against that split.

---

## 14. Research basis

The stack decisions in §4.3–§4.6 came from a research pass on current best practice (2026-11-06). Summary of what was found and what it ruled out:

- **Next.js / agentic development:** App Router best practice is Server Components by default, `'use client'` islands only, Server Actions for mutations, route handlers only for client fetches, per-route metadata, `next/font`, and `loading.tsx` / `error.tsx` / `not-found.tsx` for streaming and failure states. Agent pre-setups that matter: one canonical rules file (AGENTS.md) plus thin adapters, skills for recurring flows, code-graph impact analysis before edits, current-package-docs MCP so agents stop guessing APIs, and a hard gate before every commit. A framework major upgrade was considered and rejected (§4.3).
- **Tokens:** DTCG JSON as the authoring format, compiled to CSS variables for the browser, mapped into Tailwind. Style Dictionary is the compiler; the CSS variables remain the runtime source of truth.
- **UI primitives:** shadcn/ui copy-in source on Radix, because a fully custom illustrated aesthetic needs components with no default look to fight. Styled kits (Mantine, Chakra) have a low override ceiling; bare Radix means maintaining the boilerplate yourself.
- **Animation:** Motion for component animation, CSS for micro-interactions, GSAP only where scroll or SVG scenes earn it. Lenis was rejected (scroll-jacking risk on mobile). One-shot confetti only on add-to-cart and order success.
- **Icons:** Lucide for UI chrome, hand-authored SVG for brand and doodle marks. Phosphor Duotone was considered as an optional accent layer and dropped.
- **Interactive effects that read as slop and are excluded:** animated gradient meshes, glassmorphism without real elevation, scroll-jacking, marquee on body copy, confetti on every click, entrance animation on everything, and any motion without a reduced-motion fallback.
- **Effects that are in:** sticker-peel hover, 2–4° wiggle, spring hover lift, once-only scroll reveals, a slow marquee ribbon, subtle hero parallax on pointer-fine desktop only, and a sticker-slam on add-to-cart.

The decisions are what this document encodes; the briefs themselves are in the session record.
