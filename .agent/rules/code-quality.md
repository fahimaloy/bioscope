# Code quality rules
- TypeScript strict; never `as any` to silence the compiler; justify casts with a comment.
- ESLint (`.eslintrc.json`) + Prettier (`.prettierrc`) — run `pnpm lint` / `pnpm format:check` before claiming done.
- No hardcoded hex in components — colors via CSS variables (`globals.css` is the single source of truth; tailwind maps to `var(--...)`).
- Design tokens edited only via `tokens/src/*.json` + `pnpm tokens`; never edit generated files by hand.
- No dead code, no commented-out blocks, no `console.log` left in app paths.
