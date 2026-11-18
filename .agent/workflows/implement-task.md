# Workflow — implement a task
1. Task analysis — restate the requirement, acceptance criteria, affected modules; check `docs/superpowers/plans/*` for the canonical task entry.
2. Baseline inspection — `git status --porcelain` (unrelated dirty files? stop and ask), `pnpm test:run` for the suites you'll touch, check `.agent/testing/known-baseline-failures.md` (re-verify entries first).
3. Implementation plan — list files; smallest coherent diff; no drive-by refactoring.
4. Implementation — code; add/extend tests alongside.
5. Change-impact analysis — `node scripts/agent/verify.mjs plan --json`.
6. Verify — `pnpm verify:fast`; widen to `verify:mid` when boundaries/contracts/shared footprints are touched.
7. Final report — per `.agent/rules/verification-policy.md § Reporting`.
