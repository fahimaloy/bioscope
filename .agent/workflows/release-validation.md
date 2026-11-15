# Workflow — release validation
Release verification ≠ task verification. Run only at release checkpoints:
1. `pnpm verify:full` (type-check + lint + test:run + build + e2e) — or CI on the release ref.
2. `pnpm verify` (5 gates incl. gitnexus detect-changes; VERIFY_SKIP_BUILD=1 only with explicit owner approval).
3. Nightly suite green on `main` (`.github/workflows/nightly.yml`).
4. Smoke the critical journeys: / → /shop → add to cart → COD checkout → /orders; admin: /admin/login → dashboard → orders → analytics.
5. Deploy; then post-deploy smoke (curl /api/health or equivalent) — evidence into the release notes.
