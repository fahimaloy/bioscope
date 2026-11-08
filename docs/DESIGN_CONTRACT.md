# Bioscope Design Contract

**Authority:** `docs/superpowers/specs/2026-11-06-bioscope-frontend-design.md`
**Plan:** `docs/superpowers/plans/2026-11-06-bioscope-frontend-rebuild.md`
**Applies to:** every edit in the UI layer — `src/app/**`, `src/components/**`,
`src/app/globals.css`, `tailwind.config.ts`, `src/lib/{design-tokens,motion}.ts`.

This file is the executable contract. `AGENTS.md` is write-protected in this
environment, so the contract lives here and every task brief references it.

---

## 1. Token-only color

- **No hardcoded hex in any component.** Every color is a `var(--…)` reference
  or a Tailwind utility that maps to `var(--…)` in `tailwind.config.ts`.
- The single source of truth is the DTCG JSON in `tokens/src/*.json`, compiled
  by Style Dictionary into the marked `:root` region of
  `src/app/globals.css` and into `src/lib/design-tokens.ts`.
- `tailwind.config.ts` maps every color/radius/shadow/font token to
  `var(--…)`. Never add a raw Tailwind color.
- To change a color, change the token — never a component.

## 2. Contrast (WCAG AA, measured not eyeballed)

- Body text is `--ink` on `--paper` or `--paper-raised`.
- Text on a folk accent must use the AA-safe pairing below. Display type and
  decoration may use the vivid accent with `--ink`; **body text may not**.

| Accent | Text on it | Ratio |
|---|---|---|
| `--pink` `#E91E63` | `--ink` | 3.89 — display/decoration only |
| `--pink-strong` `#C2185B` | `#FFFFFF` | 5.87 |
| `--violet` `#9C27B0` | `#FFFFFF` | 6.31 |
| `--red` `#D32F2F` | `#FFFFFF` | 4.59 |
| `--green-strong` `#2E7D32` | `#FFFFFF` | 5.13 |
| `--teal` `#009688` | `--ink` | 4.60 |
| `--orange` `#FF9800` | `--ink` | 7.85 |
| `--gold` `#FBC02D` | `--ink` | 10.2 |
| `--blue` `#2196F3` | `--ink` | 5.41 |
| `--lime` `#8BC34A` | `--ink` | 8.06 |

- `--on-brand` maps to `#FFFFFF` and is used **only** against `--pink-strong`.
- Every `--on-<accent>` pair is asserted in `tests/unit/design-tokens.test.ts`.

## 3. Decor discipline

- **One decor accent per section, maximum** — one doodle, one washi tape, or
  one color block. Never all three.
- Doodles are `aria-hidden` and never carry meaning.
- `DoodleScatter` is capped at 6 elements per section.

## 4. Motion

- `transform`/`opacity` only. No layout-animating properties.
- Every animation has a `prefers-reduced-motion` fallback: loops stop, durations
  collapse, content is never invisible.
- **Nothing gates content visibility.** Motion enhances; it never withholds.
- **Every page must include at least one purposeful motion** — entrance,
  scroll reveal, hover spring, marquee, or a one-shot celebration.
- Spring presets: `stiffness 400–550, damping 20–30`; press uses
  `stiffness 700, damping 30`. Entrance scenes cap at 600ms. `whileInView`
  reveals fire once.
- Confetti is capped (60 particles) and fires only on add-to-cart and order
  success.
- No Lenis, no scroll-jacking, no marquee on body copy, no entrance animation
  on everything.

## 5. Brand surfaces (Paper + Pop)

- **Ink borders:** 3px solid `--ink` on cards, buttons, badges, and section
  frames. 2px on dense/data surfaces (tables, inputs, admin).
- **Offset shadows:** hard, never blurred — `--shadow-ink-2` (4px) on small
  elements, `--shadow-ink-3` (6px) on cards, `--shadow-ink-4` (10px) on hero
  and CTA bands. Hover grows the shadow one step and lifts 3–4px on a spring.
- **Color blocks:** section bands and CTAs use `--gold`, `--pink`, or
  `--violet` fills with ink borders. **No gradients, no glass.**
- **Sticker badges:** pills with an ink border and a 2–4° rotation, for "New",
  "Sale", "Free delivery", and status.
- **Type:** Shrikhand for display (headings, prices, CTAs), Outfit for body,
  Caveat for annotations only — never body copy or data.
- **Restraint:** product cards are the **Clean sheet** treatment (flat 2px ink
  border, colored offset shadow, no rotation, no die-cut outline). The admin
  panel is **calm pro** — near-white surfaces, hairline borders, one teal
  accent, dense type, no offset shadows except on the primary action.
- The tension to hold: loud brand surfaces, restrained cards and admin. When in
  doubt, restrain.

## 6. Responsive and accessible

- Mobile-first. **No horizontal scroll at 320px.**
- Hit targets ≥ 44px.
- Visible focus ring on every interactive element (`focus-visible`).
- Semantic landmarks; keyboard path through cart, checkout, and admin.
- Every interactive primitive forwards `ref` and merges `className` via `cn`.

## 7. Frozen logic layer — do not edit

Everything under `src/lib/actions/**`, `src/app/api/**` (except the one
`trackOrder` action + route the plan adds), and:

```
src/lib/{pricing,order-status,validations,queries,mutations,stores,hooks,
         prisma,auth,cloudinary,uploadthing,utils,api-utils}.ts
src/lib/server/socket-emit.ts
src/lib/socket.ts
prisma/**
socket-server/**
src/middleware.ts
src/auth.config.ts
tests/**  e2e/**   (beyond updating visual baselines)
```

- Money is always re-priced server-side with `src/lib/pricing.ts`. Never trust
  client prices.
- Order status changes only through `canTransition()`.
- Server actions call `requireUser()`/`requireAdmin()` themselves.
- The only permitted additions are (a) one read-only `trackOrder` server action
  plus its API route, (b) removal of the `theme` slice from `uiStore`.

## 8. Gates

- **`pnpm verify` must pass before any commit.** It runs `type-check`, `lint`,
  `test:run`, `build`, and GitNexus `detect-changes --scope all`, in order,
  stopping at the first failure.
- `pnpm build` may be skipped only when a task explicitly says so, via
  `VERIFY_SKIP_BUILD=1` — never for Phase 0/1.
- Run `pnpm tokens` after changing any file in `tokens/src/`.
- GitNexus `impact --direction upstream` before editing any symbol; never
  substitute grep for graph analysis.

## 9. Copy

- English only.
- Placeholder copy is marked `<!-- TODO: owner copy -->`. Do not invent policy
  text, testimonials, statistics, or marketing claims.
- No new marketing claims without the owner.

## 10. Visual decisions are settled

The spec's §13 decision log is the authority. If a task appears to require a new
visual decision, stop and ask — do not invent one.
