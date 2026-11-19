// @vitest-environment jsdom
//
// B1 / rebuild task 2.8 — the profile page must render the REAL signed-in
// user, not the old hardcoded "John Doe", and every mutation must hit the
// real API with the real payload.
//
// fetch is stubbed with the actual route envelopes:
//   GET/PATCH /api/user/me        → ok({ user })          → data.user
//   POST      /api/addresses      → created({ address })  → data.address
//   PATCH     /api/addresses/[id] → ok({ address })       → data.address
//   DELETE    /api/addresses/[id] → ok({ message }) / 409 { code: 'IN_USE' }
//   POST /api/auth/change-password → ok({ message })
// A stub that mocks the page's assumption instead of the route's payload
// would prove nothing (ledger pitfall).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const mocks = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: mocks.toast }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import ProfilePage from '@/app/(customer)/profile/page'

const ADDRESS_1 = {
  id: 'a1',
  name: 'Fahim Tester',
  phone: '01700000000',
  addressLine1: 'House 12, Road 5',
  addressLine2: 'Dhanmondi',
  city: 'Dhaka',
  district: 'Dhaka',
  division: 'Dhaka',
  postalCode: '1205',
  country: 'Bangladesh',
  isDefault: true,
  deliveryZone: 'INSIDE_DHAKA',
}
const ADDRESS_2 = {
  ...ADDRESS_1,
  id: 'a2',
  name: 'Office',
  addressLine1: 'Level 4, Green Tower',
  addressLine2: null,
  postalCode: null,
  isDefault: false,
  deliveryZone: 'OUTSIDE_DHAKA',
}

const USER = {
  id: 'u1',
  email: 'fahim@example.com',
  name: 'Fahim Tester',
  role: 'CUSTOMER',
  phone: '01700000000',
  avatar: null,
  emailVerified: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  addresses: [ADDRESS_1, ADDRESS_2],
  _count: { orders: 3, customRequests: 2, reviews: 1 },
}

interface FetchCall {
  url: string
  method: string
  body?: unknown
}
let calls: FetchCall[] = []
let deleteResponse: { status: number; body: unknown } = {
  status: 200,
  body: { success: true, data: { message: 'Address deleted' } },
}
let meFailOnce = false

function envelopeFor(url: string, method: string, body?: unknown): { status: number; body: unknown } {
  if (url === '/api/user/me' && method === 'GET') {
    if (meFailOnce) {
      meFailOnce = false
      return { status: 500, body: { success: false, error: 'Internal server error' } }
    }
    return { status: 200, body: { success: true, data: { user: USER } } }
  }
  if (url === '/api/user/me' && method === 'PATCH') {
    return { status: 200, body: { success: true, data: { user: { ...USER, ...(body as object) } } } }
  }
  if (url === '/api/addresses' && method === 'POST') {
    return { status: 201, body: { success: true, data: { address: { ...ADDRESS_1, id: 'a-new', ...(body as object) } } } }
  }
  if (url.startsWith('/api/addresses/') && method === 'PATCH') {
    return { status: 200, body: { success: true, data: { address: { ...ADDRESS_1, ...(body as object) } } } }
  }
  if (url.startsWith('/api/addresses/') && method === 'DELETE') {
    return deleteResponse
  }
  if (url === '/api/auth/change-password' && method === 'POST') {
    return { status: 200, body: { success: true, data: { message: 'Password updated' } } }
  }
  return { status: 404, body: { success: false, error: `unexpected ${method} ${url}` } }
}

beforeEach(() => {
  calls = []
  meFailOnce = false
  deleteResponse = { status: 200, body: { success: true, data: { message: 'Address deleted' } } }
  // Radix measures with `ResizeObserver`/`IntersectionObserver` in layout effects;
  // jsdom has neither, so the page would throw before rendering.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const body = init?.body ? JSON.parse(init.body as string) : undefined
      calls.push({ url, method, body })
      const { status, body: responseBody } = envelopeFor(url, method, body)
      return new Response(JSON.stringify(responseBody), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    })
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function renderLoaded() {
  const utils = render(<ProfilePage />)
  await waitFor(() => expect(screen.getByText('Fahim Tester')).toBeInTheDocument())
  return utils
}

describe('profile page — real data', () => {
  it('renders the signed-in user from /api/user/me, never the old mock', async () => {
    const { container } = await renderLoaded()
    expect(screen.getByText('fahim@example.com')).toBeInTheDocument()
    expect(container.textContent).not.toContain('John Doe')
    expect(container.textContent).not.toContain('john@example.com')
    expect(calls[0]).toMatchObject({ url: '/api/user/me', method: 'GET' })
    // Real counts, not placeholders.
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
  })

  it('shows the error state with a working retry when the load fails', async () => {
    meFailOnce = true
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Could not load your profile')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByText('Fahim Tester')).toBeInTheDocument())
    expect(calls.filter((c) => c.url === '/api/user/me' && c.method === 'GET')).toHaveLength(2)
  })

  it('saves the profile through PATCH /api/user/me and shows the updated name', async () => {
    await renderLoaded()
    const nameInput = screen.getByLabelText('Full Name')
    fireEvent.change(nameInput, { target: { value: 'Fahim Updated' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/ }))
    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith('Profile updated'))
    const patch = calls.find((c) => c.url === '/api/user/me' && c.method === 'PATCH')
    expect(patch?.body).toMatchObject({ name: 'Fahim Updated' })
    await waitFor(() => expect(screen.getByText('Fahim Updated')).toBeInTheDocument())
  })
})

