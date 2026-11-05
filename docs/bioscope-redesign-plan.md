# BIOSCOPE — Ultimate UI/UX Redesign Plan

> Project: `sticker-ecommerce` / brand `bioscope` (rebrand from leftover `MAFTS`).  
> Stack: Next.js 14.2 App Router, TypeScript, Tailwind, shadcn-style primitives, Framer Motion, Fabric.js (builder), Socket.io, Prisma, next-auth v5.  
> Theme direction: **Doodlebook** — doodle + vintage nostalgia + wireframe sketch + warm craft fun.  
> Last audit: 2026-11-02.

---

## 1. Project State (Evidence-Based Audit)

### 1.1 Brand / Naming Conflicts (Found in Source)
| File | Leftover String | Action |
|---|---|---|
| `src/app/layout.tsx` | `Sticker Shop` (title, OG, siteName) | Rename → `bioscope` |
| `src/components/layout/Navbar.tsx:53` | `MAFTS` | Replace with `bioscope` + logo image |
| `src/components/layout/Footer.tsx:58` | `MAFTS` / `© 2024 MAFTS` | Replace |
| `src/components/layout/AdminSidebar.tsx:87` | `MAFTS` | Replace |
| `src/lib/actions/settings.ts` / `src/components/admin/SettingsForm.tsx` | `Sticker Shop` placeholders/defaults | Rename defaults |
| `src/app/globals.css` / `tailwind.config.ts` | `MAFTS Design Tokens` comment | Rename |

### 1.2 Assets / Public
- `public/` only has `images/sticker-placeholder.svg`. No logo, favicon, `og-image.jpg`, or `apple-icon`.
- User said logo is an attached image — place at `public/images/bioscope-logo.svg` (and `.png` fallback) when available.

### 1.3 Font Bug (Evidence in Code)
- `layout.tsx`: imports `Inter`, assigns variable `--font-outfit`, but loads `Inter` instead of `Outfit`.  
- `globals.css`: `@import` `Bangers` + `Outfit` again (duplicate with `next/font`).  
- Tailwind config `fontFamily.display` uses `var(--font-bangers)`; `body` uses `var(--font-outfit)` — but the variable is actually `inter`.
- Fix: define real font variables (`--font-display`, `--font-body`, `--font-hand`) via `next/font/google` and remove `@import`.

### 1.4 Theme / Color Issues (Evidence)
- Tailwind colors in `tailwind.config.ts` are raw hex (`#FF6B6B`), not mapped to `var(--primary)` per `AGENTS.md` rule 2 (CSS variables in `globals.css` are the single source of truth; Tailwind colors map to `var(--...)`).
- `globals.css` defines `:root` variables but tailwind does not reference them.
- `.dark` mode exists (`ThemeProvider`) but no `.dark` overrides in CSS; dark mode is visually broken.
- `bg-shapes` / `.shape-*` use hardcoded `var(--primary)` etc. in `.css` — okay, but need warm palette.
- No paper texture, no sketch borders, no doodle assets.

### 1.5 Component / Page Inventory (Read from Source)
**Customer pages:** `/` (redirect to `/shop`), `/shop`, `/shop/[slug]`, `/cart`, `/checkout`, `/custom-sticker`, `/orders`, `/orders/[id]`, `/profile`, `/login`, `/register`, `/about`, `/contact`.  
**Admin pages:** `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/custom-requests`, `/admin/customers`, `/admin/analytics`, `/admin/settings`.  
**Primitives (ui/):** Button, Card, Badge, Input, Select, Modal, DataTable, Dropdown, Tabs, Tooltip, Slider, Checkbox, ColorPicker, ImageUpload, Pagination, Skeleton.  
**Layout:** Navbar, Footer, MobileNav, AdminSidebar, NotificationBell, CartDrawer.  
**Product:** ProductCard, ProductGrid, FeaturedProduct, ProductDetail, ProductConfigurator, DimensionSelector, QuantitySelector, ReviewForm, ReviewList.  
**Cart/Checkout:** CartDrawer, CartItem, CartSummary, PromoCode, AddressForm, OrderConfirmation, OrderSummary, PaymentMethod.  
**Custom Sticker Builder:** StickerCanvas (Fabric.js), UploadZone, EditingTools, DimensionControls, ColorAdjustments, PreviewPanel, LayerPanel, ExportPreview.  
**Animations:** FloatingShapes, FloatingEmojis, HoverLift, PageTransition, GlassMorphism, StaggeredText, CounterAnimation.

