# Security rules
- Every server action calls `requireUser()`/`requireAdmin()` from `src/lib/api-utils.ts` first.
- `src/auth.config.ts` stays edge-safe (no Prisma) and is shared with `src/middleware.ts`; role checks server-side always.
- Cloudinary signed params are folder-whitelisted (`src/lib/cloudinary.ts`); Uploadthing routes require auth.
- Secrets only in `.env` (never committed); `.env.example` holds placeholders; seed credentials from env or random.
- Never log PII (emails, phones, tokens); never leak stack traces to clients (AppError messages only).
- `pnpm db:seed` is destructive — local only unless `SEED_ALLOW_REMOTE=1`; never run against production.
