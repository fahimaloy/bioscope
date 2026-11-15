# Testing rules
- Tiers: L0 static (type-check/lint) · L1 unit mapped to changed files (`pnpm verify:fast`) · L2 full unit suite (`pnpm verify:mid`) · L3 targeted E2E · L4 full regression + build (`pnpm verify:full`, CI nightly).
- Fail fast: inner loop stops at the first failing test; analyze it; max 3 fix iterations, then escalate with the failure digest.
- Map selection through `.agent/testing/test-map.yml`; shared-footprint files widen scope — never skip tests by filename alone.
- Boolean guard: "does this change cross a boundary or contract?" — if yes, you cannot finish on `verify:fast` alone.
- New unit tests are additive; do not weaken existing gates (`tests/unit/*` gates are hard gates).
