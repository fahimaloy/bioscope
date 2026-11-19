// @vitest-environment jsdom
//
// E5 — useNotifications: fetch-on-mount syncs the store (correct after reload),
// the socket `notification:new` event adds live (no reload), and mark-read is
// persisted through the API (not just the local store).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  socketHandlers: {} as Record<string, (data: unknown) => void>,
}))

vi.mock('@/lib/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true, user: { id: 'u1' } }) }))
vi.mock('@/lib/socket', () => ({
  useSocket: () => ({
    on: (event: string, handler: (data: unknown) => void) => {
      mocks.socketHandlers[event] = handler
      return () => { delete mocks.socketHandlers[event] }
    },
  }),
}))

import { useNotifications } from '@/lib/hooks/useNotifications'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { NotificationBell } from '@/components/layout/NotificationBell'

function Probe() {
  const { markRead, markAllRead } = useNotifications()
  return (
    <>
      <button onClick={() => void markRead('n1')}>read-one</button>
      <button onClick={() => void markAllRead()}>read-all</button>
    </>
  )
}

const serverNotif = {
  id: 'n1', userId: 'u1', type: 'ORDER_STATUS_CHANGED', title: 'Order shipped',
  message: 'ORD-1 is on the way', data: { url: '/orders' }, isRead: false, readAt: null,
  createdAt: '2026-11-20T10:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.socketHandlers = {}
  useNotificationStore.setState({ notifications: [], unreadCount: 0, pendingOrdersCount: 0, pendingRequestsCount: 0, lowStockCount: 0 })
  vi.stubGlobal('fetch', mocks.fetch)
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { data: [serverNotif], unreadCount: 1 } }) } as Response)
  global.ResizeObserver = global.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia ?? ((q: string) => ({
    matches: false, media: q, onchange: null, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('useNotifications', () => {
  it('fetches the feed on mount and syncs the store', async () => {
    render(<Probe />)
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/notifications?limit=50', expect.objectContaining({ cache: 'no-store' })))
    await waitFor(() => expect(useNotificationStore.getState().notifications).toHaveLength(1))
    expect(useNotificationStore.getState().unreadCount).toBe(1)
    expect(useNotificationStore.getState().notifications[0].title).toBe('Order shipped')
  })

  it('adds a live notification from the socket event (no reload)', async () => {
    render(<Probe />)
    await waitFor(() => expect(mocks.socketHandlers['notification:new']).toBeTypeOf('function'))
    mocks.socketHandlers['notification:new']({ id: 'n2', type: 'WELCOME', title: 'Hi', message: 'Welcome', createdAt: '2026-11-20T11:00:00Z' })
    await waitFor(() => expect(useNotificationStore.getState().notifications.some((n) => n.id === 'n2')).toBe(true))
    expect(useNotificationStore.getState().unreadCount).toBe(2)
  })

  it('markRead persists via POST /api/notifications/[id]/read and updates the store', async () => {
    render(<Probe />)
    await waitFor(() => expect(useNotificationStore.getState().notifications).toHaveLength(1))
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) } as Response)
    fireEvent.click(screen.getByText('read-one'))
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/notifications/n1/read', expect.objectContaining({ method: 'POST' })))
    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true)
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it('markAllRead persists via POST /api/notifications/read-all', async () => {
    render(<Probe />)
    await waitFor(() => expect(useNotificationStore.getState().notifications).toHaveLength(1))
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { updated: 1 } }) } as Response)
    fireEvent.click(screen.getByText('read-all'))
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/notifications/read-all', expect.objectContaining({ method: 'POST' })))
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })
})

describe('NotificationBell', () => {
  it('shows the unread badge and opens the dropdown with the feed', async () => {
    render(<NotificationBell />)
    const bell = await screen.findByRole('button', { name: /1 unread notifications/i })
    fireEvent.click(bell)
    expect(await screen.findByText('Order shipped')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('renders an empty state when there are no notifications', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { data: [], unreadCount: 0 } }) } as Response)
    render(<NotificationBell />)
    const bell = await screen.findByRole('button', { name: /^notifications$/i })
    fireEvent.click(bell)
    expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument()
  })

  it('uses design tokens, not legacy bg-white/border-3', async () => {
    render(<NotificationBell />)
    const bell = await screen.findByRole('button', { name: /unread notifications/i })
    fireEvent.click(bell)
    const dropdown = await screen.findByText('Notifications')
    const panel = dropdown.closest('div.absolute') as HTMLElement
    expect(panel.className).toContain('var(--surface-raised)')
    expect(panel.className).not.toContain('bg-white')
    expect(panel.className).not.toContain('border-3')
  })
})
