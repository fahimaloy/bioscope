# Test strategy

## Frameworks
- **Unit/component:** vitest (`tests/unit/**/*.test.ts(x)`), node environment, `@` alias → `src/`, globals on, jsdom not required for current tests, `tests/setup.ts` for matchers.
- **E2E:** Playwright (`e2e/*.spec.ts`), chromium + mobile-chrome (Pixel 5); `webServer` boots `pnpm dev` (or prod with `PLAYWRIGHT_USE_PROD=1`); `baseURL` = `http://localhost:3000`.
- **CI:** `.github/workflows/ci.yml` gates PRs (type-check → lint → test:run → build). Nightly full suite: `.github/workflows/nightly.yml` (Pass 1.5).

## Tiers (agent contract — see AGENTS.md § Verification)
- `RUN_FAST_TESTS` = `pnpm verify:fast` → type-check + lint + unit tests mapped to changed files (`scripts/agent/verify.mjs`). Fail-fast. Seconds.
- `RUN_MID_TESTS` = `pnpm verify:mid` → fast + FULL unit suite (`pnpm test:run`). Run before declaring a task complete. Minute(s).
- `RUN_FULL_SUITE` = `pnpm verify:full` → mid + build + e2e. **CI/nightly/release only.** Agents must not run locally.

## Conventions
- Unit tests: money math (`pricing`), state machines (`order-status`), utils, validations, token pipeline gates (design-tokens / globals-tokens / text-contrast / tailwind-opacity / dead-utilities), component smoke (`components/providers`).
- Test-map: `.agent/testing/test-map.yml` is the selection source; shared-footprint files (`api-utils`, `prisma`, `utils`, pricing, tokens/globals.css, auth/middleware) widen scope.
- No DB required for unit tests. E2E hits a dev server and real endpoints; `e2e/smoke.spec.ts` asserts public pages + `/api/settings/public` + `/api/products?limit=5`.
- Never commit `.env`; unit tests must not read secrets; e2e uses seeded/local DB only.
- Baseline failures: see `known-baseline-failures.md` (currently none).

## Naming
- Files: `<subject>.test.ts(x)` mirroring the source module; e2e: `<journey>.spec.ts`.
