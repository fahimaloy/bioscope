// @vitest-environment jsdom
/**
 * DataTable sorting (2026-11-19 review follow-up).
 *
 * Prisma Decimals arrive as JSON strings, so the old raw `<`/`>` comparator
 * sorted money lexicographically ("110.00" < "80.00"). The comparator must
 * coerce numeric strings, handle nulls deterministically, and fall back to
 * locale compare for text.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { DataTable, compareCellValues, type Column } from '@/components/ui/DataTable'

afterEach(cleanup)

describe('compareCellValues', () => {
  it('sorts serialized Decimal strings numerically, not lexicographically', () => {
    const values = ['1200.00', '1500.00', '80.00', '900.00']
    const sorted = [...values].sort(compareCellValues)
    expect(sorted).toEqual(['80.00', '900.00', '1200.00', '1500.00'])
  })

  it('compares plain numbers numerically', () => {
    expect(compareCellValues(2, 10)).toBeLessThan(0)
    expect(compareCellValues(10, 2)).toBeGreaterThan(0)
    expect(compareCellValues(7, 7)).toBe(0)
  })

  it('sorts null and undefined first, deterministically', () => {
    expect(compareCellValues(null, '5')).toBeLessThan(0)
    expect(compareCellValues(undefined, '5')).toBeLessThan(0)
    expect(compareCellValues('5', null)).toBeGreaterThan(0)
    expect(compareCellValues(null, null)).toBe(0)
  })

  it('falls back to locale compare for non-numeric text', () => {
    expect(compareCellValues('apple', 'banana')).toBeLessThan(0)
    expect(compareCellValues('banana', 'apple')).toBeGreaterThan(0)
  })

  it('does not treat empty strings as zero', () => {
    // Numeric coercion would make '' === '0' (both 0); as text, '' sorts first.
    expect(compareCellValues('', '0')).toBeLessThan(0)
    expect(compareCellValues('', '')).toBe(0)
  })

  it('sorts ISO date strings chronologically', () => {
    const dates = ['2026-03-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z']
    expect([...dates].sort(compareCellValues)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
    ])
  })
})

describe('DataTable rendered sorting', () => {
  interface Row {
    id: string
    total: string
  }
  const columns: Column<Row>[] = [
    { key: 'id', header: 'Order' },
    { key: 'total', header: 'Total', sortable: true },
  ]
  const rows: Row[] = [
    { id: 'A', total: '1200.00' },
    { id: 'B', total: '80.00' },
    { id: 'C', total: '900.00' },
  ]

  function rowOrder(): string[] {
    // Body rows in render order; each row's first cell is the order id.
    const bodyRows = document.querySelectorAll('tbody tr')
    return Array.from(bodyRows).map((tr) => tr.querySelector('td')?.textContent ?? '')
  }

  it('sorts a money column numerically when the header is clicked', () => {
    render(
      <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} />
    )
    fireEvent.click(screen.getByText('Total'))
    expect(rowOrder()).toEqual(['B', 'C', 'A'])
    fireEvent.click(screen.getByText('Total'))
    expect(rowOrder()).toEqual(['A', 'C', 'B'])
  })

  it('does not mutate the input array when sorting', () => {
    const input = [...rows]
    render(<DataTable columns={columns} data={input} keyExtractor={(r) => r.id} />)
    fireEvent.click(screen.getByText('Total'))
    expect(input.map((r) => r.id)).toEqual(['A', 'B', 'C'])
  })
})
