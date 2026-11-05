# AUDIT REPORT — bioscope (Sticker Shop)

Date: 2026-11-01 · Method: full source read + 3 parallel read-only audit subagents + `tsc --noEmit` + live curl smoke tests against `next dev`.

## Verdict

Well-structured skeleton with a **fatal auth bug**, **334 type errors**, **unauthenticated server actions**, a **cart/checkout flow that could never succeed**, a **stub custom-sticker builder**, **no middleware**, **no tests/CI/git**, and **duplicated hardcoded theming**. Server core rebuilt and verified; UI waves in progress (see TASKS.md).

## Build blockers (fixed & verified live)

| # | Issue | Fix | Verification |
|---|-------|-----|--------------|
| 1 | `src/lib/auth.ts` imported `@auth/prisma-adapter` (not installed) → 500 on every `/api/auth/*` and any page touching auth | Removed adapter (unused under JWT + credentials) | `curl /api/auth/session` → 200 `null`; `/shop` → 200; 0 "Module not found" |
| 2 | Syntax-broken files: `admin/TaxConfig.tsx` (missing `}` ~232), `admin/NotificationList.tsx` (~339), `admin/DeliveryConfig.tsx` (truncated fragment), `lib/cloudinary.ts:109` (corrupted literal token) | Patched/rewrote all four; cloudinary reads from `process.env` | tsc 334 → 180 and falling |
| 3 | Missing-name imports in 5 admin pages (`Select`, `Tabs*`, `Users`, `CheckCircle`) | Import patches | tsc |
| 4 | `SettingsForm` passed `setState` directly to child configs, dropping partial patches | Merge-patch updater | tsc |

## Security (fixed in server wave)

- **Unauthenticated mutations**: all server actions in `src/lib/actions/product.ts` were callable by anyone (CRITICAL). Now every mutation calls `requireAdmin()`; reads call `requireUser()` and scope by `userId`; `src/lib/api-utils.ts` provides `AppError`/`requireUser`/`requireAdmin`/`handleRouteError` (Zod→400 with field errors, P2002→409, P2025→404).
- **No middleware**: added `src/middleware.ts` + edge-safe `src/auth.config.ts` (no prisma in edge bundle). `/admin/*` requires ADMIN; `/checkout`, `/profile`, `/orders`, `/custom-sticker` require login; logged-in users redirected away from `/login`/`/register`.
- **Settings leak**: `getSetting`/`getSettingByCategory` returned non-public settings (SMTP creds) to anyone → now admin-only.
- **Secrets**: real `.env` in repo root; `prisma/seed.ts` had hardcoded weak passwords and unconditional `deleteMany` on all tables. Seed now requires `SEED_CONFIRM=yes`, refuses non-local DBs without `SEED_ALLOW_REMOTE=1`, generates passwords (printed once) or takes env. `.env.example` scrubbed to placeholders; `.env` gitignored; repo git-initialized.
- **Cloudinary**: `getSignedUploadParams` enforces folder whitelist (`stickers/products/custom-requests/reviews/avatars`).
- **Headers**: CSP + `Permissions-Policy` added in `next.config.js` (dev-only `unsafe-eval`); `metadataBase` from `NEXTAUTH_URL` (was warning + hardcoded OG url).
- **Socket auth**: client sent non-existent `session.accessToken`; now `/api/socket/token` issues a 1h JWT (`NEXTAUTH_SECRET`, `{id,email,role}`) verified by `socket-server`; server→socket via authenticated `POST /emit` bridge (`x-emit-secret`) in `src/lib/server/socket-emit.ts`; `/health` added.
- **Password reset**: new `PasswordResetToken` model (sha256 tokens, 1h expiry, single-use) + forgot/reset routes; no account-existence leak (dev token only when `NODE_ENV !== 'production'`).
- **Registration**: role always CUSTOMER; duplicate email → 409; redundant custom signin route removed. **PII** no longer logged. **Mass-assignment** whitelisted in bulk updates. **Delete guards** (product with orders / address in use → 409).

## Core flows

- **Cart → checkout → order was impossible**: cart lived only in zustand/localStorage; `createOrder` read `prisma.cart` → always "Cart is empty". Now: server cart API (`/api/cart`, `/api/cart/[itemId]`) with server pricing + stock checks; `createOrder` accepts explicit `items` (validated + re-priced server-side via `src/lib/pricing.ts`) or falls back to server cart; transaction with conditional stock decrement, order-number retry, cart clear, promo codes, admin notifications + socket events. Checkout sends items and clears local cart on success.
- **Add-to-cart crash**: `ProductCard:200` / `ProductDetail:66` passed positional args instead of an item object → `calculateTotals` threw, NaN prices. Fixed in cart wave.
- **Order status**: `src/lib/order-status.ts` state machine enforced in `updateOrderStatus`/`bulkUpdateOrders`; cancel restocks; COD auto-PAID on DELIVERED.
- **Custom-sticker builder**: was all stubs (alert-only export, `selectedLayer={null}`, zoom buttons calling non-existent actions with hardcoded "100%", unused material/finish/cut, no API submit). Server now enforces public settings (enabled/min-qty/max-dim); UI rebuild in progress.

## Theming & UI quality

- 179 hardcoded hex vs unused `src/lib/constants/design-tokens.ts` (deleted; imported by 0 files) and tailwind colors duplicating `globals.css :root`. Decision: **CSS vars in `globals.css` are the single source of truth**; Tailwind maps to `var(--...)`. `darkMode:'class'` had zero `.dark` rules (no-op). Mobile gaps: builder 3-panel collapse, MobileNav overlap, CartDrawer semantics, ~24px touch targets. Seed demo Cloudinary URLs 404 → local `/images/sticker-placeholder.svg`. Legacy root prototype files (`index.html`, `styles.css`, `script.js`) are dead weight — deletion pending user confirm.

## Tooling (added)

- vitest config + setup + 4 unit suites (37 tests: pricing, order-status, utils, validations) — green.
- playwright config + `e2e/smoke.spec.ts` (public pages, auth guards, 401s).
- CI workflow (install → prisma generate → type-check → lint → test:run → build), AGENTS.md, .editorconfig, .gitignore fix, git init.
- DB: `password_reset_tokens` pushed; local PG role password synced to `.env`; seeded.

## Remaining risks

- UI type errors being fixed by parallel agents; final `pnpm build` gate pending.
- No email provider configured (password-reset devToken only outside production).
- Consider pinning Cloudinary `remotePatterns` to the real cloud name in prod.
