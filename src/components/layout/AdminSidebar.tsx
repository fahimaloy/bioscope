'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { FOCUS_VISIBLE } from '@/components/ui/shared'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileText,
  Settings,
  Users,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart2,
  Tag,
  Truck,
  CreditCard,
  X,
} from 'lucide-react'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { signOut } from 'next-auth/react'

/**
 * Task 1.4 — the admin sidebar (spec §13, plan Task 1.4).
 *
 * Calm pro: a near-white `--surface-raised` rail with 1px `--border`
 * hairlines, dense type, and one teal accent (the badge fill, with
 * `--on-teal` text). The active destination is marked by a gold left bar
 * (Ruling 1). No offset shadows, no brand borders, no loud Paper + Pop.
 *
 * Behaviour is unchanged from the legacy sidebar: the collapse/expand rail,
 * the mobile overlay, the pending-count badges from `useNotificationStore`,
 * and the logout action all work exactly as before.
 */

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, badge: null as string | null },
  { name: 'Products', href: '/admin/products', icon: Package, badge: 'pendingProducts' },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, badge: 'pendingOrders' },
  { name: 'Custom Requests', href: '/admin/custom-requests', icon: FileText, badge: 'pendingRequests' },
  { name: 'Customers', href: '/admin/customers', icon: Users, badge: null },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2, badge: null },
  { name: 'Settings', href: '/admin/settings', icon: Settings, badge: null },
]

const settingsNavigation = [
  { name: 'General', href: '/admin/settings', icon: Settings },
  { name: 'Tax', href: '/admin/settings/tax', icon: Tag },
  { name: 'Delivery', href: '/admin/settings/delivery', icon: Truck },
  { name: 'Payments', href: '/admin/settings/payments', icon: CreditCard },
  { name: 'Email', href: '/admin/settings/email', icon: Bell },
]

interface AdminSidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { pendingOrdersCount, pendingRequestsCount } = useNotificationStore()

  const handleLogout = () => {
    logout()
    signOut({ callbackUrl: '/' })
  }

  const getBadgeValue = (badge: string | null): number | null => {
    if (badge === 'pendingOrders') return pendingOrdersCount
    if (badge === 'pendingRequests') return pendingRequestsCount
    return null
  }

  return (
    <>
      {/* Mobile overlay — `--overlay` is the token-system scrim. It sits above
          the admin header (z-40) so the whole page dims while the sidebar is
          open, not just the content column. */}
      <div
        className={cn(
          'fixed inset-0 z-[var(--z-modal-backdrop)] bg-[var(--overlay)] transition-opacity duration-base lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-16 z-50 flex flex-col',
          'border-r border-[var(--border)] bg-[var(--surface-raised)]',
          'transition-all duration-base ease-out',
          collapsed ? 'w-20' : 'w-64',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation"
      >
        {/* Logo / Toggle */}
        <div
          className={cn(
            'relative flex h-16 items-center border-b border-[var(--border)] px-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <Link
              href="/admin/dashboard"
              className={cn('flex min-w-0 items-center gap-2', FOCUS_VISIBLE)}
              aria-label="Admin Dashboard"
            >
              <span className="relative h-9 w-9 flex-shrink-0">
                <Image
                  src="/images/bioscope-logo.png"
                  alt="Bioscope"
                  fill
                  className="object-contain"
                  sizes="36px"
                />
              </span>
              <span className="truncate font-display text-xl text-[var(--ink)]">bioscope</span>
            </Link>
          )}

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className={cn(
              'absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center p-2 text-[var(--ink)] transition-colors duration-fast hover:text-[var(--teal)] lg:hidden',
              FOCUS_VISIBLE
            )}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'hidden min-h-[44px] min-w-[44px] items-center justify-center p-2 text-[var(--ink)] transition-colors duration-fast hover:text-[var(--teal)] lg:flex',
              collapsed && 'mx-auto',
              FOCUS_VISIBLE
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const badgeValue = getBadgeValue(item.badge)

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'group relative flex min-h-[44px] items-center gap-3 rounded-md border-l-2 border-transparent px-3 text-sm font-medium',
                  'transition-colors duration-fast',
                  FOCUS_VISIBLE,
                  isActive
                    ? 'border-l-[var(--gold)] bg-[var(--surface-sunken)] text-[var(--ink)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]',
                  collapsed && 'justify-center px-2'
                )}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors duration-fast',
                    isActive
                      ? 'text-[var(--teal)]'
                      : 'text-[var(--text-muted)] group-hover:text-[var(--ink)]'
                  )}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <>
                    <span className="truncate font-semibold">{item.name}</span>
                    {badgeValue !== null && badgeValue > 0 && (
                      <Badge
                        variant="default"
                        size="sm"
                        className="ml-auto animate-pulse-soft border-transparent bg-[var(--teal)] text-[var(--on-teal)]"
                      >
                        {badgeValue > 99 ? '99+' : badgeValue}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && badgeValue !== null && badgeValue > 0 && (
                  <span
                    className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse-soft rounded-full bg-[var(--teal)]"
                    aria-label={`${item.name} has pending items`}
                  />
                )}
              </Link>
            )
          })}

          {/* Settings Section */}
          {!collapsed && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                Settings
              </h3>
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex min-h-[44px] items-center gap-3 rounded-md border-l-2 border-transparent px-3 text-sm transition-colors duration-fast',
                      FOCUS_VISIBLE,
                      isActive
                        ? 'border-l-[var(--gold)] bg-[var(--surface-sunken)] text-[var(--ink)]'
                        : 'text-[var(--text-subtle)] hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive ? 'text-[var(--teal)]' : 'text-[var(--text-subtle)]'
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className={cn('border-t border-[var(--border)] p-3', collapsed && 'px-2')}>
          <div className={cn('mb-3 flex items-center gap-3', collapsed && 'mb-0 justify-center')}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--teal)]">
              <span className="font-display text-lg">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">
                  {user?.name || 'Admin'}
                </p>
                <p className="truncate text-xs text-[var(--text-subtle)]">{user?.email}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className={cn(
                'flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-[var(--error)] transition-colors duration-fast hover:bg-[var(--surface-sunken)]',
                FOCUS_VISIBLE
              )}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              className={cn(
                'flex min-h-[44px] w-full items-center justify-center rounded-md p-2.5 text-[var(--error)] transition-colors duration-fast hover:bg-[var(--surface-sunken)]',
                FOCUS_VISIBLE
              )}
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
