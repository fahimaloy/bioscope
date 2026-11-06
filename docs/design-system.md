# Bioscope Design System

> Living documentation for the bioscope sticker-shop UI. Source of truth is
> `src/app/globals.css` (tokens) + `tailwind.config.ts` (Tailwind mapping).
> Never hardcode hex values in components — always reference a token.

- **Display font:** `Bangers` (`font-display`, `--font-display`)
- **Body font:** `Outfit` 300/400/600/800 (`font-body`, `--font-body`)
- **Style:** doodle / cartoonish, offset "sticker" shadows, 3px ink borders

---

## Colors

All colors are CSS variables in `:root` (`src/app/globals.css`), mapped to
Tailwind utilities via `tailwind.config.ts`.

### Brand

| Token | Tailwind | Value |
| --- | --- | --- |
| `--primary` | `primary` / `bg-primary`* | `#FF6B6B` |
| `--secondary` | `secondary` | `#4ECDC4` |
| `--accent` | `accent` | `#FFE66D` |
| `--ink` | `ink` | `#000000` |
| `--light` | `light` | `#ECF0F1` |
| `--bg-color` | `bg` | `#FAFAFA` |

> \* Careful: Tailwind `bg-primary` is *not* brand primary — it maps to
> `--bg-primary` (semantic background). Use `primary` for the brand color.

### Status

| Token | Value | Use |
| --- | --- | --- |
| `--success` | `#2ECC71` | success badges, match indicators |
| `--warning` | `#F39C12` | warning badges, pending states |
| `--error` | `#E74C3C` | errors, destructive actions |
| `--info` | `#3498DB` | informational |
| `--purple` | `#9B59B6` | accents |

### Semantic tokens

```css
/* Backgrounds */
--bg-primary --bg-secondary --bg-tertiary --bg-inverse
--bg-brand --bg-brand-hover --bg-brand-subtle

/* Text */
--text-primary --text-secondary --text-tertiary
--text-inverse --text-link --text-link-hover --text-on-brand

/* Borders */
--border-primary --border-secondary --border-focus
--border-error --border-success --border-warning

/* Surfaces */
--surface --surface-hover --surface-active
--surface-elevated --surface-card

/* Overlay */
--overlay --overlay-backdrop
```

Prefer semantic tokens for text/borders/surfaces so dark-mode and
high-contrast overrides work automatically.

### Theme overrides

`globals.css` ships two automatic overrides:

- `@media (prefers-color-scheme: dark)` — remaps `--bg-*`, `--text-*`,
  `--surface-*`, `--border-*` to dark values. (`darkMode: 'class'` is also
  configured for manual `.dark` scoping.)
- `@media (prefers-contrast: high)` — remaps brand + status colors to
  higher-contrast variants (`#CC0000`, `#008080`, …).

---

## Typography

### Families

```css
--font-display: 'Bangers', cursive;   /* headings, buttons, big numbers */
--font-body:    'Outfit', sans-serif; /* everything else */
```

`h1–h3`, `.logo`, `.footer-logo` default to the display font with
`letter-spacing: 2px`.

### Scale (CSS vars)

| Token | Size | | Token | Size |
| --- | --- | --- | --- | --- |
| `--font-size-xs` | 12px | | `--font-size-5xl` | 48px |
| `--font-size-sm` | 14px | | `--font-size-6xl` | 56px |
| `--font-size-base` | 16px | | `--font-size-7xl` | 72px |
| `--font-size-lg` | 18px | | `--font-size-8xl` | 96px |
| `--font-size-xl` | 20px | | `--font-size-9xl` | 128px |
| `--font-size-2xl` | 24px | | | |
| `--font-size-3xl` | 30px | | | |
| `--font-size-4xl` | 36px | | | |

### Named sizes (Tailwind)

`display-xl` (8rem) · `display-lg` (6rem) · `display-md` (4.5rem) ·
`display-sm` (3.5rem) · `heading-xl` (3rem) · `heading-lg` (2.25rem) ·
`heading-md` (1.875rem) · `heading-sm` (1.5rem)

### Line heights

`--line-height-tight` 1.1 · `--line-height-snug` 1.375 ·
`--line-height-normal` 1.6 · `--line-height-relaxed` 1.75

---

## Spacing

