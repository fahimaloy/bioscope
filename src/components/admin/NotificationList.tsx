'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { formatDateTime } from '@/lib/utils'
import type { Notification } from '@/types'
import { Bell, CheckCircle, X, Eye, Trash2, Filter, MoreVertical, Clock, Package, FileText, AlertCircle, UserPlus, RefreshCw } from 'lucide-react'

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

const notificationColors: Record<string, string> = {
  NEW_ORDER: 'var(--primary)',
  ORDER_STATUS_CHANGED: 'var(--secondary)',
  CUSTOM_REQUEST: 'var(--purple)',
  CUSTOM_REQUEST_PRICED: 'var(--accent)',
  LOW_STOCK: 'var(--error)',
  NEW_USER: 'var(--success)',
  WELCOME: 'var(--info)',
  DEFAULT: 'var(--dark)',
}

export function NotificationList({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  className,
}: NotificationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredNotifications = notifications
    .filter((n) => {
      if (filter === 'unread') return !n.isRead
      if (filter === 'read') return n.isRead
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getIcon = (type: string) => {
    const Icon = notificationIcons[type] || notificationIcons.DEFAULT
    return <Icon className="w-5 h-5" />
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkRead(notification.id)
    }
    if (notification.data?.url) {
      window.location.href = notification.data.url
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-input bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl text-primary">Notifications</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {notifications.length} total • {unreadCount} unread
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={onMarkAllRead}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-input text-sm font-medium transition-all',
                filter === f
                  ? 'bg-primary text-white shadow-btn'
                  : 'bg-[var(--light)] text-[color-mix(in_srgb,var(--ink)_70%,transparent)] hover:bg-dark/10 border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                  {notifications.filter((n) => f === 'unread' ? !n.isRead : n.isRead).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <Dropdown
          trigger={<Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Sort</Button>}
          items={[
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
          ]}
          value={sortBy}
          onChange={(v) => setSortBy(v as any)}
        />
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-[var(--text-subtle)]" />
            <p className="text-body text-[var(--text-muted)]">
              {filter === 'unread' ? 'No unread notifications' :
               filter === 'read' ? 'No read notifications' :
               'No notifications yet'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || notificationIcons.DEFAULT
            const color = notificationColors[notification.type] || notificationColors.DEFAULT
            const isExpanded = expandedId === notification.id

            return (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-input border-2 transition-all',
                  !notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-white border-[var(--light)]',
                  isExpanded && 'ring-2 ring-primary/20'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-input flex items-center justify-center flex-shrink-0',
                    !notification.isRead ? 'bg-primary/10 text-primary' : 'bg-[var(--light)] text-[var(--text-subtle)]'
                  )}
                >
                  {Icon}
                </div>
                <div className="flex-1 min-w-0" onClick={() => setExpandedId(isExpanded ? null : notification.id)}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={cn(
                      'font-medium text-body truncate',
                      !notification.isRead ? 'text-[var(--ink)]' : 'text-[color-mix(in_srgb,var(--ink)_70%,transparent)]'
                    )}>
                      {notification.title}
                    </h4>
                    <time className="text-xs text-[var(--text-subtle)] whitespace-nowrap">
                      {formatDateTime(notification.createdAt)}
                    </time>
                  </div>
                  <p className={cn(
                    'text-sm truncate',
                    !notification.isRead ? 'text-[color-mix(in_srgb,var(--ink)_70%,transparent)]' : 'text-[var(--text-subtle)]'
                  )}>
                    {notification.message}
                  </p>
                  {isExpanded && notification.data && (
                    <div className="mt-2 p-2 bg-[var(--light)] rounded-input text-xs text-[var(--text-muted)] font-mono">
                      <pre>{JSON.stringify(notification.data, null, 2)}</pre>
                    </div>
                  )}
                  {!isExpanded && notification.data && (
                    <p className="text-xs text-primary/80 mt-1">Click to expand</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.isRead && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id) }} className="p-1" aria-label="Mark as read">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }} className="p-1 text-red-500 hover:bg-red-50" aria-label="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
        </div>

      {filteredNotifications.length > 20 && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={() => {}}>Load More</Button>
        </div>
      )}
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDelete: (id: string) => void
  className?: string
}

// Notification Bell with Dropdown (for header)
export function NotificationBellDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDelete: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const recentNotifications = notifications.slice(0, 5)

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
          <div className="flex items-center justify-between p-4 border-b border-[var(--light)]">
            <h3 className="font-display text-primary">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs">
                  Mark All Read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="p-1" aria-label="Close">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-subtle)]">
                <Bell className="w-12 h-12 mx-auto mb-3 text-[var(--text-subtle)]" />
                <p className="text-body">No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || notificationIcons.DEFAULT
                const color = notificationColors[notification.type] || notificationColors.DEFAULT

                return (
                  <button
                    key={notification.id}
                    onClick={() => {
                      if (!notification.isRead) onMarkRead(notification.id)
                      if (notification.data?.url) window.location.href = notification.data.url
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 transition-colors',
                      'hover:bg-[var(--light)]',
                      !notification.isRead && 'bg-primary/5',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                    )}
                    role="menuitem"
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', `bg-[${color}]/10 text-[${color}]`)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn('font-medium text-sm truncate', !notification.isRead ? 'text-[var(--ink)]' : 'text-[color-mix(in_srgb,var(--ink)_70%,transparent)]')}>
                          {notification.title}
                        </h4>
                        <time className="text-xs text-[var(--text-subtle)] whitespace-nowrap">
                          {formatDateTime(notification.createdAt)}
                        </time>
                      </div>
                      <p className={cn('text-xs truncate', !notification.isRead ? 'text-[color-mix(in_srgb,var(--ink)_70%,transparent)]' : 'text-[var(--text-subtle)]')}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </button>
                  )
                })
            )}
          </div>

          <div className="p-3 border-t border-[var(--light)]">
            <Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
              View All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDelete: (id: string) => void
  className?: string
}