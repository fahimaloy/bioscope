import { test, expect } from '@playwright/test'

test.describe('public pages', () => {
  test('home page loads', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    await expect(page).toHaveTitle(/bioscope/i)
  })

  test('shop page loads', async ({ page }) => {
    const res = await page.goto('/shop')
    expect(res?.status()).toBe(200)
  })

  test('login page loads', async ({ page }) => {
    const res = await page.goto('/login')
    expect(res?.status()).toBe(200)
  })

  test('session endpoint returns JSON null when logged out', async ({ request }) => {
    const res = await request.get('/api/auth/session')
    expect(res.status()).toBe(200)
    expect(await res.json()).toBeNull()
  })

  test('public settings endpoint works without auth', async ({ request }) => {
    const res = await request.get('/api/settings/public')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.site_currency).toBe('BDT')
  })

  test('products API lists active products', async ({ request }) => {
    const res = await request.get('/api/products?limit=5')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.data)).toBe(true)
  })
})

test.describe('auth guards', () => {
  test('admin area redirects anonymous users to login', async ({ page }) => {
    const res = await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' })
    // NextAuth authorized() returns false -> redirect to /login
    await page.waitForURL(/\/login/)
    expect(res?.status()).toBeLessThan(400)
  })

  test('checkout redirects anonymous users to login', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/\/login/)
  })

  test('cart API requires auth', async ({ request }) => {
    const res = await request.get('/api/cart')
    expect(res.status()).toBe(401)
  })

  test('product mutation requires admin', async ({ request }) => {
    const res = await request.post('/api/products', {
      data: { name: 'x', slug: 'x', basePrice: 1, categoryId: 'nope', images: [], allowedDimensions: [], allowedQuantities: [] },
    })
    expect([401, 403, 400]).toContain(res.status())
  })
})
