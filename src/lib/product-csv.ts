// Product CSV import/export.
//
// One row per product. `images` is a `;`-separated list; `dimensions` and
// `quantities` are JSON arrays (they are nested records, so a flat encoding
// would lose their shape). Rows are matched to existing products by slug, so
// re-importing a file updates rather than duplicates.

import type { CreateProductInput } from '@/lib/validations/product'
import { escapeCsvCell } from '@/lib/csv'

export const PRODUCT_CSV_HEADERS = [
  'name',
  'slug',
  'description',
  'basePrice',
  'compareAtPrice',
  'categorySlug',
  'images',
  'dimensions',
  'quantities',
  'taxPercent',
  'additionalCharge',
  'isTaxInclusive',
  'trackInventory',
  'stock',
  'lowStockThreshold',
  'isActive',
  'isFeatured',
  'sortOrder',
  'metaTitle',
  'metaDescription',
] as const

export interface ProductCsvRow {
  name: string
  slug: string
  description: string
  basePrice: string
  compareAtPrice: string
  categorySlug: string
  images: string
  dimensions: string
  quantities: string
  taxPercent: string
  additionalCharge: string
  isTaxInclusive: string
  trackInventory: string
  stock: string
  lowStockThreshold: string
  isActive: string
  isFeatured: string
  sortOrder: string
  metaTitle: string
  metaDescription: string
}

/** Quote a value when it contains a separator, a quote or a newline. */
function escapeCsv(value: string): string {
  return escapeCsvCell(value)
}

export function toCsvRow(values: string[]): string {
  return values.map(escapeCsv).join(',')
}

/** Serialize products into a CSV document. */
export function productsToCsv(rows: Partial<ProductCsvRow>[]): string {
  const lines = [PRODUCT_CSV_HEADERS.join(',')]
  for (const row of rows) {
    lines.push(PRODUCT_CSV_HEADERS.map((header) => escapeCsv(row[header] ?? '')).join(','))
  }
  return lines.join('\n')
}

/** Parse a CSV document into rows, honouring quoted cells and embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  const pushCell = () => {
    row.push(cell)
    cell = ''
  }
  const pushRow = () => {
    pushCell()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      pushCell()
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      pushRow()
    } else {
      cell += char
    }
  }
  if (cell !== '' || row.length > 0) pushRow()
  return rows
}

export interface ParsedProductRow {
  /** 1-based spreadsheet row, for error reporting. */
  row: number
  name: string
  slug: string
  description?: string
  basePrice: number
  compareAtPrice?: number
  categorySlug: string
  images: string[]
  dimensions: CreateProductInput['allowedDimensions']
  quantities: CreateProductInput['allowedQuantities']
  taxPercent: number
  additionalCharge: number
  isTaxInclusive: boolean
  trackInventory: boolean
  stock: number
  lowStockThreshold: number
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  metaTitle?: string
  metaDescription?: string
}

export interface ParsedProductsCsv {
  rows: ParsedProductRow[]
  errors: Array<{ row: number; reason: string }>
}

const BOOLEAN_TRUE = new Set(['true', '1', 'yes', 'y'])

export function parseBoolean(value: string, fallback: boolean): boolean {
  const normalized = value.trim().toLowerCase()
  if (normalized === '') return fallback
  return BOOLEAN_TRUE.has(normalized)
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseJsonArray(value: string): unknown[] | null {
  const trimmed = value.trim()
  if (!trimmed) return []
  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Turn a parsed CSV into product rows, collecting per-row problems. */
export function parseProductsCsv(text: string): ParsedProductsCsv {
  const table = parseCsv(text)
  const rows: ParsedProductRow[] = []
  const errors: ParsedProductsCsv['errors'] = []

  if (table.length === 0) {
    return { rows, errors: [{ row: 0, reason: 'the file is empty' }] }
  }

  const headers = table[0].map((header) => header.trim())
  const missing = PRODUCT_CSV_HEADERS.filter((header) => !headers.includes(header))
  if (missing.length > 0) {
    return { rows, errors: [{ row: 1, reason: `missing column(s): ${missing.join(', ')}` }] }
  }
  const indexOf = (header: string) => headers.indexOf(header)

  for (let line = 1; line < table.length; line += 1) {
    const cells = table[line]
    // Skip a trailing blank line rather than reporting it as an error.
    if (cells.length === 1 && cells[0].trim() === '') continue

    const get = (header: string) => (cells[indexOf(header)] ?? '').trim()
    const rowNumber = line + 1

    const name = get('name')
    const slug = get('slug')
    if (!name || !slug) {
      errors.push({ row: rowNumber, reason: 'name and slug are required' })
      continue
    }

    const images = get('images')
      .split(';')
      .map((url) => url.trim())
      .filter(Boolean)
    if (images.length === 0) {
      errors.push({ row: rowNumber, reason: 'at least one image is required' })
      continue
    }

    const dimensions = parseJsonArray(get('dimensions'))
    const quantities = parseJsonArray(get('quantities'))
    if (!dimensions || dimensions.length === 0) {
      errors.push({ row: rowNumber, reason: 'dimensions must be a non-empty JSON array' })
      continue
    }
    if (!quantities || quantities.length === 0) {
      errors.push({ row: rowNumber, reason: 'quantities must be a non-empty JSON array' })
      continue
    }

    rows.push({
      row: rowNumber,
      name,
      slug,
      description: get('description') || undefined,
      basePrice: parseNumber(get('basePrice'), Number.NaN),
      compareAtPrice: get('compareAtPrice') ? parseNumber(get('compareAtPrice'), Number.NaN) : undefined,
      categorySlug: get('categorySlug'),
      images,
      dimensions: dimensions as ParsedProductRow['dimensions'],
      quantities: quantities as ParsedProductRow['quantities'],
      taxPercent: parseNumber(get('taxPercent'), 0),
      additionalCharge: parseNumber(get('additionalCharge'), 0),
      isTaxInclusive: parseBoolean(get('isTaxInclusive'), false),
      trackInventory: parseBoolean(get('trackInventory'), false),
      stock: parseNumber(get('stock'), 0),
      lowStockThreshold: parseNumber(get('lowStockThreshold'), 10),
      isActive: parseBoolean(get('isActive'), true),
      isFeatured: parseBoolean(get('isFeatured'), false),
      sortOrder: parseNumber(get('sortOrder'), 0),
      metaTitle: get('metaTitle') || undefined,
      metaDescription: get('metaDescription') || undefined,
    })
  }

  return { rows, errors }
}