---

## 2. Design System — "Doodlebook"

### 2.1 Concept
A sticker/art-craft shop should feel like opening a scrapbook: torn paper edges, washi tape, handwritten notes, doodled stars/arrows, polaroid photos, rough pencil borders, paper grain. The UI is warm, imperfect, playful, nostalgic — but still fully functional and accessible.

### 2.2 Color Palette (`:root` Variables → Tailwind Map)
| Variable | Hex | Role |
|---|---|---|
| `--paper` | `#FBF3E4` | Main background |
| `--paper-deep` | `#F5E9D3` | Card alternate / sticky notes |
| `--ink` | `#33261A` | Primary text / borders |
| `--primary` | `#E4572E` | Terracotta / CTA / active |
| `--secondary` | `#2A9D8F` | Teal / links / secondary buttons |
| `--accent` | `#F4A259` | Mustard / highlights / badges |
| `--pink` | `#F28482` | Blush accent for doodles / tags |
| `--kraft` | `#B08968` | Paper / kraft sticker finish |
| `--success` | `#588157` | Sage green |
| `--warning` | `#F4A259` | Mustard (reuse) |
| `--error` | `#D64545` | Warm red |
| `--info` | `#5B8E7D` | Soft teal |

**Tailwind mapping (must reference vars):**
```ts
colors: {
  paper: 'var(--paper)',
  'paper-deep': 'var(--paper-deep)',
  ink: 'var(--ink)',
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  pink: 'var(--pink)',
  kraft: 'var(--kraft)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
  info: 'var(--info)',
}
```
Remove raw hex from `tailwind.config.ts` colors. Add to `globals.css` `:root` and `.dark` overrides.

### 2.3 Typography
| Role | Font | Variable | Weight Usage |
|---|---|---|---|
| Display / Logo | Shantell Sans (Google) | `--font-display` | 700–800 |
| Hand / Annotation | Caveat (Google) | `--font-hand` | 400–700 |
| Body | Nunito (Google) | `--font-body` | 400–700 |

Replace `Inter` + `Bangers` import in `layout.tsx`. Keep `next/font/google` only; remove `globals.css` `@import url(...)`.

### 2.4 Sketch / Doodle Layer (New Assets)
- **Doodle SVGs** (`public/doodles/`): stars, arrows, squiggles, hearts, lightning bolts, circles from CC0 sources (`open-doodles`, `dddoodle`). Scattered with `rotate`, `scale`, subtle float animation.
- **Paper texture**: inline SVG `feTurbulence` noise overlay (`.grain`) at opacity ~0.03 over `--paper`.
- **Grid paper**: `linear-gradient` crosshatch for builder page background.
- **Marquee ribbon**: `mustard` (`accent`) background, ink borders top/bottom, `overflow-hidden`, CSS `@keyframes scroll` with handwritten tags (`✦ VINYL ✦ HOLO ✦ CUSTOM ✦`).

### 2.5 Sketch Techniques (CSS / Rough-Notation)
- **Wobbly border**: `border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px`.
- **Sketch underline**: `rough-notation` library for hand-drawn underlines/highlights on headings and active nav items.
- **Dotted divider**: `border-top: 2px dashed var(--ink);` (replaces `border-b` in many sections).
- **Sticker peel**: on primary buttons — a `::after` corner peel (CSS `rotate` + shadow) on hover, using the technique from `reactbits.dev/animations/sticker-peel`.
- **Washi tape strip**: `absolute` narrow strip (`bg-[var(--accent)]` or `bg-[var(--pink)]`) with slight rotation, placed at card top.

---

## 3. Component Redesign Specs

