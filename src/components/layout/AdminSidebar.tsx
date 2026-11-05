'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, badge: null },
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
}

export function AdminSidebar({ collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const { pendingOrdersCount, pendingRequestsCount } = useNotificationStore()

  const handleLogout = () => {
    logout()
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={onToggleCollapse}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 z-50 bg-[var(--paper)] border-r-3 border-[var(--ink)] transition-all duration-300 ease-in-out',
          'flex flex-col',
          collapsed ? 'w-20' : 'w-64',
          'md:translate-x-0'
        )}
        aria-label="Admin navigation"
      >
        {/* Logo / Toggle */}
        <div className={cn('flex items-center justify-between h-16 px-4 border-b border-[var(--ink)]', collapsed && 'justify-center')}>
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2" aria-label="Admin Dashboard">
              <span className="text-2xl font-display text-primary">bioscope</span>
              <span className="text-xl">🚀</span>
            </Link>
          )}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'p-2 rounded-input text-[var(--ink)] hover:bg-[var(--light)] hover:text-primary transition-colors',
              collapsed && 'mx-auto'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const badgeValue = item.badge === 'pendingOrders' ? pendingOrdersCount :
              item.badge === 'pendingRequests' ? pendingRequestsCount : null

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-input transition-all duration-200',
                  'relative overflow-hidden',
                  isActive
                    ? 'bg-primary text-white shadow-btn'
                    : 'text-[var(--ink)]/70 hover:bg-[var(--light)] hover:text-primary',
                  collapsed && 'justify-center'
                )}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-white')} aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span className="font-medium text-body truncate">{item.name}</span>
                    {badgeValue && badgeValue > 0 && (
                      <Badge variant="primary" size="sm" className="ml-auto">
                        {badgeValue > 99 ? '99+' : badgeValue}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )
          })}

          {/* Settings Section */}
          {!collapsed && (
            <>
              <div className="pt-4 mt-4 border-t border-[var(--light)]">
                <h3 className="px-3 text-xs font-medium text-[var(--ink)]/50 uppercase tracking-wider mb-3">
                  Settings
                </h3>
                {settingsNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-input transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-[var(--ink)]/60 hover:bg-[var(--light)] hover:text-primary'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span className="font-medium text-sm truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </nav>

        {/* User Section */}
        <div className={cn('p-3 border-t border-[var(--ink)]', collapsed && 'hidden')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-display text-xl">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-body text-[var(--ink)] truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-[var(--ink)]/50 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-input text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
