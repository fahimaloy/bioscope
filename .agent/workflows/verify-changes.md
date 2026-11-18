# Workflow — verify changes
1. `git diff --name-only HEAD` (+ untracked) — enumerate what changed.
2. `node scripts/agent/verify.mjs plan` — read the risk + selected checks.
3. `pnpm verify:fast` — L0 + mapped L1; fail-fast.
4. Escalate to `pnpm verify:mid` if: shared-footprint file changed, contract/boundary touched, or any L1 failure was ambiguous.
5. `pnpm verify:full` is CI/nightly/release-only; do not run locally unless the owner asks.
6. Report results verbatim — command lines + exit codes + what was skipped and why.
