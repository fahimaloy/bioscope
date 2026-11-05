# TASKS — progress tracker

Legend: [x] done+verified · [~] in progress · [ ] todo. tsc: 334 → 180 errors after Phase 1 (2026-11-01). Tests: 37/37 green.

## P0 — Tooling & pre-setup
- [x] P0-01 git init (.env ignored, no commits)
- [x] P0-02 .gitignore no longer excludes tests
- [x] P0-03 AGENTS.md, .editorconfig, .github/workflows/ci.yml
- [x] P0-04 vitest config + tests/unit/{pricing,order-status,utils,validations}.test.ts — `pnpm test:run` green
- [x] P0-05 playwright config + e2e/smoke.spec.ts
- [x] P0-06 docs rewritten (AUDIT_REPORT/PLAN/TASKS); stale plans removed

## P1 — Server core & security (verified)
- [x] P1-01 adapter 500 fix → session 200 null, /shop 200 (curl)
- [x] P1-02 syntax fixes: TaxConfig, NotificationList, DeliveryConfig, cloudinary.ts:109
- [x] P1-03 admin import fixes + SettingsForm merge-patch
- [x] P1-04 middleware.ts + auth.config.ts (edge-safe); /admin admin-only, /checkout /profile /orders /custom-sticker login-only
- [x] P1-05 lib/api-utils.ts (AppError, handleRouteError, requireUser/requireAdmin, pagination)
- [x] P1-06 actions/order.ts rewrite (createOrder txn+pricing+promo+retry; transitions; bulk; cancel+restock; pagination)
- [x] P1-07 actions/product.ts hardened (admin checks, txn, whitelists, delete guard, low-stock)
- [x] P1-08 actions/customRequest.ts hardened (settings enforcement, socket, pagination)
- [x] P1-09 actions/settings.ts hardened (non-public admin-only, getPricingSettings)
- [x] P1-10 lib/pricing.ts + lib/order-status.ts (unit tested)
- [x] P1-11 socket bridge (server/socket-emit.ts, /emit+/health, /api/socket/token, useSocket token fetch)
- [x] P1-12 ~30 API routes (cart, addresses, reviews, orders, products, categories, settings, custom-requests, notifications, user/me, auth, contact)
- [x] P1-13 PasswordResetToken model + db push + generate; PG role synced; seeded
- [x] P1-14 seed hardening; .env.example scrubbed; placeholder svg
- [x] P1-15 CSP/Permissions-Policy; metadataBase; Toaster fix; types React namespace; SessionUser+JWT phone
- [x] P1-16 lib/index.ts barrel fixed; dead design-tokens.ts deleted

## P2 — Customer flows (deleg_c022a9e8 running)
- [~] P2-01 primitives/animations/hooks/stores fixes (sa-0)
- [~] P2-02 cart store + /api/cart + checkout + add-to-cart (sa-1)
- [~] P2-03 custom-sticker builder (sa-2)
- [~] P2-04 customer pages + product/layout components (sa-4)

## P3 — Admin
- [x] P3-01 /admin pages on real actions (settings wired to /api/settings + /api/settings/bulk; other admin pages already on real APIs)

## P4 — Theming/polish/a11y/mobile
- [x] P4-01 hex → CSS vars sweep (semantic vars added; 12 extra-palette hex remain)
- [x] P4-02 mobile vs desktop layouts, touch targets (>=44px, responsive)
- [x] P4-03 drawer/dialog a11y, labels/alt/aria, focus mgmt
- [x] P4-04 delete dead root prototype files (deleted index.html, styles.css, script.js)

## P5 — Final verification gate
- [x] P5-01 type-check → 0 · [x] P5-02 lint clean · [x] P5-03 tests green · [x] P5-04 build ok · [x] P5-05 e2e green (20/20)
- [ ] P5-06 curl smoke incl. /admin redirect + login→cart→checkout→order
- [ ] P5-07 full order E2E; verify notification + socket records


## Wave 2 (2026-11-01) — mock data removed, real API wiring
- shop page: real /api/products + /api/categories with server sort/pagination
- admin orders/customers/custom-requests/products/analytics/dashboard: real APIs (new admin-only GET /api/customers with order stats; /api/custom-requests/stats)
- admin product form wired to POST/PATCH/DELETE /api/products; order status + custom-request price/status wired to PATCH/POST routes
- custom-sticker "Request Quote" → /api/custom-requests/upload → /api/custom-requests
- gates: type-check 0, lint exit 0, tests 37/37, build 22/22; admin pages 307→/login logged-out, admin APIs 401
