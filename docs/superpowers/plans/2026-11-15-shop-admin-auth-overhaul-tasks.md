# TASKS — Shop + Admin + Auth + Brand Overhaul (2026-11-15)

**Companion to:** `docs/superpowers/specs/2026-11-15-shop-admin-auth-overhaul-design.md`  
**Authority:** `docs/DESIGN_CONTRACT.md` — §7 frozen logic, §8 `pnpm verify` before commit, §10 visual decisions need sign-off.  
**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done+verified.  
**Blocking:** Owner decisions on §6 visual items → Pass 1.3, 1.6, 3.2. Auth §7 exception → Pass 1.6.

---

## Pass 1 — Brand/Typography + Auth Split (Foundation)

### 1.1 Token Palette + Wordmark Refactor
- [ ] 1.1.1 Add per-letter palette placeholders to `tokens/src/color.json` (`letter-1` … `letter-8` with `#000000`); run `pnpm tokens`
- [ ] 1.1.2 Refactor `Wordmark.tsx`: accept `text` prop (default `'BIOSCOPE'`), `letterColors` prop (array), render each letter in its color; keep `variant`/`size`/`raw`; update OG path
- [ ] 1.1.3 Update `Navbar.tsx:80` → `<Wordmark size="md" text="BIOSCOPE" />`; `Footer.tsx:122` → `<Wordmark size="lg" variant="light" text="BIOSCOPE" />`; `AdminSidebar.tsx:134-141` → replace raw Image+span with `<Wordmark variant="dark" size="md" text="BIOSCOPE" />`

### 1.2 Uppercase Metadata & ARIA Labels
- [ ] 1.2.1 `src/app/layout.tsx`: `metadata.title.default`, `template`, `openGraph.siteName`, `openGraph.title`, `twitter.title` → `BIOSCOPE`
- [ ] 1.2.2 `src/app/page.tsx`: same metadata fields → `BIOSCOPE`
- [ ] 1.2.3 `src/app/opengraph-image.tsx`: `alt: 'BIOSCOPE'`
- [ ] 1.2.4 `Navbar.tsx`: `aria-label="BIOSCOPE — home"` (line 74)
- [ ] 1.2.5 `Footer.tsx`: `aria-label="BIOSCOPE — home"` (line 119)
- [ ] 1.2.6 `AdminSidebar.tsx`: text content `BIOSCOPE` (migrated to Wordmark in 1.1.3)
- [ ] 1.2.7 Verify: `grep -r "bioscope" src/app/layout.tsx src/app/page.tsx src/app/opengraph-image.tsx src/components/layout/Navbar.tsx src/components/layout/Footer.tsx src/components/layout/AdminSidebar.tsx` → 0 matches

### 1.3 Auth Split — Admin Login Page
- [ ] 1.3.1 Create `src/app/(admin)/login/page.tsx` (copy of customer login, changes: `callbackUrl: '/admin/dashboard'`, page title "Admin Sign In", redirect logic same)
- [ ] 1.3.2 Add route to admin layout group (file exists at `src/app/(admin)/login/page.tsx` → auto-routed)
- [ ] 1.3.3 Test: admin signs in at `/admin/login` → redirects to `/admin/dashboard`

### 1.4 Auth Split — Customer Login Rejects Admins
- [ ] 1.4.1 `src/app/(customer)/login/page.tsx`: after successful `signIn`, check `result?.user?.role === 'ADMIN'` → if true, `signOut()` + redirect to `/admin/login` with toast "Admin users must sign in at /admin/login"
- [ ] 1.4.2 Test: admin credentials at `/login` → toast + redirect to `/admin/login`

### 1.5 Auth Split — Middleware/Config Adjustments (Owner Exception §7)
- [ ] 1.5.1 `src/auth.config.ts:39-64` (authorized callback): ensure `/admin/login` is treated as auth path (add to `isAuthPath` check) so logged-in admins are redirected to dashboard
- [ ] 1.5.2 `src/middleware.ts`: matcher already covers `/admin/:path*` — verify `/admin/login` passes through auth check correctly
- [ ] 1.5.3 Document exception in commit message: "touches frozen `src/auth.config.ts` + `src/middleware.ts` per §7 owner approval 2026-11-15"