Tailwind default scale plus project extras:

| Token | Value |
| --- | --- |
| `spacing.18` | 4.5rem |
| `spacing.88` | 22rem |
| `spacing.128` | 32rem |

Section helpers in `globals.css`:

- `.container-custom` — `max-width: 1200px`, `0 5%` padding
- `.section-padding` — `6rem 5%`

---

## Shadows (offset / sticker style)

No blur-only shadows on interactive elements — offsets give the sticker look.

| Token | Tailwind | Value |
| --- | --- | --- |
| `--shadow-xs` | `shadow-xs` | `2px 2px 0 var(--dark)` |
| `--shadow-sm` | `shadow-sm` | `4px 4px 0 var(--dark)` |
| `--shadow-md` | `shadow-md` | `6px 6px 0 var(--secondary)` |
| `--shadow-lg` | `shadow-lg` | `8px 8px 0 var(--secondary)` |
| `--shadow-xl` | `shadow-xl` | `12px 12px 0 var(--primary)` |
| `--shadow-inner` | `shadow-inner` | `inset 2px 2px 0 var(--dark)` |
| `--shadow-input` | `shadow-input` | `4px 4px 0 var(--primary)` |
| `--shadow-glass` | `shadow-glass` | `0 4px 30px rgba(0,0,0,.05)` |

Component shadows:

| Token | Tailwind | Use |
| --- | --- | --- |
| `--shadow-btn` | `shadow-btn` | buttons at rest |
| `--shadow-btn-hover` | `shadow-btn-hover` | button hover |
| `--shadow-btn-active` | `shadow-btn-active` | button pressed |
| `--shadow-card` | `shadow-card` | cards |
| `--shadow-card-hover` | `shadow-card-hover` | card hover |
| `--shadow-stat` | `shadow-stat` | stat cards |
| `--shadow-form` | `shadow-form` | form containers |

---

## Border Radius

| Token | Tailwind | Value | Use |
| --- | --- | --- | --- |
| `--radius-sm` | `rounded-sm` | 6px | small chips |
| `--radius-md` | `rounded-md` | 10px | inputs (`rounded-input`) |
| `--radius-lg` | `rounded-lg` | 16px | |
| `--radius-xl` | `rounded-xl` / `rounded-card` | 20px | cards |
| `--radius-pill` | `rounded-pill` | 50px | buttons, badges |
| `--radius-full` | `rounded-full` | 9999px | pills, dots |

Convention: **pill** for buttons/badges, **card** (20px) for cards,
**input** (10px) for form fields.

---

## Motion

### Easing / duration tokens

```css
--transition-fast:   150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
--transition-base:   300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
--transition-slow:   500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
--transition-colors: 200ms ease;
```

Tailwind: `ease-bounce`, `duration-fast|base|slow`. Tailwind motion uses
`duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]` for reveals;
`transition-colors` for hover. No `transition-all`.

### Utility classes

| Class | Animation |
| --- | --- |
| `.animate-fade-in` | fade in 0.3s |
| `.animate-fade-in-up` / `-down` | fade + translate |
| `.animate-scale-in` / `-out` | scale |
| `.animate-slide-in-right` / `-left` | slide |
| `.animate-wobble` | doodle wobble |
| `.animate-float-gentle` | gentle float loop |
| `.animate-pulse-soft` | soft pulse loop |
| `.animate-rotate-slow` | slow spin (20s) |
| `.animate-shake` | error shake |
| `.animate-bounceIn` | icon bounce in |
| `.stagger-1`…`.stagger-5` | children delay 0–400ms |

### Framer Motion presets

`src/lib/motion.ts` exports `motionVariants`:

- Entrance: `fadeIn`, `fadeInUp`, `fadeInDown`, `scaleIn`,
  `slideInRight`, `slideInLeft`, `pageEnter`
- Doodle: `wobble`, `float`, `pulseSoft`, `bounceIn`
- Interactive: `hoverLift`, `hoverScale`, `tapPress`, `focusRing`
- Stagger: `staggerContainer`, `staggerItem`

Rules:
- Animate `transform`/`opacity` only — never layout properties.
- **Max 1 entrance animation per view.**
- **No stagger on lists > 20 items** (table rows, large grids).
- All motion is disabled by the global `prefers-reduced-motion` guard in
  `globals.css`, which forces `animation: none` and near-zero durations.

