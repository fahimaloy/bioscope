'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { useSocket } from '@/lib/socket'
import type { Notification } from '@/types'

/**
 * E5 — customer notification feed. Fetches `/api/notifications` into the store
 * on mount (so the bell is correct after reload), subscribes to the user's
 * `notification:new` socket event (so a status change appears without reload),
 * and persists mark-read through the API (not just the local store). Mounted
 * once via NotificationBell in the authenticated customer Navbar.
 */
export function useNotifications() {
  const { isAuthenticated, user } = useAuth()
  const syncFromServer = useNotificationStore((s) => s.syncFromServer)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const markAsReadLocal = useNotificationStore((s) => s.markAsRead)
  const markAllAsReadLocal = useNotificationStore((s) => s.markAllAsRead)
  const { on } = useSocket()
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=50', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      const notifications = (json?.data?.data ?? []) as Notification[]
      syncFromServer({
        notifications,
        unreadCount: json?.data?.unreadCount ?? notifications.filter((n) => !n.isRead).length,
        pendingOrdersCount: 0,
        pendingRequestsCount: 0,
        lowStockCount: 0,
      })
    } catch {
      // Offline / transient — keep the persisted store; the socket may still deliver.
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, syncFromServer])

  // Fetch on mount / when auth changes.
  useEffect(() => {
    if (isAuthenticated) void refresh()
  }, [isAuthenticated, refresh])

  // Live delivery: a new notification for this user arrives over the socket.
  useEffect(() => {
    if (!isAuthenticated) return
    const off = on('notification:new', (data) => {
      addNotification({
        id: data.id,
        userId: user?.id ?? '',
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ?? null,
        isRead: false,
        readAt: null,
        createdAt: new Date(data.createdAt),
      })
    })
    return off
  }, [isAuthenticated, on, addNotification, user?.id])

  const markRead = useCallback(async (id: string) => {
    markAsReadLocal(id) // optimistic
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    } catch {
      // Persisted store keeps the optimistic state; next refresh reconciles.
    }
  }, [markAsReadLocal])

  const markAllRead = useCallback(async () => {
    markAllAsReadLocal() // optimistic
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
    } catch {
      // Persisted store keeps the optimistic state; next refresh reconciles.
    }
  }, [markAllAsReadLocal])

  return { markRead, markAllRead, isLoading, refresh }
}
