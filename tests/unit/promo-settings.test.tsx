// @vitest-environment jsdom
//
// E4 — admin PromoSettings: lists promo_* settings, creates via PUT
// /api/settings/[key] with the JSON {type,value} envelope, deletes via DELETE.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }))

import { PromoSettings } from '@/components/admin/PromoSettings'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mocks.fetch)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia ?? ((q: string) => ({
    matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  // initial load: one existing promo + a non-promo setting (must be filtered out)
  mocks.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { settings: { promo_SAVE10: { type: 'percent', value: 10 }, global_tax_percent: 5 } } }),
  } as Response)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('PromoSettings', () => {
  it('lists promo_* settings and filters out non-promo keys', async () => {
    render(<PromoSettings />)
    expect(await screen.findByText('SAVE10')).toBeInTheDocument()
    expect(screen.getByText('10% off')).toBeInTheDocument()
    expect(screen.queryByText(/global_tax_percent/)).not.toBeInTheDocument()
  })

  it('creates a code via PUT with the JSON {type,value} envelope', async () => {
    render(<PromoSettings />)
    await screen.findByText('SAVE10')
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { settings: {} } }) } as Response)
    fireEvent.change(screen.getByLabelText(/^code/i), { target: { value: 'new code!' } })
    fireEvent.change(screen.getByLabelText(/percent off/i), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith(
      '/api/settings/promo_NEWCODE',
      expect.objectContaining({ method: 'PUT' }),
    ))
    const body = JSON.parse(mocks.fetch.mock.calls.find((c) => String(c[0]).includes('promo_NEWCODE'))![1].body)
    expect(body).toMatchObject({ type: 'JSON', category: 'PROMOTIONS', isPublic: false })
    expect(JSON.parse(body.value)).toEqual({ type: 'percent', value: 15 })
    expect(mocks.toastSuccess).toHaveBeenCalled()
  })

  it('rejects percent > 100 without a request', async () => {
    render(<PromoSettings />)
    await screen.findByText('SAVE10')
    const callsBefore = mocks.fetch.mock.calls.length
    fireEvent.change(screen.getByLabelText(/^code/i), { target: { value: 'BIG' } })
    fireEvent.change(screen.getByLabelText(/percent off/i), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot exceed 100/i)
    expect(mocks.fetch.mock.calls.length).toBe(callsBefore)
  })

  it('deletes a code via DELETE', async () => {
    render(<PromoSettings />)
    await screen.findByText('SAVE10')
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { settings: {} } }) } as Response)
    fireEvent.click(screen.getByRole('button', { name: /delete promo SAVE10/i }))
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/settings/promo_SAVE10', expect.objectContaining({ method: 'DELETE' })))
    expect(mocks.toastSuccess).toHaveBeenCalled()
  })
})
