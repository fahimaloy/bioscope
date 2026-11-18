# Agent Verification Policy

## General principle
Verification must be proportional to the scope, dependency impact, and risk of a change. Do not automatically run the entire test suite after every implementation task.

## Before verification
1. Inspect the actual changed files (`git diff --name-only HEAD` + untracked).
2. Identify affected modules (`.agent/testing/test-map.yml`).
3. Analyze relevant dependencies — shared-footprint files widen blast radius.
4. Determine change risk: low (docs/styles) → medium (one module) → high (shared client/schema/auth/money) → critical (CI/build/lockfile/infra).
5. Identify applicable tests (mapped unit; integration when boundaries/contracts are affected; E2E for affected journeys).
6. Prepare a plan — dry-run first: `node scripts/agent/verify.mjs plan --json`.

## Execution policy
- Inexpensive checks first: type-check, lint, format.
- Affected unit tests only (`pnpm verify:fast`).
- Broader suite when the change crosses boundaries or touches shared footprints (`pnpm verify:mid`).
- E2E only for changed user journeys; full regression at mandatory checkpoints (`pnpm verify:full`, CI nightly).

## Failure policy
- Classify failures **before** fixing. Distinguish pre-existing (see `.agent/testing/known-baseline-failures.md`) from regressions.
- Never repeatedly execute an unchanged failing suite.
- Rerun only the smallest relevant scope after a fix.
- Escalate verification when the change scope expands.
- Fail fast (`-x` / bail) in the inner loop; max 3 fix iterations, then stop and escalate with the failure digest (first failing test + traceback + agent's diff).

## Reporting
Always report: changed files · risk classification · checks executed · checks passed · checks failed · checks intentionally skipped (+ reason) · remaining limitations.
**Never claim that a test passed if it was not executed.**

## Task vs release verification
- **Task verified** — all verification requirements appropriate to this task have passed.
- **Release verified** — mandatory release-level checks (full suite + E2E + build) have passed. Only `pnpm verify:full` or CI can grant this.
Never describe focused tests as "release verified".
