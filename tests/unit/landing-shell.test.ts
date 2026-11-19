// C10 — landing shell: the landing page lives in the (customer) route group so
// mobile visitors get MobileNav (CartDrawer is already at the root layout).
// Structural guard against moving it back to src/app/page.tsx (which would drop
// the group layout) or re-adding a self-PageWrapper (double wrap → nested <main>,
// double pt-16 navbar offset, double grain). The behavioural proof (MobileNav
// visible on / at mobile width) is the browser measurement in the task report.
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

describe('landing shell (C10)', () => {
  it('landing page is in the (customer) group, not at the app root', () => {
    expect(existsSync('src/app/(customer)/page.tsx')).toBe(true)
    expect(existsSync('src/app/page.tsx')).toBe(false)
  })

  it('landing does not self-wrap PageWrapper (the group layout provides it)', () => {
    const src = readFileSync('src/app/(customer)/page.tsx', 'utf8')
    expect(src).not.toMatch(/import\s*\{[^}]*PageWrapper/)
    expect(src).not.toMatch(/<PageWrapper/)
  })

  it('the (customer) layout supplies PageWrapper + MobileNav', () => {
    const layout = readFileSync('src/app/(customer)/layout.tsx', 'utf8')
    expect(layout).toMatch(/PageWrapper/)
    expect(layout).toMatch(/MobileNav/)
  })
})
