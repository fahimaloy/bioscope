# Bioscope — Shop Rework + Admin Completeness + Auth Split + Brand Overhaul

**Spec Version:** 2026-11-15  
**Authority:** `docs/DESIGN_CONTRACT.md` (§1 tokens, §2 contrast, §3 decor, §4 motion, §5 surfaces, §6 a11y, §7 frozen logic, §8 gates, §10 settled decisions)  
**Design System:** `docs/design-system.md`  
**Prior Work:** `docs/superpowers/plans/2026-11-15-css-shop-inputs-*.md` (committed: `841a7ae`, `a9ee2f9`)

---

## 1. Intent & Why

The sticker shop (Bioscope) needs four interconnected improvements that span customer-facing UI, admin panel completeness, authentication architecture, and brand consistency:

1. **Shop page** is the primary revenue surface — it needs a slimmer hero, illustrated badges, search-dominant toolbar, and a dynamic category grid with full admin CRUD (including icon/image picker for categories).
2. **Admin panel** has 7 routes but significant gaps: read-only customers, client-side analytics, missing category management, dead filter UI, no export/audit-log/payment-gateway settings, no stock adjustment history.
3. **Authentication** must split: `/login` for customers ONLY, new `/admin/login` for admins ONLY — with env-driven default admin bootstrap on server start.
4. **Brand/Typography**: Fix "bioscoope" typo → uppercase `BIOSCOPE` everywhere; derive a sequential per-letter color palette from the logo PNG for the Wordmark component.

---

## 2. Goals, Non-Goals, Anti-Goals

### Goals
- Shop hero height reduced from `py-20` → `py-12` with 3 illustrated badges (Lucide icons or custom SVG).
- Search bar full-width on mobile, dominant on desktop; sort select compact; both in dedicated row.
- Category pills → full-width responsive grid (4/5/6 cols) with dynamic data, inline edit/delete, and admin CRUD page with icon picker (Lucide modal) + image upload.
- Admin panel: all 7 routes feature-complete per audit (export, audit log, payment gateway, SMTP, stock adjustment, customer detail, order audit trail).
- Auth split: `/login` rejects admins; `/admin/login` rejects customers; `instrumentation.ts` bootstraps admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env.
- Brand: `BIOSCOPE` uppercase in all metadata, aria-labels, Wordmark text; per-letter colors from logo PNG added to tokens + Wordmark.

### Non-Goals
- Payment gateway integration (Stripe/bKash/Nagad) — settings fields only, no checkout flow.
- Multi-language / multi-currency — single `BDT` remains.
- Real-time dashboard via socket.io — Phase 2.
- Email template builder — Phase 2.

### Anti-Goals
- No emoji in UI (project rule enforced by tests).
- No hardcoded colors — all via CSS variables / Tailwind tokens.
- No direct Prisma in client components — all data via API routes / server actions.

---

## 3. Constraints

| Constraint | Source |
|------------|--------|
| Token-only colors, AA contrast, 2px ink borders, 44px targets | `DESIGN_CONTRACT.md` §1, §2, §5, §6 |
| Frozen logic layer: `src/lib/actions/**`, `src/app/api/**`, `prisma/**`, `socket-server/**`, `src/middleware.ts`, `src/auth.config.ts`, `tests/**`, `e2e/**` | §7 |
| `pnpm verify` (type-check, lint, test:run, build, detect-changes) before commit | §8 |
| Visual decisions settled — new ones need owner sign-off | §10 |
| No emoji in UI | `tests/unit/pages/shop.test.tsx:258` |
| Next.js 14 App Router, React 18, Tailwind 3.4, next-auth v5 (JWT + credentials) | Project stack |

---

## 4. Approaches Considered

### 4.1 Shop Category Grid & Admin CRUD
| Approach | Trade-offs | Decision |
|----------|------------|----------|
| **A. Dedicated `/admin/categories` page + modal form + Lucide icon picker modal + ImageUpload** | Standard CRUD pattern; reuses existing `ImageUpload`; icon picker = modal grid of Lucide icons (searchable) | ✅ **Chosen** — fits existing patterns; no new deps |
| B. Inline editable grid on products page + drawer form | Less navigation; but mixes concerns; harder to manage image/icon upload | Rejected |
| C. Separate microservice / admin sub-app | Overkill for 1 entity | Rejected |