### 3.1 Button (`components/ui/Button.tsx`)
- Variants keep same names; restyle:
  - `primary`: `bg-[var(--primary)]`, `text-white`, `border-2 border-[var(--ink)]`, `shadow-[3px_3px_0_var(--ink)]`.
  - `secondary`: `bg-[var(--accent)]`, `text-[var(--ink)]`, same border/shadow.
  - `outline`: transparent bg, ink border, hover fills primary with white text.
  - `ghost`: transparent, hover `bg-[var(--paper-deep)]`.
- Shape: pill (`rounded-full`). Font: `font-display`. Active state: translate down + shadow collapse.
- Sticker peel: primary buttons get small peeled corner `::after` on hover.
- Size scale remains `sm/md/lg/xl`.

### 3.2 Card (`components/ui/Card.tsx`)
- Background: `bg-[var(--paper)]` or `bg-[var(--paper-deep)]` (alternate rows).
- Border: `border-2` or `border-3` with `border-[var(--ink)]`.
- Radius: `rounded-[20px_4px_20px_4px]` (wobbly) or keep `rounded-card` but remap to `border-radius: 18px 6px 14px 8px`.
- Shadow: hard offset `shadow-[8px_8px_0_var(--secondary)]`. Hover: `shadow-[12px_12px_0_var(--primary)]`.
- Add `.washi-strip` optional prop: renders a `2px` high rotated strip at top.
- Product cards (`ProductCard`): polaroid frame — white inner border `p-2`, image with slight rotation (`rotate-[-0.5deg]` / `rotate-[0.5deg]` alternating per card index), caption below in `font-hand`.

### 3.3 Badge (`components/ui/Badge.tsx`)
- Shape: `rounded-full` or `rounded-[20px]` (soft pill).
- Background: variant-based (primary teal, accent mustard, etc.).
- Border: `border-2 border-[var(--ink)]`. Font: `font-display text-xs uppercase tracking-tight`.
- Discount/starburst: new variant `starburst` using `clip-path: polygon(...)` for star shape, `rotate-[-6deg]`.

### 3.4 Inputs & Forms (all `ui/` primitives + `globals.css` classes)
- Background: `bg-[var(--paper)]`. Border: `border-2 border-[var(--ink)]`. Radius: `rounded-[10px_4px_10px_4px]`. Shadow on focus: `shadow-[4px_4px_0_var(--accent)]`.
- Floating label: keep pattern (`label` absolute with `font-hand`). Adjust color to `var(--ink)`.
- Validation: `input-error` border `var(--error)`; `input-success` border `var(--success)`.
- Remove duplicated `.form-group` rules in `globals.css` where Tailwind handles it; consolidate.

### 3.5 Navbar (`components/layout/Navbar.tsx`)
- Background: `bg-[var(--paper)]/95 backdrop-blur-sm`. Border bottom: `border-b-2 border-[var(--ink)]`.
- Logo: `bioscope` wordmark (`font-display`) + small doodle icon (star or sticker). Replace `MAFTS` text.
- Nav links: pill-style buttons with `font-hand` hover underline via `rough-notation`.
- Cart icon: `ShoppingCart` in a `rounded-full` sticker circle (`bg-[var(--primary)]`, `text-white`) with count starburst.
- Mobile menu: slide from top with `bg-[var(--paper)]`, dashed border, sticky-note feel.
- Scroll state: add subtle `shadow-[0_4px_20px_rgba(51,38,26,0.1)]` instead of `shadow-glass`.

### 3.6 Footer (`components/layout/Footer.tsx`)
- Background: `bg-[var(--ink)]`, text `var(--paper)`.
- Top edge: `torn-paper` SVG divider or dashed line.
- Columns: hand font headings (`font-display` or `font-hand`).
- Links: hover underline `wobbly` via `border-bottom: 2px dashed var(--paper-deep)`.
- Social icons: colored circles (`primary`, `secondary`, etc.) with `lucide` icons.
- Copyright: `font-hand` small text with small doodle.

### 3.7 Cart Drawer (`components/cart/CartDrawer.tsx`)
- Background: `bg-[var(--paper)]`. Left border: `border-l-3 border-[var(--ink)]`.
- Header: `font-display`, with `washi-strip` (`var(--accent)`) rotated slightly across top edge.
- Items: row separators `border-b-2 border-dashed border-[var(--ink)/20]`. Image thumbnails: polaroid mini-frames.
- Empty state: `font-display` heading, doodle star, `font-hand` body.