### 1.6 Admin Bootstrap — Instrumentation Hook
- [ ] 1.6.1 Create `instrumentation.ts` at repo root (Next.js 14 convention):
  ```ts
  export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const { prisma } = await import('@/lib/prisma')
      const bcrypt = await import('bcryptjs')
      const email = process.env.ADMIN_EMAIL
      const password = process.env.ADMIN_PASSWORD
      const name = process.env.ADMIN_NAME || 'Admin'
      if (email && password) {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (!existing) {
          await prisma.user.create({
            data: { email, passwordHash: await bcrypt.hash(password, 12), name, role: 'ADMIN', emailVerified: new Date() }
          })
        }
      }
    }
  }
  ```
- [ ] 1.6.2 Add to `.env.example`:
  ```
  ADMIN_EMAIL=admin@bioscope.com
  ADMIN_PASSWORD=changeme
  ADMIN_NAME=Admin User
  ```
- [ ] 1.6.3 Add same to `.env` (for local dev)
- [ ] 1.6.4 Test: `pnpm dev` → admin user exists in DB (idempotent)

---

## Pass 2 — Shop Page Rework

### 2.1 Hero Slimmer + Illustrated Badges
- [ ] 2.1.1 `src/app/(customer)/shop/page.tsx:122`: `py-20` → `py-12`
- [ ] 2.1.2 Add Lucide icons to 3 badges (lines 130-132):
  - Free Delivery: `<Truck className="w-5 h-5 mr-2" />`
  - Weatherproof: `<Shield className="w-5 h-5 mr-2" />`
  - Custom Designs: `<Sparkles className="w-5 h-5 mr-2" />` (or `Palette`)
- [ ] 2.1.3 Ensure badge text remains, icon is `mr-2` inline

### 2.2 Toolbar Reorganization (Search/Sort Row + Category Grid Row)
- [ ] 2.2.1 Current structure (lines 138-197): reorganize into **two distinct rows** inside the toolbar `<div>`:
  - **Row 1** (search + sort): `flex flex-col md:flex-row md:items-center gap-4` — Search `flex-1 min-w-0` + Sort `w-auto`
  - **Row 2** (categories): `flex flex-wrap gap-2` full width — category pills as grid cards
- [ ] 2.2.2 Search input: `className="flex-1 min-w-0 min-h-[44px]"` (dominant width)
- [ ] 2.2.3 Sort select: `className="w-auto min-w-[180px]"` (compact)
- [ ] 2.2.4 Category grid: responsive `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3` — each pill as a card with image/icon + name

### 2.3 Category Grid — Dynamic Data + Image/Icon Display
- [ ] 2.3.1 `categoryPills` map → render grid cards: each card shows category `image` (if URL) or fallback icon, plus `name`
- [ ] 2.3.2 Card style: `border-2 border-[var(--ink)] rounded-[var(--radius-md)] bg-[var(--surface-raised)] p-3 text-center transition-colors hover:bg-[var(--paper-deep)]`
- [ ] 2.3.3 Image: `w-12 h-12 mx-auto mb-2 object-contain` (if `cat.image`); else fallback Lucide icon from a map (e.g., `Package`, `Scissors`, `Gem`, `Image`, `Box`)
- [ ] 2.3.4 Selected state: `border-[var(--primary)] bg-[var(--primary)/5]` + ring

### 2.4 Shop Page Visual Polish
- [ ] 2.4.1 Ensure product grid section unchanged (already correct)
- [ ] 2.4.2 CTA section unchanged
- [ ] 2.4.3 Test responsive: 320px (stacked), 768px (search+sort row, category grid 3 cols), 1024px (search dominant, category grid 5-6 cols)

---

## Pass 3 — Admin Categories CRUD + Icon Picker

### 3.1 Admin Categories Page + Component
- [ ] 3.1.1 Create `src/app/(admin)/admin/categories/page.tsx` (wrapper → `<CategoriesPage />`)
- [ ] 3.1.2 Create `src/components/admin/CategoriesPage.tsx`:
  - State: categories[], search, page, pager, loading, showForm, editingCategory
  - `load()` → `fetch('/api/categories?...')` with search/page/sort
  - `DataTable` columns: Image/Icon, Name, Slug, SortOrder, Products Count, Active, Actions
  - Toolbar: SearchInput (name/slug), "Create Category" button
  - Form modal: name, slug (auto from name), description, image (ImageUpload), icon (IconPicker), sortOrder, isActive
  - Actions: edit, delete (guard: no products), toggle active
  - `useEffect` for categories fetch (for icon/image fallback map in shop page — optional)