### 4.2 Auth Split
| Approach | Trade-offs | Decision |
|----------|------------|----------|
| **A. `/login` customer-only + new `/admin/login` page; middleware + login page checks** | Clean separation; `/admin/login` uses same credentials provider; `callbackUrl: /admin/dashboard` | ✅ **Chosen** — minimal code, clear UX |
| B. Single `/login` with role selector + redirect | Simpler routes; but UX confusion; violates "customer-only" req | Rejected |
| C. Subdomain `admin.bioscope` | True isolation; infra complexity (cookies, DNS, SSL) | Rejected |

### 4.3 Admin Bootstrap
| Approach | Trade-offs | Decision |
|----------|------------|----------|
| **A. `instrumentation.ts` (Next.js startup hook) → check ADMIN exists → create from `ADMIN_EMAIL`/`ADMIN_PASSWORD`** | Non-destructive, idempotent, runs once on server start, no manual seed | ✅ **Chosen** |
| B. Modify `src/lib/auth.ts` authorize to create admin if none | Runs per-request; coupling auth flow with bootstrap | Rejected |
| C. Extend `pnpm db:seed` with non-destructive flag | Still manual CLI step | Rejected |

### 4.4 Shop Search/Sort Layout
| Approach | Trade-offs | Decision |
|----------|------------|----------|
| **A. Row 1: Search (flex-1) + Sort (auto); Row 2: Category grid (full width)** | Matches request exactly; responsive | ✅ **Chosen** |
| B. Sidebar on desktop, drawer on mobile | More space for categories; adds complexity | Rejected |

---

## 5. How Decisions Map to Files

