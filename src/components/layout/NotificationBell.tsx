'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Bell, X, CheckCircle, Clock, AlertCircle, Package, FileText, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { formatDateTime } from '@/lib/utils'

const notificationIcons: Record<string, any> = {
  NEW_ORDER: Package,
  ORDER_STATUS_CHANGED: Clock,
  CUSTOM_REQUEST: FileText,
  CUSTOM_REQUEST_PRICED: CheckCircle,
  LOW_STOCK: AlertCircle,
  NEW_USER: UserPlus,
  WELCOME: Bell,
  DEFAULT: Bell,
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore()

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
    return <Icon className="w-5 h-5 flex-shrink-0" />
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    // Navigate to relevant page based on notification data
    if (notification.data?.url) {
      window.location.href = notification.data.url
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
        <Bell className="w-5 h-5 text-[var(--ink)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border-3 border-[var(--ink)] rounded-card shadow-[0_10px_40px_rgba(0,0,0,0.15)] animate-scale-in z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--light)]">
            <h3 className="font-display text-primary">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--ink)]/50">
                <Bell className="w-12 h-12 mx-auto mb-3 text-[var(--ink)]/20" />
                <p className="text-body">No notifications yet</p>
                <p className="text-sm text-[var(--ink)]/40 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <ul className="divide-y divide-light" role="list" aria-label="Notifications">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'w-full p-4 flex items-start gap-3 transition-colors',
                        'hover:bg-[var(--light)]',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        !notification.isRead && 'bg-primary/5'
                      )}
                      role="button"
                      tabIndex={0}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          !notification.isRead ? 'bg-primary/10 text-primary' : 'bg-[var(--light)] text-[var(--ink)]/50'
                        )}
                      >
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            'font-medium text-body truncate',
                            !notification.isRead ? 'text-[var(--ink)]' : 'text-[var(--ink)]/70'
                          )}>
                            {notification.title}
                          </h4>
                          <time className="text-xs text-[var(--ink)]/40 flex-shrink-0 whitespace-nowrap">
                            {formatDateTime(notification.createdAt)}
                          </time>
                        </div>
                        <p className={cn(
                          'text-sm mt-1 truncate',
                          !notification.isRead ? 'text-[var(--ink)]/70' : 'text-[var(--ink)]/50'
                        )}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[var(--light)]">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsOpen(false)}>
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}