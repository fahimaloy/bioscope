// @vitest-environment jsdom
//
// E10 — ProductSearchBox: debounced suggestions (one fetch per pause, not per
// keystroke), keyboard navigation (Arrow/Enter/Escape), clear button, honest
// empty state, recent searches.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const mocks = vi.hoisted(() => ({ push: vi.fn(), fetch: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))

import { ProductSearchBox } from '@/components/product/ProductSearchBox'

const products = [
  { id: 'p1', slug: 'sparkle-stickers', name: 'Sparkle Stickers', images: [], basePrice: 200 },
  { id: 'p2', slug: 'kraft-labels', name: 'Kraft Labels', images: [], basePrice: 150 },
]
const okResponse = (data: unknown[]) => ({ ok: true, json: async () => ({ success: true, data: { data } }) } as Response)

function Controlled() {
  const [value, setValue] = useState('')
  return <ProductSearchBox value={value} onChange={setValue} />
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.stubGlobal('fetch', mocks.fetch)
  mocks.fetch.mockResolvedValue(okResponse(products))
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('ProductSearchBox', () => {
  it('debounces — rapid keystrokes produce a single fetch for the final query', async () => {
    render(<Controlled />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 's' } })
    fireEvent.change(input, { target: { value: 'sp' } })
    fireEvent.change(input, { target: { value: 'spark' } })
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1))
    expect(String(mocks.fetch.mock.calls[0][0])).toContain('search=spark')
  })

  it('renders suggestions and navigates on ArrowDown + Enter', async () => {
    render(<Controlled />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'spark' } })
    await screen.findByText('Sparkle Stickers')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mocks.push).toHaveBeenCalledWith('/shop/sparkle-stickers')
  })

  it('Escape closes the suggestion list', async () => {
    render(<Controlled />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'spark' } })
    await screen.findByText('Sparkle Stickers')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clear button empties the query', async () => {
    render(<Controlled />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'spark' } })
    await screen.findByText('Sparkle Stickers')
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }))
    expect(input).toHaveValue('')
  })

  it('shows an honest empty state when nothing matches', async () => {
    mocks.fetch.mockResolvedValue(okResponse([]))
    render(<Controlled />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzz' } })
    expect(await screen.findByText(/no stickers match/i)).toBeInTheDocument()
  })

  it('shows recent searches from localStorage when focused and empty', async () => {
    localStorage.setItem('bioscope-recent-searches', JSON.stringify(['vinyl', 'holographic']))
    render(<Controlled />)
    fireEvent.focus(screen.getByRole('combobox'))
    expect(await screen.findByText('vinyl')).toBeInTheDocument()
    expect(screen.getByText('holographic')).toBeInTheDocument()
  })
})