| Decision | Files to Create / Modify |
|----------|--------------------------|
| Shop hero slimmer + illustrated badges | `src/app/(customer)/shop/page.tsx:122-134` |
| Search/Sort row (search dominant) | `src/app/(customer)/shop/page.tsx:138-197` |
| Category grid row + dynamic pills | `src/app/(customer)/shop/page.tsx:141-165` |
| Admin categories page | **NEW** `src/app/(admin)/admin/categories/page.tsx` |
| Admin categories component | **NEW** `src/components/admin/CategoriesPage.tsx` |
| Category icon picker (Lucide modal) | **NEW** `src/components/admin/CategoryIconPicker.tsx` |
| Category image upload | Wire `ImageUpload` in category form (use existing `/api/uploadthing` or Cloudinary) |
| Category CRUD API | `src/app/api/categories/route.ts` (add `requireAdmin` to POST), `/api/categories/[id]/route.ts` (OK) |
| Auth split: `/admin/login` page | **NEW** `src/app/(admin)/login/page.tsx` |
| Auth split: `/login` customer-only redirect | `src/app/(customer)/login/page.tsx:60-65` |
| Auth split: middleware adjustments | `src/middleware.ts`, `src/auth.config.ts:39-64` (owner exception §7) |
| Admin bootstrap | **NEW** `instrumentation.ts` (or `src/instrumentation.ts`) |
| Env vars for admin bootstrap | `.env`, `.env.example` — add `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` |
| `BIOSCOPE` uppercase everywhere | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/opengraph-image.tsx`, `Wordmark.tsx`, `Navbar.tsx`, `Footer.tsx`, `AdminSidebar.tsx` |
| Per-letter color palette | `tokens/src/color.json` (add `letter-1`…`letter-8`); `Wordmark.tsx` (refactor to array-driven) |
| Admin panel gaps (export, audit log, payment gateway, SMTP, stock adjustment, customer detail, order audit trail) | Per audit table — new components/API/routes as needed |

---

## 6. Visual Decisions Requiring Owner Sign-Off (§10)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Badge illustrations** (hero 3 badges) | Lucide icons: `Truck` (Free Delivery), `Shield` (Weatherproof), `Sparkles`/`Palette` (Custom Designs) vs custom SVG | Lucide — consistent, zero new assets |
| **Category icon picker** | Lucide modal (searchable grid) — no emoji per project rule | Lucide modal ✅ |
| **Logo per-letter colors** | 8–9 hex values from `public/images/bioscope-logo.png` (Bengali glyphs) — designer must provide | Designer provides; I add to `tokens/src/color.json` |
| **Auth split exception** | Touches `src/auth.config.ts` + `src/middleware.ts` (frozen §7) — owner must approve | Document exception in commit |
| **Admin bootstrap location** | `instrumentation.ts` (repo root) vs `src/instrumentation.ts` | Repo root `instrumentation.ts` (Next.js convention) |

---

## 7. Implementation Sequence (Passes)

### Pass 1 — Brand/Typography + Auth Split (Foundation)
| Step | Description | Files | Verification |
|------|-------------|-------|--------------|
| 1.1 | Add per-letter color palette to `tokens/src/color.json` (placeholders) | `tokens/src/color.json`, `pnpm tokens` | `grep letter- tokens/src/color.json` |
| 1.2 | Refactor `Wordmark.tsx` to accept `text="BIOSCOPE"` + `letterColors` array | `src/components/brand/Wordmark.tsx` | Visual: Wordmark shows uppercase + per-letter colors |
| 1.3 | Uppercase all metadata/aria-labels (`bioscope` → `BIOSCOPE`) | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/opengraph-image.tsx`, `Navbar.tsx`, `Footer.tsx`, `AdminSidebar.tsx` | `grep -r "bioscope" src/app/layout.tsx src/app/page.tsx ...` → 0 |
| 1.4 | Create `/admin/login` page (copy of `/login` + `callbackUrl: /admin/dashboard`) | **NEW** `src/app/(admin)/login/page.tsx` | `/admin/login` loads, signs in admin → redirects to dashboard |
| 1.5 | Update `/login` to redirect admin users to `/admin/login` | `src/app/(customer)/login/page.tsx` | Admin login at `/login` → redirect to `/admin/login` |
| 1.6 | Adjust middleware/auth.config for separate login paths (owner exception) | `src/middleware.ts`, `src/auth.config.ts:39-64` | Admin paths protected; customer paths protected; no cross-access |
| 1.7 | Add `instrumentation.ts` for admin bootstrap from `ADMIN_EMAIL`/`ADMIN_PASSWORD` | **NEW** `instrumentation.ts` | Server start → admin user exists (idempotent) |
| 1.8 | Add env vars to `.env.example` (and `.env`) | `.env.example`, `.env` | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` documented |

### Pass 2 — Shop Page Rework
| Step | Description | Files | Verification |
|------|-------------|-------|--------------|
| 2.1 | Reduce hero height `py-20` → `py-12`; add Lucide icons to 3 badges | `src/app/(customer)/shop/page.tsx:122-134` | Visual: shorter hero, badges with icons |
| 2.2 | Reorganize toolbar: Row 1 = Search (flex-1) + Sort (auto); Row 2 = Category grid (full width, responsive) | `src/app/(customer)/shop/page.tsx:138-197` | Mobile: stacked; Desktop: search dominant, sort compact, categories full-width grid |
| 2.3 | Category pills → grid cards with dynamic data; show category image/icon beside name | `src/app/(customer)/shop/page.tsx:141-165` | Category grid renders; images/icons show |
| 2.4 | Connect category CRUD to admin (see Pass 3) | — | — |

### Pass 3 — Admin Categories CRUD + Icon Picker
| Step | Description | Files | Verification |
|------|-------------|-------|--------------|
| 3.1 | Create admin categories page + component with DataTable (name, slug, image/icon, sortOrder, actions) | **NEW** `src/app/(admin)/admin/categories/page.tsx`, `src/components/admin/CategoriesPage.tsx` | `/admin/categories` loads, lists seeded categories |
| 3.2 | Create CategoryIconPicker modal (Lucide icons searchable grid) | **NEW** `src/components/admin/CategoryIconPicker.tsx` | Modal opens, icon selectable, preview updates |
| 3.3 | Wire `ImageUpload` in category create/edit form (use existing Cloudinary/UploadThing) | Modify category form in CategoriesPage | Image uploads, preview shows, URL saved to `image` field |
| 3.4 | Add "Categories" link in AdminSidebar | `src/components/layout/AdminSidebar.tsx` | Sidebar shows Categories route |
| 3.5 | Fix POST `/api/categories` → add `requireAdmin()` | `src/app/api/categories/route.ts:38-46` | POST now requires admin |

### Pass 4 — Admin Panel Completeness (per audit table)
| Priority | Area | Key Deliverables |
|----------|------|------------------|
| **P0** | ProductForm bug | Fix default `id: ''` in dimensions/quantities → generate UUIDs |
| **P0** | SettingsForm persistence | Persist `TaxConfig`/`DeliveryConfig` state to parent on change (or per-tab save) |
| **P0** | Analytics server-side | Create `/api/analytics/*` endpoints (revenue, orders, top products, customers, categories, geo); remove client-side aggregation |
| **P1** | Customers page | Detail modal + order history drill-down; export CSV; tier filter functional |
| **P1** | Orders page | Audit log table (new Prisma model `OrderStatusHistory` + API + UI); email trigger buttons; print invoice |
| **P1** | Stock adjustment | UI + history for `trackInventory` products (in/out with reason) |
| **P1** | Category management | Full CRUD (Pass 3) accessible from Products page |
| **P2** | Export CSV | Orders, Customers, Products, Custom Requests |
| **P2** | Payment gateway settings | Stripe, SSLCommerz, bKash, Nagad keys in Settings → Payments tab |
| **P2** | SMTP / Webhook / API Keys settings | New tabs in Settings |
| **P3** | Real-time updates | Socket.io integration for dashboard/orders/custom-requests |
| **P3** | Custom request revision workflow + direct order creation | |

### Pass 5 — Visual Polish + Regression Gates
| Step | Description |
|------|-------------|
| 5.1 | Add additive regression gate: `tests/unit/dead-utilities.test.ts` (already exists) + new test for no-dead-classes in admin components |
| 5.2 | `pnpm verify` full pass |
| 5.3 | Visual QA: shop page, admin categories, auth split, brand uppercase |
| 5.4 | Commit with documented exceptions (auth config, middleware) |

---

## 8. Open Questions for Owner

1. **Badge illustrations**: Lucide `Truck`/`Shield`/`Sparkles` acceptable for the 3 hero badges?
2. **Category icon picker**: Lucide modal (searchable) — acceptable? (No emoji per project rule.)
3. **Logo per-letter colors**: Please provide 8–9 hex values from `public/images/bioscope-logo.png` (left-to-right Bengali glyphs) for `tokens/src/color.json`.
4. **Auth split exception**: Approve touching `src/auth.config.ts` + `src/middleware.ts` (frozen §7) for login path separation?
5. **Admin bootstrap**: `instrumentation.ts` at repo root (Next.js convention) — approved?
6. **Admin panel scope**: Wire all dead filter UI (customers Spend/Min-Orders/Date, Settings logo/favicon upload, Analytics export) — feature work, not repair. Approve P1/P2 items?

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Auth config/middleware changes break existing sessions | Medium | High | Test with both customer + admin flows; document exception; deploy with session migration |
| `instrumentation.ts` runs on every server start (serverless cold starts) | High | Low | Make bootstrap idempotent: `findUnique` before `create`; negligible overhead |
| Category image upload — Cloudinary folder whitelist mismatch | Low | Medium | Reuse existing `cloudinary.ts` folder config; test upload |
| Lucide icon picker modal performance (64+ icons) | Low | Low | Virtualized grid or simple CSS grid; 64 items is trivial |
| Admin panel P0 fixes touch frozen `src/lib/actions/**` | Medium | High | Only `ProductForm` (component) + `SettingsForm` (component) + new `/api/analytics` routes (new) — no action edits |
| Per-letter colors from PNG — designer delay | Medium | Medium | Ship with placeholder palette; swap when designer delivers |

---

## 10. Definition of Done

- [ ] All Pass 1–5 steps implemented and committed
- [ ] `pnpm verify` passes (type-check, lint, 255+ tests, build, detect-changes — with documented auth-config exception)
- [ ] Visual QA: `/shop` (hero, badges, search/sort, category grid), `/admin/categories` (CRUD, icon picker, image upload), `/login` (customer only), `/admin/login` (admin only), `BIOSCOPE` uppercase everywhere
- [ ] Admin panel: all 7 routes feature-complete per audit table (P0 done, P1/P2 tracked)
- [ ] Docs updated: `docs/superpowers/plans/2026-11-15-shop-admin-auth-overhaul-tasks.md` (progress tracker), this spec

---

*End of design spec. Next step: invoke `superpowers:writing-plans` to create the implementation plan with task breakdown.*