# PLAN — bioscope rebuild

Goal: working, secure, tested e-commerce app for custom stickers (BD market, COD/bank transfer, BDT), Next.js best practices.

## Principles
1. Server-authoritative: prices, stock, status transitions, authz always re-checked server-side (`src/lib/pricing.ts`, `src/lib/order-status.ts`, `requireUser/requireAdmin`).
2. Edge-safe auth config (`src/auth.config.ts`) shared by handlers and `src/middleware.ts`; JWT sessions, no adapter.
3. Theming: CSS variables in `src/app/globals.css` only; Tailwind maps to `var(--...)`; no hex in components.
4. Tests for money math + state machines; e2e smoke for pages + auth guards; CI runs type-check, lint, tests, build.
5. Every wave verified: `pnpm type-check && pnpm lint && pnpm test:run && pnpm build` + curl smoke.

## Phases
- **Phase 0 — Tooling & agent pre-setup (DONE)**: git init; .gitignore fix; AGENTS.md; .editorconfig; vitest+playwright configs; CI; docs/; stale plans removed.
- **Phase 1 — Server core & security (DONE, verified)**: adapter 500 fix (curl-verified); 4 syntax fixes; middleware + auth.config; api-utils; actions/{order,product,customRequest,settings} rewrites; pricing.ts + order-status.ts; socket bridge + token route; ~30 API routes; PasswordResetToken + db push + seed; CSP/metadataBase; seed hardening + .env.example scrub; 37 unit tests green; DB seeded.
- **Phase 2 — Customer flows (IN PROGRESS)**: cart store + /api/cart sync; add-to-cart fixes; checkout validation + createOrder(items); custom-sticker builder (zoom, options, upload, preview, submit); home/shop/orders/profile/login/register/contact/about pages.
- **Phase 3 — Admin (IN PROGRESS)**: real data on all /admin pages; product CRUD form; order transitions UI; custom-request pricing; settings; analytics; dashboard.
- **Phase 4 — Theming/polish/a11y/mobile**: hex → CSS vars sweep; mobile/desktop layouts; touch targets; a11y labels; delete dead root prototype files after user confirm.
- **Phase 5 — Verification gate (PENDING)**: type-check 0, lint clean, tests green, build succeeds, e2e green, curl smoke incl. full order flow; TASKS.md updated.

## Out of scope / later
- Email provider wiring (settings exist; devToken flow in non-prod).
- Payment gateway (bKash etc.) — `transactionId` field ready.
- Pin Cloudinary remotePatterns to real cloud name in prod.
