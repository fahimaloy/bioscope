import { test, expect, type Page } from '@playwright/test'

/**
 * Visual regression spec — Task 4.6
 *
 * Generates screenshot baselines for all key public pages across three
 * viewports (mobile 375, tablet 768, desktop 1280).
 *
 * BASELINE GENERATION:
 *   npx playwright test e2e/visual.spec.ts --update-snapshots
 *   git add e2e/visual.spec.ts-snapshots/
 *
 * Later runs compare against the stored baselines:
 *   npx playwright test e2e/visual.spec.ts
 *
 * NOTES:
 * - Auth-guarded pages (/profile, /orders, /checkout, /admin/*) redirect to
 *   /login when logged out, so their screenshots capture the login page.
 *   To capture their real content, run with an authenticated storage state:
 *     npx playwright test e2e/visual.spec.ts --project=chromium --update-snapshots
 *   (after adding a `storageState` fixture — see e2e/README)
 * - Animations are disabled in screenshots (doodle motion would otherwise make
 *   pixels non-deterministic).
 * - Baselines are NOT committed by this task; generate them on demand.
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const

type ViewportName = keyof typeof VIEWPORTS

const PAGES: Array<{ path: string; name: string }> = [
  { path: '/', name: 'home' },
  { path: '/shop', name: 'shop' },
  { path: '/shop/custom-logo-vinyl-sticker', name: 'product-detail' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/cart', name: 'cart' },
  { path: '/checkout', name: 'checkout' },
  { path: '/custom-sticker', name: 'custom-sticker' },
  { path: '/profile', name: 'profile' },
  { path: '/orders', name: 'orders' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/admin/dashboard', name: 'admin-dashboard' },
  { path: '/admin/products', name: 'admin-products' },
  { path: '/admin/orders', name: 'admin-orders' },
  { path: '/admin/custom-requests', name: 'admin-custom-requests' },
]

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  return errors
}

for (const [viewportName, viewport] of Object.entries(VIEWPORTS) as Array<
  [ViewportName, (typeof VIEWPORTS)[ViewportName]]
>) {
  test.describe(`visual regression — ${viewportName} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport })

    for (const { path, name } of PAGES) {
      test(name, async ({ page }) => {
        const errors = await collectConsoleErrors(page)
        const res = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        // Best-effort wait for network to settle; don't block on long-lived connections (HMR/socket.io)
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
        expect(res?.status()).toBeLessThan(500)
        // Wait for all images, fonts, and in-flight rendering to settle before capturing.
        await page.waitForFunction(
          () => Array.from(document.images).every((img) => img.complete),
          undefined,
          { timeout: 15_000 },
        ).catch(() => {})
        await page.evaluate(() => document.fonts?.ready.catch(() => undefined)).catch(() => {})
        await page.waitForTimeout(1_000)
        await expect(page).toHaveScreenshot(`${name}-${viewportName}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.02,
          animations: 'disabled',
          caret: 'hide',
          timeout: 30_000,
        })
        expect(errors).toEqual([])
      })
    }
  })
}