### 3.2 Category Icon Picker (Lucide Modal)
- [ ] 3.2.1 Create `src/components/admin/CategoryIconPicker.tsx`:
  - Props: `value` (icon name string), `onChange(name: string)`, `onClose`
  - Internal: curated list of ~30 relevant Lucide icons (Package, Scissors, Gem, Image, Box, Tag, Palette, Sparkles, Truck, Shield, etc.)
  - UI: Modal with search input (filters icons by name), grid of icon buttons (48px, hover ring), selected highlight
  - Returns icon name (e.g., `"Package"`) → stored as `icon` field on category (new field `icon: String?` in schema — see 3.5)

### 3.3 Category Image Upload
- [ ] 3.3.1 Add `icon` field to Prisma Category model: `icon String?` (run `pnpm db:push` after)
- [ ] 3.3.2 In CategoriesPage form: use existing `ImageUpload` component (from `ProductForm` pattern) for `image` field; for `icon` field use `CategoryIconPicker`
- [ ] 3.3.3 Preview: show uploaded image thumbnail or selected icon next to field

### 3.4 Admin Sidebar Link
- [ ] 3.4.1 `src/components/layout/AdminSidebar.tsx`: add "Categories" nav item with `Tag` icon, href `/admin/categories`

### 3.5 API Fix — POST /api/categories Require Admin
- [ ] 3.5.1 `src/app/api/categories/route.ts:38-46`: add `await requireAdmin()` at start of POST handler
- [ ] 3.5.2 Update `createCategorySchema` to include `icon` field (optional string)

---

## Pass 4 — Admin Panel Completeness (Per Audit)

### 4.1 P0 — Critical Bugs (Must Fix Before Anything Else)
- [ ] 4.1.1 `ProductForm.tsx` lines 65-73: replace `id: ''` with `id: crypto.randomUUID()` (import `crypto`) for all default dimensions/quantities
- [ ] 4.1.2 `SettingsForm.tsx`: make `TaxConfig`/`DeliveryConfig` `onChange` call parent `onSettingsChange(key, value)` so state persists across tabs; OR add per-tab "Save" button
- [ ] 4.1.3 Create `/api/analytics/*` endpoints:
  - `GET /api/analytics/revenue?range=30d` → server-side aggregation (Prisma `groupBy`)
  - `GET /api/analytics/orders?range=30d` → orders count by status
  - `GET /api/analytics/top-products?limit=10&range=30d`
  - `GET /api/analytics/top-customers?limit=10&range=30d`
  - `GET /api/analytics/categories?range=30d`
  - `GET /api/analytics/geo?range=30d` → orders by city/district
  - Update `analytics/page.tsx` to fetch from these instead of client-side aggregation
- [ ] 4.1.4 Add `OrderStatusHistory` Prisma model + migration:
  ```prisma
  model OrderStatusHistory {
    id        String     @id @default(cuid())
    orderId   String
    order     Order      @relation(fields: [orderId], references: [id], onDelete: Cascade)
    fromStatus OrderStatus?
    toStatus   OrderStatus
    changedBy  String     // admin user id
    note       String?
    createdAt  DateTime   @default(now())
    @@index([orderId])
    @@index([createdAt])
  }
  ```
  - Update `src/lib/actions/order.ts` `updateOrderStatus` to create history entry
  - Add `/api/orders/[id]/history` GET route
  - Add "History" tab in Orders detail modal

### 4.2 P1 — High-Value Features
- [ ] 4.2.1 Customers page: detail modal (click row) → tabs: Profile (edit name/phone), Addresses, Orders (paginated table), Spend Tier (edit manually)
- [ ] 4.2.2 Customers export: "Export CSV" button → streams CSV from `/api/customers/export`
- [ ] 4.2.3 Orders page: "Send Email" button in detail modal (triggers transactional email via server action)
- [ ] 4.2.4 Orders page: "Print Invoice" button → generates PDF (use `@react-pdf/renderer` or server-side)
- [ ] 4.2.5 Stock adjustment UI: new page `/admin/inventory` or tab in Products → list trackable products, "Adjust Stock" modal (in/out, quantity, reason, note) → creates `StockAdjustment` Prisma model + history
- [ ] 4.2.6 Category management link from Products page → "Manage Categories" button → `/admin/categories`