### 3.8 Checkout & Checkout Components
- Stepper: numbered circles (`1`, `2`, `3`) connected by dashed line with doodle dots (`::before` circles).
- Cards: receipt-style (`bg-[var(--paper-deep)]`, dashed border, `font-hand` totals, `font-display` headings).
- Payment methods: radio buttons as sticker chips (`primary`, `secondary`, `accent`), selected gets `shadow-[3px_3px_0_var(--ink)]`.
- Address form: standard input card with `washi-strip` `primary`.

### 3.9 Custom Sticker Builder (`components/custom-sticker/*` + page)
- Background: `bg-[linear-gradient(90deg,transparent_50%,rgba(51,38,26,0.04)_50%),linear-gradient(0deg,transparent_50%,rgba(51,38,26,0.04)_50%)]` with `background-size: 20px 20px` for grid paper.
- Canvas container: white `paper` background, `border-3 border-[var(--ink)]`, shadow `shadow-[8px_8px_0_var(--accent)]`.
- Panel cards (`LayerPanel`, `EditingTools`, `DimensionControls`, etc.): `sticky-note` colors alternating (`primary` light tint `#FDEAE2`, `secondary` light tint `#DFF5F2`, `accent` light tint `#FFF6E5`). Each panel header has a `washi-strip` (mustard/pink).
- Toolbar buttons: small pill buttons with `font-display`, hover `rotate` `[-1deg]`.
- Preview/Export: receipt-style preview with dashed border and `font-hand` caption.

### 3.10 Admin Components (`components/admin/*` + sidebar)
- Sidebar (`AdminSidebar`): cream (`paper`) background, `ink` border right, active link gets `primary` bg + white text + rough-annotation highlight via `box-shadow` or `background-image: linear-gradient(...)`.
- Stats cards (`StatsCards`): sticker number (`font-display` huge), label (`font-hand` small), mini chart inline.
- Tables (`DataTable`): dashed row separators (`border-b-2 border-dashed`), hover `bg-[var(--paper-deep)]`, header `font-display` uppercase.
- Badges (order status, custom request status): same sticker style; `primary` for completed, `accent` for pending, `secondary` for approved, `error` for cancelled/rejected.
- Form cards: same `washi-strip` + `paper-deep` background pattern.

### 3.11 Animation Replacements
- Remove `FloatingShapes` (big blurry colored blobs) and `FloatingEmojis` (emoji spans) from pages. Replace with `DoodleScatter` component: 4–6 `public/doodles/*.svg` absolutely positioned with `rotate` random, `opacity-60`, subtle float.
- `PageTransition`: keep but restyle — slide with `rotate` `0.5deg` and `skew` `-0.5deg` instead of pure translate.
- `StaggeredText`: keep; add `font-display` letter reveal with `text-shadow` sketch effect (`text-shadow: 2px 2px 0 var(--ink)`).

---

## 4. Per-Page Redesign Specs

### 4.1 `/` (New Landing Page — Currently Redirect)
- Hero: big `font-display` headline (`"Make Awesome Fun Things Stick"`), rough-notation underline, scattered doodles.
- Subhead: `font-hand`, `max-w-2xl`, centered.
- Marquee ribbon (`accent`) between hero and products.
- Featured products row (`ProductGrid` polaroid style, 4 cards).
- "How it works" 3 steps (`1. Design` / `2. Print` / `3. Stick`) — numbered doodle circles with dashed connecting line.
- Newsletter / CTA: `primary` card with torn-paper top edge.
- Footer standard.

### 4.2 `/shop`
- Hero: smaller (`py-16`), `font-display` `Our Stickers`, `font-hand` subtitle, 3 badge pills (`Free Delivery`, `Weatherproof`, `Custom Welcome`).
- Filters toolbar: category pills styled as sticker chips (`rounded-full`, `border-2`, `font-hand`); sort dropdown `font-hand`; view toggle icon buttons.
- Product grid: `ProductGrid` with `variant` `grid` (polaroids). Add `washi-strip` on top row cards (`pink`).
- Pagination: pill buttons (`rounded-full`, `border-2`, `font-display` numbers), active `primary` fill.
- CTA banner (`bg-[var(--ink)]`, text `paper`, button `accent`): `"Can't Find What You're Looking For?"`.

