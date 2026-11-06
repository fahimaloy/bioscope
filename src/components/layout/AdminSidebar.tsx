'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
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
  const { user, logout, isAdmin } = useAuth()
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
      {/* Overlay for mobile */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-[var(--ink)]/50 transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-50 bg-[var(--paper)] border-r-3 border-[var(--ink)]',
          'flex flex-col transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
          collapsed ? 'w-20' : 'w-64',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation"
      >
        {/* Logo / Toggle */}
        <div
          className={cn(
            'flex items-center h-20 px-4 border-b-3 border-[var(--ink)] relative',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0" aria-label="Admin Dashboard">
              <span className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/images/bioscope-logo.png"
                  alt="Bioscope"
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </span>
              <span className="font-display text-2xl text-primary truncate">bioscope</span>
            </Link>
          )}
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-input text-[var(--ink)] hover:bg-[var(--light)] transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Desktop collapse button */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'hidden lg:flex p-2 rounded-input text-[var(--ink)] hover:bg-[var(--light)] hover:text-primary hover:-translate-y-0.5 transition-all duration-200',
              collapsed ? 'mx-auto' : ''
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const badgeValue = getBadgeValue(item.badge)

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'group flex items-center gap-3 px-3 py-3 rounded-input border-l-4 transition-all duration-200',
                  'hover:-translate-y-0.5 hover:shadow-btn',
                  isActive
                    ? 'bg-primary/10 border-l-4 border-primary text-primary shadow-btn'
                    : 'border-l-4 border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-primary',
                  collapsed && 'justify-center px-2'
                )}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-[var(--text-secondary)] group-hover:text-primary'
                  )}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <>
                    <span className="font-semibold text-body truncate">{item.name}</span>
                    {badgeValue !== null && badgeValue > 0 && (
                      <Badge variant="doodle" size="sm" className="ml-auto animate-pulse-soft">
                        {badgeValue > 99 ? '99+' : badgeValue}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && badgeValue !== null && badgeValue > 0 && (
                  <span
                    className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[var(--primary)] border-2 border-[var(--ink)] animate-pulse-soft"
                    aria-label={`${item.name} has pending items`}
                  />
                )}
              </Link>
            )
          })}

          {/* Settings Section */}
          {!collapsed && (
            <div className="pt-4 mt-4 border-t-2 border-dashed border-[var(--border-secondary)]">
              <h3 className="px-3 font-display text-sm text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                Settings
              </h3>
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-input transition-all duration-200 hover:-translate-y-0.5',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-sunken)] hover:text-primary'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className={cn('p-3 border-t-3 border-[var(--ink)]', collapsed && 'px-2')}>
          <div className={cn('flex items-center gap-3 mb-3', collapsed && 'justify-center mb-0')}>
            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-[var(--ink)] flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-display text-xl">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-body text-[var(--text-primary)] truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-pill border-2 border-transparent text-[var(--error)] hover:bg-[var(--error)]/10 hover:border-[var(--error)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold text-sm">Logout</span>
            </button>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 rounded-pill border-2 border-transparent text-[var(--error)] hover:bg-[var(--error)]/10 hover:border-[var(--error)] transition-all duration-200"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