### 4.3 P2 — Settings Expansion
- [ ] 4.3.1 Settings → Payments tab: Stripe (publishable/secret/webhook secret), SSLCommerz (store_id/store_pass), bKash (app_key/app_secret/username/password), Nagad (merchant_id/private_key) — all encrypted in DB
- [ ] 4.3.2 Settings → SMTP tab: host, port, username, password, from_email, from_name, TLS
- [ ] 4.3.3 Settings → Webhooks tab: list of endpoints + events (order.created, order.updated, payment.received, custom_request.updated)
- [ ] 4.3.4 Settings → API Keys tab: generate/revoke public/secret keys for headless integrations
- [ ] 4.3.5 Settings → Backup/Restore tab: "Download Settings JSON", "Upload Settings JSON" (validates keys)

### 4.4 P3 — Real-time + Advanced
- [ ] 4.4.1 Socket.io integration: dashboard (live stats), orders (live status), custom-requests (live new request notification)
- [ ] 4.4.2 Custom request revision workflow: "Request Revision" button → sends back to customer with notes → customer can update design → re-submits
- [ ] 4.4.3 Direct order creation from priced custom request: admin clicks "Create Order" → pre-fills order with request details
- [ ] 4.4.4 Product duplication: "Clone" button in Products table
- [ ] 4.4.5 Product import/export: CSV with all fields + dimensions/quantities JSON

---

## Pass 5 — Visual Polish + Regression Gates

### 5.1 Additive Regression Gates
- [ ] 5.1.1 `tests/unit/dead-utilities.test.ts` already exists — ensure it passes
- [ ] 5.1.2 Add `tests/unit/admin-classes.test.ts`: scan `src/components/admin/**/*.tsx` for any class referencing non-existent Tailwind config keys (color/radius/fontSize) — fail if found
- [ ] 5.1.3 Add `tests/unit/category-api.test.ts`: test `requireAdmin` on POST, `HAS_PRODUCTS` guard on DELETE, icon/image fields

### 5.2 Full Verification Pass
- [ ] 5.2.1 `pnpm type-check` → 0 errors
- [ ] 5.2.2 `pnpm lint` → 0 errors (warnings OK)
- [ ] 5.2.3 `pnpm test:run` → all green (255+ existing + new)
- [ ] 5.2.4 `pnpm build` → exit 0
- [ ] 5.2.5 `pnpm verify` → all gates pass (detect-changes exception documented for auth-config)

### 5.3 Visual QA Checklist (Owner Review)
- [ ] 5.3.1 `/shop` — hero height, badges with icons, search/sort row, category grid with images/icons
- [ ] 5.3.2 `/admin/categories` — CRUD works, icon picker opens/closes, image upload shows preview, delete guarded
- [ ] 5.3.3 `/login` — customer only; admin credentials redirect to `/admin/login`
- [ ] 5.3.4 `/admin/login` — admin only; customer credentials fail
- [ ] 5.3.5 `BIOSCOPE` uppercase in title bar, metadata, Wordmark, aria-labels
- [ ] 5.3.6 Admin panel — all 7 routes load without console errors; dashboard charts from server APIs

---

## Owner Decisions Tracker (Must Resolve Before Pass 1.3)

| Decision | Options | Status | Resolution |
|----------|---------|--------|------------|
| Badge icons | Lucide Truck/Shield/Sparkles vs custom SVG | ☐ Pending | |
| Category icon picker | Lucide modal (no emoji) | ☐ Pending | |
| Logo per-letter colors | Designer provides 8–9 hex from PNG | ☐ Pending | |
| Auth split exception | Approve touching frozen auth.config.ts + middleware.ts | ☐ Pending | |
| Admin bootstrap | instrumentation.ts at repo root | ☐ Pending | |
| Admin panel scope (P1/P2 items) | Approve wiring dead filters, export, payment gateway, SMTP | ☐ Pending | |

---

## Progress Summary

| Pass | Area | Tasks Total | Done | In Progress | Blocked |
|------|------|-------------|------|-------------|---------|
| 1 | Brand + Auth Split | 18 | 0 | 0 | 6 (owner decisions) |
| 2 | Shop Rework | 12 | 0 | 0 | 0 |
| 3 | Admin Categories | 10 | 0 | 0 | 0 |
| 4 | Admin Completeness | 25 | 0 | 0 | 0 |
| 5 | Polish + Gates | 8 | 0 | 0 | 0 |
| **Total** | | **73** | **0** | **0** | **6** |

---

**Next Action:** Owner resolves 6 decisions above → dispatch Pass 1 implementation lanes.