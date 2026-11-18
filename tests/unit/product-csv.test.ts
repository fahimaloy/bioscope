import { describe, it, expect } from 'vitest'
import {
  PRODUCT_CSV_HEADERS,
  parseCsv,
  parseProductsCsv,
  parseBoolean,
  productsToCsv,
} from '@/lib/product-csv'

const DIMENSIONS = JSON.stringify([{ width: 5, height: 5, label: '5x5cm', priceMultiplier: 1, isDefault: true, sortOrder: 0 }])
const QUANTITIES = JSON.stringify([{ minQty: 1, maxQty: 10, pricePerUnit: 200, label: 'Standard', sortOrder: 0 }])

function productRow(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    name: 'Vinyl Sticker',
    slug: 'vinyl-sticker',
    description: 'A sticker, with a comma, and a "quote"',
    basePrice: '200',
    compareAtPrice: '280',
    categorySlug: 'stickers',
    images: 'https://example.com/a.png;https://example.com/b.png',
    dimensions: DIMENSIONS,
    quantities: QUANTITIES,
    taxPercent: '5',
    additionalCharge: '20',
    isTaxInclusive: 'false',
    trackInventory: 'true',
    stock: '42',
    lowStockThreshold: '5',
    isActive: 'true',
    isFeatured: 'false',
    sortOrder: '0',
    metaTitle: '',
    metaDescription: '',
    ...overrides,
  }
}

function csvDoc(overrides: Record<string, string> = {}): string {
  return productsToCsv([productRow(overrides)])
}

describe('parseCsv', () => {
  it('splits on commas', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
  })

  it('honours quoted cells containing commas and escaped quotes', () => {
    expect(parseCsv('"a,b","he said ""hi"""')).toEqual([['a,b', 'he said "hi"']])
  })

  it('keeps embedded newlines inside quotes', () => {
    expect(parseCsv('"line1\nline2",b')).toEqual([['line1\nline2', 'b']])
  })
})

describe('productsToCsv', () => {
  it('quotes cells that need it', () => {
    const csv = productsToCsv([{ name: 'A, "B"' }])
    expect(csv.split('\n')[1]).toContain('"A, ""B"""')
  })
})

describe('parseProductsCsv', () => {
  it('round-trips a serialised product', () => {
    const exported = productsToCsv([
      {
        name: 'Vinyl Sticker',
        slug: 'vinyl-sticker',
        basePrice: '200',
        categorySlug: 'stickers',
        images: 'https://example.com/a.png',
        dimensions: DIMENSIONS,
        quantities: QUANTITIES,
        taxPercent: '5',
        additionalCharge: '20',
        isTaxInclusive: 'false',
        trackInventory: 'true',
        stock: '42',
        lowStockThreshold: '5',
        isActive: 'true',
        isFeatured: 'false',
        sortOrder: '0',
      },
    ])
    const { rows, errors } = parseProductsCsv(exported)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      name: 'Vinyl Sticker',
      slug: 'vinyl-sticker',
      basePrice: 200,
      categorySlug: 'stickers',
      images: ['https://example.com/a.png'],
      stock: 42,
      trackInventory: true,
    })
  })

  it('parses a row with commas, quotes and semicolon-separated images', () => {
    const { rows, errors } = parseProductsCsv(csvDoc())
    expect(errors).toEqual([])
    expect(rows).toHaveLength(1)
    expect(rows[0].description).toBe('A sticker, with a comma, and a "quote"')
    expect(rows[0].images).toHaveLength(2)
    expect(rows[0].dimensions).toHaveLength(1)
    expect(rows[0].quantities[0]).toMatchObject({ minQty: 1, maxQty: 10, pricePerUnit: 200 })
  })

  it('reports a missing header column', () => {
    const { errors } = parseProductsCsv('name,slug\nA,b')
    expect(errors[0].reason).toContain('missing column')
  })

  it('skips rows without images or with malformed JSON columns', () => {
    const noImages = parseProductsCsv(csvDoc({ images: '' }))
    expect(noImages.errors[0].reason).toContain('image')

    const badDimensions = parseProductsCsv(csvDoc({ dimensions: '{not json' }))
    expect(badDimensions.errors[0].reason).toContain('dimensions')

    const emptyQuantities = parseProductsCsv(csvDoc({ quantities: '[]' }))
    expect(emptyQuantities.errors[0].reason).toContain('quantities')
  })

  it('flags a missing name/slug with the spreadsheet row number', () => {
    const { errors } = parseProductsCsv(csvDoc({ name: '' }))
    expect(errors[0].row).toBe(2)
    expect(errors[0].reason).toContain('name and slug')
  })

  it('ignores a trailing blank line', () => {
    const { rows, errors } = parseProductsCsv(`${csvDoc()}\n`)
    expect(rows).toHaveLength(1)
    expect(errors).toEqual([])
  })
})

describe('parseBoolean', () => {
  it('accepts the truthy spellings and falls back otherwise', () => {
    expect(parseBoolean('true', false)).toBe(true)
    expect(parseBoolean('YES', false)).toBe(true)
    expect(parseBoolean('1', false)).toBe(true)
    expect(parseBoolean('false', true)).toBe(false)
    expect(parseBoolean('', true)).toBe(true)
  })
})