### 4.3 `/shop/[slug]`
- Image gallery: polaroid stack — `ProductDetail` main image in larger polaroid frame; thumbnails below as mini stickers (`rotate` alternating).
- Configurator (`ProductConfigurator`): sticky-note cards (`primary`/`secondary` tint) with tape strips; dimension chips (`primary` active); quantity `font-display`.
- Price: large `font-display` `primary` number, old price struck-through `ink/40`, `starburst` discount badge if `compareAtPrice`.
- Tabs (`Reviews`, `Related`): folder-tab style (`rounded-t-[12px]`, `border-2 border-b-0`, active `primary` bg, `font-display` label).
- Reviews (`ReviewList`): note-card style (`paper-deep`, dashed border, `font-hand` quote, star dots).
- Related products: 4-column polaroids.

### 4.4 `/cart`
- Empty state: centered, `font-display` `Shopping Cart Empty`, `font-hand` text, `primary` button with doodle star.
- Non-empty: left column `items` (sticker sheet rows), right column `summary` receipt card (`bg-[var(--paper-deep)]`, dashed border, `font-hand` totals).
- Each item: thumbnail polaroid, name `font-display`, quantity selector compact circle buttons, price `font-display`.
- Actions: `clearCart` ghost text; `checkout` primary pill with sticker peel.

### 4.5 `/checkout`
- Stepper header: `1 Order` → `2 Address` → `3 Confirm` with dashed line and active `primary` circle.
- Address card (`AddressForm`): `paper-deep`, `washi-strip` mustard, input fields.
- Payment (`PaymentMethod`): radio chips (`primary` selected, others `outline`).
- Order summary: receipt card (`paper-deep`, dashed border, zigzag bottom edge via `clip-path`). Total `font-display` large.
- Confirm button: `primary` pill, hover peel, disabled state `opacity-60`.

### 4.6 `/custom-sticker`
- Header: `font-display` `Design Your Sticker`, `font-hand` sub, tape strip.
- Layout: `grid` — left `2/3` canvas + right `1/3` sticky-note panels.
- Canvas: grid-paper bg, white inner, `border-3`, `shadow-[8px_8px_0_var(--accent)]`.
- Panels: `EditingTools` (icons), `DimensionControls`, `ColorAdjustments`, `LayerPanel`, `UploadZone` — each sticky-note color, tape strip.
- Preview / Export: `bg-[var(--paper-deep)]`, dashed border, `font-hand` caption, `primary` export button.

### 4.7 `/orders` & `/orders/[id]`
- List cards: `paper-deep`, dashed border, header `primary` order number `font-display`, status sticker badge (`primary` delivered, `accent` processing, `secondary` shipped, `error` cancelled).
- Timeline (`OrderTimeline`): vertical dashed line (`border-l-2 border-dashed`), dots (`rounded-full` colored by status), `font-hand` date label.
- Summary (`OrderSummary`): receipt style.

### 4.8 `/profile`
- Avatar: `rounded-full`, `border-3`, `shadow-[6px_6px_0_var(--primary)]`, upload button sticker circle (`primary` bg, `font-display` `+`).
- Info cards: `paper-deep`, `washi-strip` (`accent`), input fields.
- Tabs (`Personal`, `Orders`, `Addresses`, `Security`): folder tabs with `font-display`.
- Address cards (`Saved Addresses`): sticky notes (`primary` light) with edit ghost buttons.

### 4.9 `/login` & `/register`
- Centered `max-w-md` card (`paper-deep`), `washi-strip` (`primary`), `font-display` `Welcome Back` / `Create Account`.
- Doodle scatter: star/arrows around card.
- Error alert (`bg-[var(--error)]/10`, `border-[var(--error)]`, `text-[var(--error)]`).
- Submit button: `primary` with peel.
- Link to other page: `font-hand` with `wobbly` underline.

