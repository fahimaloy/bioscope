# .agent/ — agent operating manual

Single source of truth for how AI agents verify and change this repo.
Tool-specific adapters (opencode/Hermes/omp) add *discovery*, not *rules* — rules live here.

## Index
- `project-context.md` — what this project is (stack, commands, business).
- `architecture.md` — short system map; details in repo-root `AGENTS.md`.
- `rules/verification-policy.md` — **the** authority for testing decisions before, during, after changes.
- `rules/development.md`, `rules/testing.md`, `rules/code-quality.md`, `rules/security.md` — normative do/don't lists.
- `testing/test-strategy.md` — frameworks, tiers, CI wiring.
- `testing/test-map.yml` — changed-file → test selection map (used by `scripts/agent/verify.mjs`).
- `testing/test-inventory.json` — machine-readable inventory (25 unit files / 3 e2e specs).
- `testing/known-baseline-failures.md` — accepted pre-existing failures (currently none).
- `workflows/implement-task.md` · `verify-changes.md` · `debug-failures.md` · `release-validation.md` — normative procedures.

## Tier contract (summary)
| Tier | Command | Scope | When |
| --- | --- | --- | --- |
| Fast | `pnpm verify:fast` | type-check + lint + unit tests mapped to changed files | inner loop; freely |
| Mid | `pnpm verify:mid` | fast + full unit suite | before "done" |
| Full | `pnpm verify:full` | mid + build + e2e | CI / nightly / release only |
