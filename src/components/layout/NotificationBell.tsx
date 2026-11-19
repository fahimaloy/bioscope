'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Bell, X, CheckCircle, Clock, AlertCircle, Package, FileText, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { useNotifications } from '@/lib/hooks/useNotifications'
import type { Notification } from '@/types'
import { formatDateTime } from '@/lib/utils'

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  NEW_ORDER: Package,
  ORDER_STATUS_CHANGED: Clock,
  CUSTOM_REQUEST: FileText,
  CUSTOM_REQUEST_PRICED: CheckCircle,
  LOW_STOCK: AlertCircle,
  NEW_USER: UserPlus,
  WELCOME: Bell,
  DEFAULT: Bell,
}

/**
 * E5 — notification bell. `useNotifications` fetches the feed on mount (correct
 * after reload), subscribes to `notification:new` (live without reload), and
 * persists mark-read via the API. Token-based dropdown; width capped so it never
 * causes horizontal overflow at 320px. Mounted in the customer Navbar (auth) and
 * the admin layout.
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const { markRead, markAllRead } = useNotifications()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getIcon = (type: string) => {
    const Icon = notificationIcons[type] || notificationIcons.DEFAULT
    return <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) void markRead(notification.id)
    if (notification.data && typeof notification.data === 'object' && 'url' in notification.data) {
      window.location.href = String(notification.data.url)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={isOpen}
        className="relative p-2"
      >
        <Bell className="h-5 w-5 text-[var(--ink)]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--error)] text-xs font-semibold text-[var(--paper)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border-2 border-[var(--ink)] bg-[var(--surface-raised)] shadow-[0_10px_40px_rgba(0,0,0,0.15)] animate-scale-in sm:w-96">
          <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
            <h3 className="font-display text-[var(--brand)]">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => void markAllRead()} className="text-xs">
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="p-1" aria-label="Close notifications">
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-subtle)]">
                <Bell className="mx-auto mb-3 h-12 w-12 text-[var(--text-subtle)]" aria-hidden="true" />
                <p className="text-[var(--text)]">No notifications yet</p>
                <p className="mt-1 text-sm text-[var(--text-subtle)]">You&apos;re all caught up!</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]" role="list" aria-label="Notifications">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'flex w-full items-start gap-3 p-4 text-left transition-colors',
                        'hover:bg-[var(--paper-deep)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2',
                        !notification.isRead && 'bg-[color-mix(in_srgb,var(--brand)_5%,transparent)]'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                          !notification.isRead ? 'bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]' : 'bg-[var(--paper-deep)] text-[var(--text-subtle)]'
                        )}
                      >
                        {getIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn('truncate font-medium', !notification.isRead ? 'text-[var(--ink)]' : 'text-[var(--text-muted)]')}>
                            {notification.title}
                          </h4>
                          <time className="flex-shrink-0 whitespace-nowrap text-xs text-[var(--text-subtle)]">
                            {formatDateTime(notification.createdAt)}
                          </time>
                        </div>
                        <p className={cn('mt-1 truncate text-sm', !notification.isRead ? 'text-[var(--text-muted)]' : 'text-[var(--text-subtle)]')}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--brand)]" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