### 4.10 `/about`
- Hero (`ABOUT US`): `font-display` huge, `font-hand` subtitle, floating doodles (not emojis), stats (`CounterAnimation`) in sticker circles.
- Mission card: `bg-white`, `border-3`, `shadow-[10px_10px_0_var(--accent)]`, `font-display` `Our Mission`.
- Features (`Custom Designs`, `Eco-Friendly`, etc.): cards with `card-icon` in `rounded-full` sticker, `font-display` title, `font-hand` desc.
- Team (`Sarah`, `Rahman`, etc.): polaroid avatar cards (`rounded-[12px_6px]`), `font-hand` role label, `font-display` name.
- Stats row (`500+`, `150`, `50`): `font-display` large with `font-hand` subtitle.

### 4.11 `/contact`
- Contact cards (`Email`, `Phone`, `Map`, `Hours`): sticky notes alternating colors (`primary` light / `secondary` light / `accent` light / `pink` light), `font-display` icon label, `font-hand` value.
- Form (`Send a Message`): card with `paper-deep`, `washi-strip`, input fields.
- FAQ (`accordion-item`): `border-2 border-[var(--ink)]`, `rounded-[12px_4px]`, `font-display` question, `font-hand` answer. Plus/minus as doodle circles.
- Map placeholder: dashed border card with `font-hand` `"Dhaka, Bangladesh"`.

### 4.12 Admin Pages (`/admin/*`)
- Layout (`layout.tsx`): sidebar `AdminSidebar`, main content `bg-[var(--paper)]` (not `bg-bg`).
- Dashboard (`dashboard/page.tsx`): stat cards (`StatCards`) with sticker number + trend dot; recent orders table (`DataTable`) with dashed rows; quick actions (`primary`/`secondary` buttons).
- Products (`products/page.tsx`): `DataTable` with product image polaroids; form (`ProductForm`) in `paper-deep` card with `washi-strip`; `ProductPreview` sticky-note.
- Orders (`orders/page.tsx`): table with status badges; `OrderStatusBadge` sticker style; bulk actions.
- Custom Requests (`custom-requests/page.tsx`): table with request cards; pricing input (`font-display` price, `font-hand` label); `DeliveryConfig` sticky note.
- Analytics (`analytics/page.tsx`): charts (`recharts`) in `paper-deep` cards; top stats with `CounterAnimation`.
- Settings (`settings/page.tsx`): tabs (`Tabs`) folder style; forms in `paper-deep` cards; `NotificationBell` icon in `primary` circle.

---

## 5. Implementation Phases

### Phase 0 — Foundation (Now)
- [ ] Rebrand strings (`MAFTS` → `bioscope`, `Sticker Shop` → `bioscope`, email/placeholders).
- [ ] Add logo assets to `public/images/` (logo.svg, favicon.ico, og-image.jpg placeholder).
- [ ] Fix font variables in `layout.tsx` (Shantell Sans, Caveat, Nunito via `next/font/google`).
- [ ] Update `tailwind.config.ts`: colors → `var(--...)` references; keep `fontFamily` mapping; add `animation` for marquee.
- [ ] Update `globals.css`: new `:root` palette; `.dark` overrides; `.grain` texture; `.marquee`; `.wobbly-radius`; `.washi-strip`; `.torn-paper`; remove old `bg-shapes` / `.shape-*` blobs and `.floating-emojis`; consolidate duplicate button/card rules; add `font-display`/`font-hand`/`font-body` usage.
- [ ] Create `docs/design/` or just `public/doodles/` with CC0 SVG doodles.
- [ ] Install `rough-notation` (`npm i rough-notation`) and add to project; add types if needed.

### Phase 1 — Decorative Components & Primitives
- [ ] Create `components/ui/Doodle.tsx` (scattered SVG components).
- [ ] Create `components/decorative/WashiStrip.tsx`.
- [ ] Create `components/decorative/StickerPeel.tsx` (CSS pseudo-element).
- [ ] Restyle `Button`, `Card`, `Badge`, `Input`, `Select`, `Modal`, `Tabs`, `Pagination`, `Skeleton`, `DataTable`, `Dropdown`, `Tooltip` with new tokens.
- [ ] Restyle `Navbar`, `Footer`, `AdminSidebar`, `MobileNav`, `CartDrawer`.
- [ ] Replace `FloatingShapes` / `FloatingEmojis` pages with `DoodleScatter` or remove.

