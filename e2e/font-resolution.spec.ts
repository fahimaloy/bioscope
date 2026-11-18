import { test, expect, type Page } from '@playwright/test'

/**
 * Font Resolution E2E Test
 *
 * Verifies that resolveFontFamily() and semanticFontName() work correctly
 * in a real browser with next/font loaded families.
 *
 * FIXME: This test currently creates a new user on each run, polluting the DB.
 * It also has viewport/visibility issues with the custom-sticker page.
 * Marked as fixme until proper auth fixtures and page stability are established.
 * Unit tests for resolveHex, resolveFontFamily, semanticFontName pass.
 */
test.describe.configure({ retries: 0 })
test.describe('Custom Sticker Builder - Font Resolution', () => {
  // Viewport is configured in playwright.config.ts project settings
  test.use({ viewport: { width: 1280, height: 800 } })

  test.fixme('can add text layer and change font family', async ({ page }: { page: Page }) => {
    // FIXME: Requires proper auth fixture (see issue #XXX)
    // Test currently creates new user each run, polluting DB
    // TODO: Use authenticated storage state or test user fixture

    // 1. Add a text layer via LayerPanel - use data-testid
    const addTextButton = page.getByTestId('add-text-layer')
    await expect(addTextButton).toBeVisible({ timeout: 20000 })
    await addTextButton.click()

    // Wait for the layer to be added and the EditingTools to update
    await page.waitForTimeout(2000)

    // 2. Find the font family dropdown trigger
    const fontDropdownTrigger = page.locator('button:has-text("Outfit")').first()
    await expect(fontDropdownTrigger).toBeVisible({ timeout: 20000 })

    // 3. Open dropdown and select Shrikhand
    await fontDropdownTrigger.click()
    await page.waitForTimeout(1000)

    const shrikhandOption = page.getByRole('option', { name: 'Shrikhand' })
    await expect(shrikhandOption).toBeVisible({ timeout: 15000 })
    await shrikhandOption.click()

    // 4. Verify the dropdown now shows Shrikhand
    await expect(page.locator('button:has-text("Shrikhand")').first()).toBeVisible({ timeout: 15000 })

    // 5. Change back to Outfit
    await page.locator('button:has-text("Shrikhand")').first().click()
    await page.waitForTimeout(1000)
    const outfitOption = page.getByRole('option', { name: 'Outfit' })
    await expect(outfitOption).toBeVisible({ timeout: 15000 })
    await outfitOption.click()

    await expect(page.locator('button:has-text("Outfit")').first()).toBeVisible({ timeout: 15000 })
  })

  test.fixme('font resolution works for all semantic font options', async ({ page }: { page: Page }) => {
    // FIXME: Same auth issues as above
    // Add a text layer
    await page.getByTestId('add-text-layer').click()
    await page.waitForTimeout(2000)

    const fontFamilies = ['Outfit', 'Shrikhand']

    for (const font of fontFamilies) {
      const trigger = page.locator('button:has-text("Outfit"), button:has-text("Shrikhand")').first()
      await expect(trigger).toBeVisible({ timeout: 20000 })
      await trigger.click()
      await page.waitForTimeout(1000)

      const option = page.getByRole('option', { name: font })
      await expect(option).toBeVisible({ timeout: 15000 })
      await option.click()
      await page.waitForTimeout(1000)

      await expect(page.locator(`button:has-text("${font}")`).first()).toBeVisible({ timeout: 15000 })
    }
  })
})

test.describe('Custom Sticker Builder - Canvas Font Rendering', () => {
  test.fixme('canvas fabric object has resolved font family', async ({ page }: { page: Page }) => {
    // FIXME: Same auth issues as above
    // Add a text layer
    await page.getByTestId('add-text-layer').click()
    await page.waitForTimeout(2000)

    // Change to Shrikhand
    await page.locator('button:has-text("Outfit")').first().click()
    await page.waitForTimeout(1000)
    await page.getByRole('option', { name: 'Shrikhand' }).click()
    await page.waitForTimeout(2000)

    // Check the fabric canvas object for the resolved font family
    const fontFamilyOnCanvas = await page.evaluate(() => {
      const fabric = (window as unknown as { fabric?: { Canvas?: { getAll?: () => unknown[] } } }).fabric
      if (!fabric) return 'NO_FABRIC'

      const canvases = fabric.Canvas?.getAll ? fabric.Canvas.getAll() : []
      for (const c of canvases as Array<{ getObjects: () => unknown[] }>) {
        const objects = c.getObjects()
        const textObj = objects.find((obj: unknown): obj is { type?: string; fontFamily?: string } => { const o = obj as { type?: string }; return o.type === 'textbox' || o.type === 'i-text' })
        if (textObj) {
          return textObj.fontFamily ?? ''
        }
      }
      return 'NO_TEXT_OBJECT'
    })

    console.log('Font family on canvas:', fontFamilyOnCanvas)

    expect(fontFamilyOnCanvas).toBeTruthy()
    expect(fontFamilyOnCanvas).not.toBe('Shrikhand')
    expect(fontFamilyOnCanvas).not.toBe('NO_FABRIC')
    expect(fontFamilyOnCanvas).not.toBe('NO_TEXT_OBJECT')
    expect(fontFamilyOnCanvas).toMatch(/__Shrikhand_|__Outfit_/)
  })
})