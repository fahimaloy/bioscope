// Shared CSV cell escaping for every admin export.
//
// Two jobs: RFC4180 quoting, and neutralising spreadsheet formula injection.
// A cell beginning with = + - @ (or a tab/CR) is executed as a formula by Excel
// and Sheets when an admin opens the file — and some of these cells carry
// customer-supplied text (order notes, shipping name), so the payload source is
// not trusted. Prefixing a single quote makes the cell literal.

const FORMULA_PREFIX = /^[=+\-@\t\r]/

/** Quote a value when it contains a separator, a quote or a newline. */
export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value)
  const safe = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`
  return safe
}

/** Join already-escaped cells into a row. */
export function toCsvLine(values: unknown[]): string {
  return values.map(escapeCsvCell).join(',')
}