### Phase 2 — Customer Pages
- [ ] `/` landing page (new).
- [ ] `/shop`, `/shop/[slug]` (product cards, filters, configurator).
- [ ] `/cart`, `/checkout`.
- [ ] `/custom-sticker` (builder theme).
- [ ] `/orders`, `/orders/[id]`.
- [ ] `/profile`, `/login`, `/register`.
- [ ] `/about`, `/contact`.

### Phase 3 — Admin & Polish
- [ ] Admin sidebar, dashboard, products, orders, custom-requests, customers, analytics, settings.
- [ ] Fix `ThemeProvider` dark mode (`.dark` overrides in CSS) or disable dark toggle.
- [ ] Accessibility: `focus-visible`, reduced motion (`prefers-reduced-motion`), high contrast (`prefers-contrast: high`).
- [ ] Reduce motion: keep animations but add `animation: none` for `.reduce-motion`.
- [ ] Build verification: `pnpm type-check`, `pnpm lint`, `pnpm build`, `pnpm test:run`.

---

## 6. Verification Checklist
- [ ] `grep -rni "MAFTS\|Sticker Shop" src/` — zero leftover brand strings (except historical docs).
- [ ] `grep -rni "#FF6B6B\|#4ECDC4\|#FFE66D\|#2C3E50" src/app src/components/` — zero hardcoded hex (only in `tailwind.config.ts` as `var(...)`).
- [ ] `grep -rni "bg-shapes\|\.shape-" src/` — cleaned.
- [ ] `grep -rni ".floating-emojis" src/` — cleaned/replaced.
- [ ] `public/images/` has `logo.svg` + favicon placeholders.
- [ ] `src/app/globals.css` uses only `var(--...)` for colors; no `#` hex.
- [ ] `tailwind.config.ts` colors only `var(...)`.
- [ ] `layout.tsx` fonts correct variables; no duplicate `@import` in CSS.
- [ ] Visual proof: `pnpm dev` runs; homepage renders; `/shop` shows polaroid cards; `/custom-sticker` shows grid-paper builder; `/checkout` shows receipt card.
- [ ] E2E smoke `pnpm e2e` still passes (at minimum smoke.spec.ts runs).

---

## 7. Recommended Dependencies to Add
- `rough-notation` (~1.3MB with RoughJS) — sketch annotations/highlights.
- Optional: `canvas-confetti` for add-to-cart celebration.
- No new major UI library needed (existing `radix-ui` primitives + custom theme layer is sufficient per `AGENTS.md` conventions).

---

## 8. Design References (Web Research)
- `shadcn/ui` docs — base primitives (already aligned).
- `MagicUI` / `Aceternity UI` / `React Bits` — sticker peel animation (`reactbits.dev/animations/sticker-peel`), marquee (`reactbits.dev/text-animations/text-loop`), text loop along curves.
- `rough-notation.com` (`RoughNotion`) — sketch borders/highlights.
- `open-doodles.com` / `dddoodle` — free doodle SVG assets (CC0).
- Vintage palettes: `phototones.com/palettes/retro`, `hueatlas.com/color-palettes/70s-color-palette` — mustard (`#F4A259`), terracotta (`#E4572E`), teal (`#2A9D8F`), kraft (`#B08968`).
- Fonts: `fonts.google.com` — `Shantell Sans`, `Caveat`, `Nunito` (rounded, kid-friendly).
- Sketch CSS: `freefrontend.com/css-borders/`, `codepen.io/bsehovac/pen/gvejKK` (sticker peel CSS), `css-tricks.com/grainy-gradients/` (paper grain).

---

*Plan saved: 2026-11-02. Author: bioscope design audit. Scope: full UI/UX redesign. Status: Phase 0–1 ready to begin; Phases 2–3 require sequential implementation.*
