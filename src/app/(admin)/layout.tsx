'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { Button } from '@/components/ui/Button'
import { Menu, X, LogOut, User, Settings, Bell } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/lib/hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { name: 'Products', href: '/admin/products', icon: 'Package' },
  { name: 'Orders', href: '/admin/orders', icon: 'ShoppingBag' },
  { name: 'Custom Requests', href: '/admin/custom-requests', icon: 'FileText' },
  { name: 'Customers', href: '/admin/customers', icon: 'Users' },
  { name: 'Analytics', href: '/admin/analytics', icon: 'BarChart2' },
  { name: 'Settings', href: '/admin/settings', icon: 'Settings' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>
  }

  const handleLogout = () => {
    logout()
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={cn(
        'transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64',
        'md:ml-0'
      )}>
        {/* Top Bar */}
        <header className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-[var(--light)] shadow-glass">
          <div className="max-w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 text-[var(--ink)] hover:text-primary transition-colors"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="font-display text-xl text-primary hidden sm:block">Admin Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="relative group">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block">{user?.name || 'Admin'}</span>
                </Button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border-3 border-[var(--ink)] rounded-card shadow-[0_10px_40px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 animate-scale-in">
                  <div className="p-2">
                    <Link href="/admin/profile" className="block px-3 py-2 text-body text-[var(--ink)] hover:bg-[var(--light)] rounded-input transition-colors">
                      Profile
                    </Link>
                    <Link href="/admin/settings" className="block px-3 py-2 text-body text-[var(--ink)] hover:bg-[var(--light)] rounded-input transition-colors">
                      Settings
                    </Link>
                    <hr className="my-2 border-[var(--light)]" />
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-body text-red-500 hover:bg-[var(--light)] rounded-input transition-colors">
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="pt-32 pb-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}