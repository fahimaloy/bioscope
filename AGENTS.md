# AGENTS.md — Sticker Shop (bioscope)

Next.js 14.2 (App Router) + Prisma/PostgreSQL + Tailwind + next-auth v5 (JWT + credentials) + socket.io standalone server + Cloudinary/Uploadthing uploads. pnpm only.

## Commands
- `pnpm dev` — Next dev on :3000 · `pnpm socket:dev` — socket server on :3001 (run both)
- `pnpm type-check` · `pnpm lint` · `pnpm test:run` (vitest, tests/unit) · `pnpm e2e` (playwright, e2e/)
- `pnpm db:push` / `pnpm db:seed` (seed is destructive: needs `SEED_CONFIRM=yes`, local DB only unless `SEED_ALLOW_REMOTE=1`)
- `pnpm build`

## Architecture rules
- **Server actions** (`src/lib/actions/*`) are public endpoints: every one must call `requireUser()` / `requireAdmin()` from `src/lib/api-utils.ts` itself. Never trust client prices — always re-price server-side with `src/lib/pricing.ts`.
- **API routes** (`src/app/api/*`) must wrap handlers in `try/catch` → `handleRouteError(error)` (maps ZodError→400 with field errors, AppError→its status, Prisma P2002→409/P2025→404). Use `ok()`/`created()` for success envelopes `{ success, data }`.
- **Auth**: `src/auth.config.ts` is edge-safe (no prisma) and shared with `src/middleware.ts`. `src/lib/auth.ts` adds the Credentials provider. Middleware matcher protects `/admin/*` (admin role), `/checkout`, `/profile`, `/orders`, `/custom-sticker`.
- **Realtime**: Next server emits via `src/lib/server/socket-emit.ts` (POST /emit to socket server with `x-emit-secret`). Client connects with a short-lived JWT from `/api/socket/token` (`useSocket` in `src/lib/socket.ts`).
- **Order status** changes only through `canTransition()` in `src/lib/order-status.ts`.
- **Uploads**: Cloudinary signed params are folder-whitelisted (`src/lib/cloudinary.ts`); Uploadthing route requires auth.
- **Theming**: CSS variables in `src/app/globals.css` are the single source of truth; Tailwind colors map to `var(--...)` in `tailwind.config.ts`. Never hardcode hex in components.
- **Secrets**: never commit `.env`; `.env.example` holds placeholders only. Seed credentials come from env or are randomly generated. Never log PII (emails, phones, tokens).

## Conventions
- Server Components by default; `'use client'` only when needed. Server actions in `src/lib/actions`, route handlers thin.
- Zod schemas in `src/lib/validations/*`; parse at the edge of every action/route.
- Pagination: `parsePagination(url)` + `buildPagination(page, limit, total)` (includes hasNext/hasPrev). Whitelist `sortBy` fields.
- Errors thrown as `AppError(status, message, code)`; routes convert via `handleRouteError`.
- Tests: unit tests for money math (pricing), state machines (order-status), utils, validations. E2E smoke in `e2e/smoke.spec.ts`.

## Layout map
- `src/app/(customer)/*` — shop, product, cart, checkout, orders, profile, custom-sticker builder
- `src/app/(admin)/admin/*` — dashboard, products, orders, customers, custom-requests, analytics, settings
- `src/components/*` — ui (primitives), layout, product, cart, checkout, custom-sticker, admin, animations
- `src/lib/stores/*` — zustand (cart is client-side localStorage; server cart API is source of truth at checkout)
- `socket-server/` — standalone socket.io server (separate tsconfig, `pnpm socket:dev`)

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **bioscope** (3708 symbols, 7140 relationships, 221 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only`. No `.gitnexus/run.cjs`? Bootstrap with `npx`, `bunx`, or `pnpm dlx`; e.g. `bunx gitnexus@latest analyze` (#1939).
> On query/context/impact/cypher object results, read staleness.status and branch/lastCommit. Re-analyze only for behind or diverged — current is clone HEAD, not main.

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers/processes/risk. Never substitute grep for graph analysis.
- **MUST analyze changes before commit.** Run `detect_changes({scope: "all"})` or `node .gitnexus/run.cjs detect-changes --scope all --repo .`. `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review, fetch target branch "main" from its remote; compute its merge base with the reviewed HEAD and pass that SHA to `detect_changes({scope: "compare", base_ref: "<merge-base SHA>"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "<merge-base SHA>" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` with `dry_run: true`, review semantic spans and coverage, then apply with `dry_run: false` and its `plan_token`.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/bioscope/context` | Codebase overview, check index freshness |
| `gitnexus://repo/bioscope/clusters` | All functional areas |
| `gitnexus://repo/bioscope/processes` | All execution flows |
| `gitnexus://repo/bioscope/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
