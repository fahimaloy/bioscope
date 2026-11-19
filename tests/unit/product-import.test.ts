/**
 * Product CSV import robustness (2026-11-19 review follow-up).
 *
 * The old find-then-write loop had two defects: a concurrent same-slug create
 * race (P2002) aborted the whole import, and any DB error mid-file aborted
 * the remaining rows with no report. Rows must be isolated, the create race
 * must converge to an update, and duplicate slugs in one file are reported.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  category: { findMany: vi.fn() },
  product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  revalidatePath: vi.fn(),
  emitLowStockAlert: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({
  prisma: { category: mocks.category, product: mocks.product },
}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/server/socket-emit', () => ({ emitLowStockAlert: mocks.emitLowStockAlert }))

import { importProductsFromCsv } from '@/lib/actions/product'
import { PRODUCT_CSV_HEADERS } from '@/lib/product-csv'

const ADMIN_SESSION = { user: { id: 'u-admin', email: 'admin@example.com', role: 'ADMIN' } }

const DIMENSIONS = JSON.stringify([
  { width: 4, height: 4, label: 'Small', priceMultiplier: 1, isDefault: true, sortOrder: 0 },
])
const QUANTITIES = JSON.stringify([
  { minQty: 1, maxQty: 10, pricePerUnit: 100, label: '1-10', sortOrder: 0 },
])

function csvRow(slug: string, name = 'Test Sticker'): string {
  const cells: Record<string, string> = {
    name,
    slug,
    description: 'A sticker',
    basePrice: '80',
    compareAtPrice: '',
    categorySlug: 'labels',
    images: 'https://cdn.example.com/sticker.png',
    dimensions: DIMENSIONS,
    quantities: QUANTITIES,
    taxPercent: '0',
    additionalCharge: '0',
    isTaxInclusive: 'false',
    trackInventory: 'false',
    stock: '0',
    lowStockThreshold: '10',
    isActive: 'true',
    isFeatured: 'false',
    sortOrder: '0',
    metaTitle: '',
    metaDescription: '',
  }
  // Quote cells containing commas/quotes (the JSON columns do).
  return PRODUCT_CSV_HEADERS.map((h) => {
    const value = cells[h] ?? ''
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }).join(',')
}

function csv(...rows: string[]): string {
  return [PRODUCT_CSV_HEADERS.join(','), ...rows].join('\n')
}

const CREATED_PRODUCT = { id: 'p-new', trackInventory: false, stock: 0, lowStockThreshold: 10 }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue(ADMIN_SESSION)
  mocks.category.findMany.mockResolvedValue([{ id: 'cat-1', slug: 'labels' }])
  mocks.product.findUnique.mockResolvedValue(null)
  mocks.product.create.mockResolvedValue(CREATED_PRODUCT)
  mocks.product.update.mockResolvedValue({ id: 'p1' })
})

describe('importProductsFromCsv', () => {
  it('creates a new product when the slug is unseen', async () => {
    const result = await importProductsFromCsv(csv(csvRow('new-sticker')))
    expect(result.created).toBe(1)
    expect(result.updated).toBe(0)
    expect(result.errors).toEqual([])
    expect(mocks.product.create).toHaveBeenCalledTimes(1)
  })

  it('updates an existing product with an atomic nested config replacement', async () => {
    mocks.product.findUnique.mockResolvedValue({ id: 'p1' })
    const result = await importProductsFromCsv(csv(csvRow('existing-sticker')))
    expect(result.updated).toBe(1)
    expect(result.created).toBe(0)
    const data = mocks.product.update.mock.calls[0][0].data
    expect(data.allowedDimensions.deleteMany).toEqual({})
    expect(data.allowedDimensions.create).toHaveLength(1)
    expect(data.allowedQuantities.deleteMany).toEqual({})
    expect(data.allowedQuantities.create).toHaveLength(1)
  })

  it('converges a lost create race (P2002) into an update instead of aborting', async () => {
    mocks.product.findUnique
      .mockResolvedValueOnce(null) // pre-check: unseen
      .mockResolvedValueOnce({ id: 'p-winner' }) // after P2002: the concurrent winner
    mocks.product.create.mockRejectedValue(Object.assign(new Error('Unique constraint'), { code: 'P2002' }))

    const result = await importProductsFromCsv(csv(csvRow('raced-sticker')))
    expect(result.created).toBe(0)
    expect(result.updated).toBe(1)
    expect(result.errors).toEqual([])
    expect(mocks.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p-winner' } })
    )
  })

  it('isolates a failing row and keeps importing the rest of the file', async () => {
    mocks.product.create
      .mockRejectedValueOnce(new Error('connection reset'))
      .mockResolvedValueOnce(CREATED_PRODUCT)

    const result = await importProductsFromCsv(csv(csvRow('bad-row'), csvRow('good-row')))
    expect(result.created).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(2)
    expect(result.errors[0].reason).toContain('database error')
  })

  it('reports a duplicate slug within the same file instead of overwriting', async () => {
    const result = await importProductsFromCsv(csv(csvRow('same-slug'), csvRow('same-slug', 'Other Name')))
    expect(result.created).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].row).toBe(3)
    expect(result.errors[0].reason).toContain('duplicate slug')
    expect(mocks.product.create).toHaveBeenCalledTimes(1)
  })

  it('reports a row that vanishes mid-import (P2025) without aborting', async () => {
    mocks.product.findUnique.mockResolvedValue({ id: 'p1' })
    mocks.product.update.mockRejectedValue(Object.assign(new Error('Record not found'), { code: 'P2025' }))
    const result = await importProductsFromCsv(csv(csvRow('vanishing-sticker')))
    expect(result.updated).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].reason).toContain('changed during import')
  })

  it('refuses files above the row cap without writing anything', async () => {
    const rows = Array.from({ length: 501 }, (_, i) => csvRow(`sticker-${i}`))
    const result = await importProductsFromCsv(csv(...rows))
    expect(result.created).toBe(0)
    expect(result.updated).toBe(0)
    expect(result.errors).toEqual([{ row: 0, reason: 'too many rows (max 500)' }])
    expect(mocks.product.create).not.toHaveBeenCalled()
  })
})
