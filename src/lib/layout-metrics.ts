/**
 * Admin chrome geometry — the single source of truth for the vertical offset
 * between the fixed brand navbar and the admin content column.
 *
 * The admin top bar is `sticky top-16` (it sticks 64px below the viewport top,
 * directly under the 64px fixed navbar). A sticky element still occupies its
 * in-flow slot, so the content column must reserve that slot with `pt-16`;
 * otherwise the bar's slot starts at y=0, the bar paints at y=64–128, and it
 * covers the first 40px of the page body.
 *
 * `tests/unit/components/admin-sidebar.test.tsx` asserts the content column's
 * resolved top offset clears the bar, so these numbers cannot drift without a
 * test failure. Keep `src/app/(admin)/layout.tsx` and this file in sync.
 */

/** Height of the fixed brand navbar in `src/components/layout/Navbar.tsx` (`h-16`). */
export const NAVBAR_HEIGHT_PX = 64

/** Height of the admin top bar (`sticky top-16` + inner `h-16`). */
export const ADMIN_HEADER_HEIGHT_PX = 64

/** Where the admin page body starts: below the navbar and the sticky top bar. */
export const CONTENT_TOP_PX = NAVBAR_HEIGHT_PX + ADMIN_HEADER_HEIGHT_PX
