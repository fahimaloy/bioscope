# Architecture (short map)
- `src/app/(customer)/*` — shop, product, cart, checkout, orders, profile, custom-sticker builder.
- `src/app/(admin)/admin/*` — dashboard, products, orders, customers, custom-requests, analytics, settings (+categories).
- `src/lib/actions/*` — public server actions (requireUser/requireAdmin; re-price server-side).
- `src/app/api/*` — thin route handlers; `handleRouteError` envelope `{success, data|error}`.
- `src/lib/` — pricing, order-status (canTransition), api-utils, auth (v5), cloudinary (folder whitelist), stores (zustand/cart), validations (zod).
- `src/middleware.ts` + `src/auth.config.ts` — edge-safe guard (shared); `src/lib/auth.ts` adds Credentials provider.
- `socket-server/` — standalone socket.io (separate tsconfig); `src/lib/server/socket-emit.ts` POST /emit with x-emit-secret; client via `/api/socket/token` JWT (`useSocket`).
- Theme: CSS vars in `globals.css` (single source) → tailwind.config.ts → `var(--…)`. Tokens: `tokens/src/*.json` → `pnpm tokens`.
- `tests/unit/` (vitest) · `e2e/` (playwright) · `.github/workflows/` (ci + nightly) · `docs/superpowers/plans/` (active plan: shop-admin-auth-overhaul-tasks.md).
Full gates + conventions: repo-root `AGENTS.md`.
