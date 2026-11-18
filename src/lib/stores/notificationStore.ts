'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification } from '@/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  pendingOrdersCount: number
  pendingRequestsCount: number
  lowStockCount: number

  // Actions
  addNotification: (notification: Notification) => void
  addNotifications: (notifications: Notification[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setCounts: (counts: {
    unreadCount?: number
    pendingOrdersCount?: number
    pendingRequestsCount?: number
    lowStockCount?: number
  }) => void
  incrementCount: (type: 'unread' | 'pendingOrders' | 'pendingRequests' | 'lowStock') => void
  decrementCount: (type: 'unread' | 'pendingOrders' | 'pendingRequests' | 'lowStock') => void
  syncFromServer: (data: {
    notifications: Notification[]
    unreadCount: number
    pendingOrdersCount: number
    pendingRequestsCount: number
    lowStockCount: number
  }) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      pendingOrdersCount: 0,
      pendingRequestsCount: 0,
      lowStockCount: 0,

      addNotification: (notification) =>
        set((state) => {
          const exists = state.notifications.some((n) => n.id === notification.id)
          if (exists) return state

          const newNotifications = [notification, ...state.notifications].slice(0, 100)
          return {
            notifications: newNotifications,
            unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
          }
        }),

      addNotifications: (notifications) =>
        set((state) => {
          const existingIds = new Set(state.notifications.map((n) => n.id))
          const newNotifications = notifications
            .filter((n) => !existingIds.has(n.id))
            .concat(state.notifications)
            .slice(0, 100)

          const unreadCount = newNotifications.filter((n) => !n.isRead).length
          return {
            notifications: newNotifications,
            unreadCount,
          }
        }),

      markAsRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          if (!notification || notification.isRead) return state

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt || new Date(),
          })),
          unreadCount: 0,
        })),

      removeNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification?.isRead
              ? state.unreadCount
              : Math.max(0, state.unreadCount - 1),
          }
        }),

      clearNotifications: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),

      setCounts: (counts) =>
        set((state) => ({
          unreadCount: counts.unreadCount ?? state.unreadCount,
          pendingOrdersCount: counts.pendingOrdersCount ?? state.pendingOrdersCount,
          pendingRequestsCount: counts.pendingRequestsCount ?? state.pendingRequestsCount,
          lowStockCount: counts.lowStockCount ?? state.lowStockCount,
        })),

      incrementCount: (type) =>
        set((state) => ({
          [`${type}Count`]: (state[`${type}Count` as keyof typeof state] as number) + 1,
        })),

      decrementCount: (type) =>
        set((state) => ({
          [`${type}Count`]: Math.max(0, (state[`${type}Count` as keyof typeof state] as number) - 1),
        })),

      syncFromServer: (data) =>
        set({
          notifications: data.notifications,
          unreadCount: data.unreadCount,
          pendingOrdersCount: data.pendingOrdersCount,
          pendingRequestsCount: data.pendingRequestsCount,
          lowStockCount: data.lowStockCount,
        }),
    }),
    {
      name: 'sticker-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50),
        unreadCount: state.unreadCount,
        pendingOrdersCount: state.pendingOrdersCount,
        pendingRequestsCount: state.pendingRequestsCount,
        lowStockCount: state.lowStockCount,
      }),
    }
  )
)

// Selectors
export const useNotifications = () =>
  useNotificationStore((state) => state.notifications)

export const useUnreadCount = () =>
  useNotificationStore((state) => state.unreadCount)

export const usePendingOrdersCount = () =>
  useNotificationStore((state) => state.pendingOrdersCount)

export const usePendingRequestsCount = () =>
  useNotificationStore((state) => state.pendingRequestsCount)

export const useLowStockCount = () =>
  useNotificationStore((state) => state.lowStockCount)

export const useNotificationActions = () =>
  useNotificationStore((state) => ({
    addNotification: state.addNotification,
    addNotifications: state.addNotifications,
    markAsRead: state.markAsRead,
    markAllAsRead: state.markAllAsRead,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,
    setCounts: state.setCounts,
    incrementCount: state.incrementCount,
    decrementCount: state.decrementCount,
    syncFromServer: state.syncFromServer,
  }))

// Badge count for sidebar
export const useSidebarBadgeCounts = () =>
  useNotificationStore((state) => ({
    total: state.unreadCount + state.pendingOrdersCount + state.pendingRequestsCount + state.lowStockCount,
    unread: state.unreadCount,
    pendingOrders: state.pendingOrdersCount,
    pendingRequests: state.pendingRequestsCount,
    lowStock: state.lowStockCount,
  }))