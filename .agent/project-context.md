# Project context
- **What:** BIOSCOPE — e-commerce storefront for custom stickers; Bangladesh market; BDT; COD-first; Next.js 14.2 (App Router) + Prisma/PostgreSQL + Tailwind + next-auth v5 (JWT + credentials) + socket.io standalone server (:3001) + Cloudinary/Uploadthing.
- **Package manager:** pnpm only. Node 22.
- **Key commands:** `pnpm dev` (+ `pnpm socket:dev`) · `pnpm type-check` · `pnpm lint` · `pnpm test:run` · `pnpm e2e` · `pnpm build` · `pnpm verify` (5-gate) · now also `pnpm verify:fast|verify:mid|verify:full`.
- **DB:** `pnpm db:push`; destructive `pnpm db:seed` (SEED_CONFIRM=yes, local-only).
- **Gates in CI:** type-check, lint, test:run, build (ci.yml) — nightly adds e2e via verify:full (nightly.yml).
- **Design:** tokens/*.json → style-dictionary → globals.css; never hardcode hex; tailwind maps to var(--…).
- **Auth:** admin split under `/admin/login` (rejects at `/login`); middleware matcher guards admin + checkout/profile/orders/custom-sticker.
