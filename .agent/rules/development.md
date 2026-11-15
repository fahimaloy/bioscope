# Development rules
- Smallest coherent change; no unrelated refactoring.
- Server actions in `src/lib/actions/` — never trust client input; re-price server-side via `src/lib/pricing.ts`.
- API routes thin; wrap in try/catch → `handleRouteError` (ZodError→400, AppError→status, P2002→409 / P2025→404); respond via `ok()`/`created()`.
- Zod schemas in `src/lib/validations/*` — parse at every action/route edge.
- Pagination: `parsePagination` + `buildPagination`; whitelist `sortBy`.
- Server Components by default; `'use client'` only when needed.
- Errors thrown as `AppError(status, message, code)`.
