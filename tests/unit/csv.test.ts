import { describe, it, expect } from 'vitest'
import { escapeCsvCell, toCsvLine } from '@/lib/csv'

describe('escapeCsvCell', () => {
  it('quotes separators, quotes and newlines (RFC4180)', () => {
    expect(escapeCsvCell('plain')).toBe('plain')
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('neutralises spreadsheet formula injection', () => {
    for (const payload of ['=1+1', '+1+1', '-1+1', '@SUM(A1)', '\t=cmd', '\r=cmd']) {
      const out = escapeCsvCell(payload)
      // The cell may be RFC4180-quoted; the neutralising quote must be first
      // inside any surrounding quotes.
      expect(out.replace(/^"/, '').startsWith("'")).toBe(true)
    }
  })

  it('leaves ordinary text that merely contains an equals sign alone', () => {
    expect(escapeCsvCell('width=5cm')).toBe('width=5cm')
  })

  it('renders null and undefined as empty', () => {
    expect(escapeCsvCell(null)).toBe('')
    expect(escapeCsvCell(undefined)).toBe('')
  })

  it('joins a row', () => {
    expect(toCsvLine(['a', 'b,c', '=x'])).toBe('a,"b,c",\'=x')
  })
})