describe('profile page — addresses CRUD', () => {
  async function openAddressesTab() {
    await renderLoaded()
    fireEvent.click(screen.getByRole('tab', { name: /Addresses/ }))
    await waitFor(() => expect(screen.getByText('Saved Addresses')).toBeInTheDocument())
  }

  it('lists the real addresses with default and zone badges', async () => {
    await openAddressesTab()
    expect(screen.getByText(/House 12, Road 5/)).toBeInTheDocument()
    expect(screen.getByText(/Level 4, Green Tower/)).toBeInTheDocument()
    expect(screen.getByText('Default')).toBeInTheDocument()
    expect(screen.getByText('Inside Dhaka')).toBeInTheDocument()
    expect(screen.getByText('Outside Dhaka')).toBeInTheDocument()
  })

  it('adds an address through POST /api/addresses with the real schema payload', async () => {
    await openAddressesTab()
    fireEvent.click(screen.getByRole('button', { name: /Add New Address/ }))
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Place' } })
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '01811111111' } })
    fireEvent.change(screen.getByLabelText('Address Line 1'), { target: { value: 'House 9, Road 2' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Dhaka' } })
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Dhaka' } })
    fireEvent.click(screen.getByRole('button', { name: /Add Address/ }))
    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith('Address added'))
    const post = calls.find((c) => c.url === '/api/addresses' && c.method === 'POST')
    expect(post?.body).toMatchObject({
      name: 'New Place',
      phone: '01811111111',
      addressLine1: 'House 9, Road 2',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'Dhaka',
      country: 'Bangladesh',
      deliveryZone: 'INSIDE_DHAKA',
      isDefault: false,
    })
    // The list refreshes from the server after the mutation.
    expect(calls.filter((c) => c.url === '/api/user/me' && c.method === 'GET').length).toBeGreaterThanOrEqual(2)
  })

  it('rejects an invalid phone client-side before any request', async () => {
    await openAddressesTab()
    fireEvent.click(screen.getByRole('button', { name: /Add New Address/ }))
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Place' } })
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: 'not-a-phone' } })
    fireEvent.change(screen.getByLabelText('Address Line 1'), { target: { value: 'House 9, Road 2' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Dhaka' } })
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Dhaka' } })
    fireEvent.click(screen.getByRole('button', { name: /Add Address/ }))
    await waitFor(() => expect(screen.getByText(/valid phone number/i)).toBeInTheDocument())
    expect(calls.find((c) => c.url === '/api/addresses' && c.method === 'POST')).toBeUndefined()
  })

  it('sets the default through PATCH { isDefault: true }', async () => {
    await openAddressesTab()
    const setDefaults = screen.getAllByRole('button', { name: /Set Default/ })
    fireEvent.click(setDefaults[0])
    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith('Default address updated'))
    const patch = calls.find((c) => c.url === '/api/addresses/a2' && c.method === 'PATCH')
    expect(patch?.body).toEqual({ isDefault: true })
  })

  it('deletes through DELETE after an inline confirmation', async () => {
    await openAddressesTab()
    const deleteButtons = screen.getAllByRole('button', { name: /^Delete$/ })
    fireEvent.click(deleteButtons[1])
    expect(screen.getByText('Delete this address?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith('Address deleted'))
    expect(calls.find((c) => c.url === '/api/addresses/a2' && c.method === 'DELETE')).toBeTruthy()
  })

  it('surfaces the 409 IN_USE guard as a clear message', async () => {
    deleteResponse = {
      status: 409,
      body: { success: false, error: 'Address is used by existing orders and cannot be deleted', code: 'IN_USE' },
    }
    await openAddressesTab()
    const deleteButtons = screen.getAllByRole('button', { name: /^Delete$/ })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() =>
      expect(mocks.toast.error).toHaveBeenCalledWith('This address is used by existing orders and cannot be deleted')
    )
  })
})

describe('profile page — security', () => {
  async function openSecurityTab() {
    await renderLoaded()
    fireEvent.click(screen.getByRole('tab', { name: /Security/ }))
    await waitFor(() => expect(screen.getByText('Change Password')).toBeInTheDocument())
  }

  it('blocks mismatched confirmation before any request', async () => {
    await openSecurityTab()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass123' } })
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'different123' } })
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }))
    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeInTheDocument())
    expect(calls.find((c) => c.url === '/api/auth/change-password')).toBeUndefined()
  })

  it('posts only currentPassword/newPassword and confirms success', async () => {
    await openSecurityTab()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass123' } })
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }))
    await waitFor(() => expect(mocks.toast.success).toHaveBeenCalledWith('Password updated'))
    const post = calls.find((c) => c.url === '/api/auth/change-password')
    expect(post?.body).toEqual({ currentPassword: 'oldpass123', newPassword: 'newpass123' })
  })

  it('shows the server error when the current password is wrong', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET'
        calls.push({ url, method })
        if (url === '/api/user/me') {
          return new Response(JSON.stringify({ success: true, data: { user: USER } }), { status: 200 })
        }
        return new Response(
          JSON.stringify({ success: false, error: 'Current password is incorrect', code: 'WRONG_PASSWORD' }),
          { status: 400 }
        )
      })
    )
    await openSecurityTab()
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'wrongpass1' } })
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /Update Password/ }))
    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith('Current password is incorrect'))
  })
})

describe('profile page — token hygiene', () => {
  it('contains no legacy classes, undefined tokens, mock data or emoji', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/(customer)/profile/page.tsx'), 'utf8')
    for (const banned of [
      'mockUser',
      'John Doe',
      'text-primary',
      'bg-primary',
      'var(--primary)',
      'var(--light)',
      'var(--bg-color)',
      'rounded-input',
      'rounded-card',
      'shadow-btn',
      'border-3 ',
      'text-red-500',
      'DoodleBackground',
      '📦',
      '✕',
    ]) {
      expect(source, `banned pattern: ${banned}`).not.toContain(banned)
    }
  })
})
