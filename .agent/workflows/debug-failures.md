# Workflow — debug failures
1. Reproduce in isolation — `pnpm exec vitest run <failing file>` (unit) or `pnpm e2e e2e/<spec>.spec.ts` (e2e).
2. Classify — regression (caused by this diff) vs pre-existing (baseline entry / fails on `main`).
3. Read the FIRST failing test only; do not fix cascading failures blindly.
4. Fix; rerun the smallest scope; max 3 iterations — then stop and escalate with the failure digest (test + traceback + agent's diff).
5. Never rerun an unchanged suite hoping for green; flaky test? quarantine + record in known-baseline-failures.md (with owner sign-off).