---

## Z-Index Scale

| Token | Tailwind | Value |
| --- | --- | --- |
| `--z-dropdown` | `z-dropdown` | 100 |
| `--z-sticky` | `z-sticky` | 200 |
| `--z-fixed` | `z-fixed` | 300 |
| `--z-modal-backdrop` | `z-modal-backdrop` | 400 |
| `--z-modal` | `z-modal` | 500 |
| `--z-popover` | `z-popover` | 600 |
| `--z-tooltip` | `z-tooltip` | 700 |
| `--z-toast` | `z-toast` | 800 |

---

## Component API

Import from `@/components/ui`.

### Button — `src/components/ui/Button.tsx`

```tsx
<Button
  variant="doodle"      // primary | secondary | outline | ghost | destructive
                        // | doodle | doodle-secondary | doodle-outline
  size="md"             // sm | md | lg | xl
  loading={false}       // spinner + disables
  icon={<Icon />}
  iconPosition="left"   // left | right
  fullWidth={false}
/>
```

- Always pill-shaped, 3px ink border, offset shadow, `font-display`.
- `doodle*` variants add a `<StickerPeel />` corner decoration.
- Press state translates +4px/+4px and collapses the shadow.

### Card — `src/components/ui/Card.tsx`

```tsx
<Card variant="doodle-elevated" padding="xl" hover>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardDescription>…</CardDescription>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>
```

- Variants: `default | elevated | outlined | doodle | doodle-elevated`.
- Padding: `none | sm | md | lg | xl`.
- `doodle*` variants render `<StickerPeel />`.

### Input / Textarea / Select — `src/components/ui/Input.tsx`

```tsx
<Input
  label="Email"
  type="email"
  error={errors.email?.message}
  hint="We never share your email"
  icon={<Mail />}                 // left icon (decorative)
  iconPosition="left"             // left | right
  toggleIcon={{ show: <Eye />, hide: <EyeOff /> }} // password reveal
/>
```

- Floating label: floats when `placeholder` present or a value exists.
- Password fields (`type="password"`) render a built-in show/hide toggle
  (managed internally) when `toggleIcon` (or `icon`) is provided.
- `error` → red border + 3px error focus ring + inline message with icon.
- `aria-invalid`, `aria-describedby` wired automatically.

### Badge — `src/components/ui/Badge.tsx`

```tsx
<Badge variant="doodle" size="md" dot dotColor="var(--primary)">New</Badge>
```

- Variants: `default | primary | secondary | accent | success | warning |
  error | info | outline | doodle`
- Sizes: `xs | sm | md | lg`.
- `StatusBadge` / `PaymentStatusBadge` map domain statuses → variants:
  `PENDING→warning`, `PROCESSING→primary`, `SHIPPED→secondary`,
  `DELIVERED→success`, `CANCELLED/REFUNDED→error`, etc.

### Other primitives

`Modal`, `ConfirmModal`, `Dropdown`, `MultiSelectDropdown`, `Tabs`,
`Tooltip`, `Slider`, `ColorPicker`, `ImageUpload`, `DataTable`,
`Pagination`, `Skeleton*`, `Checkbox`, `Accordion`, `ErrorBoundary`,
`GlobalLoading`. See each file under `src/components/ui/` for props.

### Decorative system — `src/components/decorative/`

- `DoodleElements.tsx` — `DoodleShape`, `DoodleScribble`, `DoodleStar`,
  `WashiTape`, `StickerPeel`, `TornEdge`, `SketchUnderline`
- `DoodleBackground.tsx` — animated blurred background blobs
- `DoodleScatter.tsx` — convenience wrapper over `DoodleBackground`

---

## Accessibility conventions

- Focus: global `*:focus-visible` → `3px solid var(--accent)` with
  `outline-offset: 2px`; interactive components also use
  `focus-visible:ring-3 ring-[var(--accent)]`.
- `.skip-link` exists for keyboard users.
- Never rely on color alone for status — `StatusBadge` includes `dot` +
  text label.
- `prefers-reduced-motion` and `prefers-contrast: high` are honored
  globally in `globals.css`.
- Target WCAG AA contrast; verify interactive states (hover/active/
  disabled) on both light and dark backgrounds.
