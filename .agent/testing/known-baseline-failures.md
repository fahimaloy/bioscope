# Known baseline failures

_None._ As of 2026-11-15 (Phase 1 commit `eda3d17`), `pnpm test:run` is green: 25 unit test files (257 tests) — including this pass's additive `tests/unit/agent-harness.test.ts`.

Rules:
- An agent may **not** treat a failure as "pre-existing" without evidence. Verify it on the base branch first (`git stash && pnpm test:run -- <file>`) or match it against this file (when entries exist).
- When a failure is confirmed pre-existing, add it here with: test name, cause, since (commit), accepted? (owner decision), re-verify command.
- Re-verify every entry quarterly or when the test runner/config changes.

| Test | Cause | Since | Accepted | Re-verify with |
| --- | --- | --- | --- | --- |
| _(none)_ | | | | |
