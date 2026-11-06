'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { Button } from '@/components/ui/Button'
import { SketchUnderline } from '@/components/decorative/DoodleElements'
import { motionVariants } from '@/lib/motion'
import {
  ChevronRight,
  LogOut,
  User,
  Settings,
  Menu,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/lib/hooks/useAuth'

const pageNames: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  'custom-requests': 'Custom Requests',
  customers: 'Customers',
  analytics: 'Analytics',
  settings: 'Settings',
  profile: 'Profile',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>
  }

  const handleLogout = () => {
    logout()
    signOut({ callbackUrl: '/' })
  }

  // Build breadcrumb segments from pathname, e.g. /admin/settings/tax
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((s) => s !== 'admin')

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        {/* Top Bar */}
        <header className="fixed top-16 left-0 right-0 z-40 bg-[var(--surface-card)]/90 backdrop-blur-sm border-b-3 border-[var(--ink)] shadow-glass">
          <div className="max-w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-input text-[var(--ink)] hover:text-primary transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex items-center gap-1.5 text-sm flex-wrap">
                  <li>
                    <Link
                      href="/admin/dashboard"
                      className="text-[var(--text-tertiary)] hover:text-primary transition-colors font-medium"
                    >
                      Admin
                    </Link>
                  </li>
                  {segments.map((segment, index) => {
                    const href = '/admin/' + segments.slice(0, index + 1).join('/')
                    const isLast = index === segments.length - 1
                    const name = pageNames[segment] || segment
                    return (
                      <li key={href} className="flex items-center gap-1.5">
                        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" aria-hidden="true" />
                        {isLast ? (
                          <span className="text-primary font-semibold" aria-current="page">
                            <SketchUnderline>{name}</SketchUnderline>
                          </span>
                        ) : (
                          <Link
                            href={href}
                            className="text-[var(--text-tertiary)] hover:text-primary transition-colors font-medium"
                          >
                            {name}
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />

              {/* User menu with doodle dropdown */}
              <div className="relative group">
                <Button variant="doodle-outline" size="sm" className="gap-2" aria-haspopup="true">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block">{user?.name || 'Admin'}</span>
                </Button>
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: [0.175, 0.885, 0.32, 1.275] }}
                  className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                >
                  <div className="w-52 bg-[var(--surface-card)] border-3 border-[var(--ink)] rounded-card shadow-[8px_8px_0px_0px_var(--shadow-offset)] overflow-hidden">
                    <div className="px-4 py-3 border-b-2 border-dashed border-[var(--border-secondary)]">
                      <p className="font-display text-lg text-primary truncate">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/admin/profile"
                        className="flex items-center gap-3 px-3 py-2.5 text-body font-medium text-[var(--text-primary)] hover:bg-primary/10 hover:text-primary rounded-input transition-colors"
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-3 py-2.5 text-body font-medium text-[var(--text-primary)] hover:bg-primary/10 hover:text-primary rounded-input transition-colors"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <hr className="my-2 border-[var(--border-secondary)]" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-body font-medium text-[var(--error)] hover:bg-[var(--error)]/10 rounded-input transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </header>

        <main className="pt-32 pb-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={motionVariants.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="wait">
              <motion.div key={pathname} variants={motionVariants.staggerItem}>
                {children}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
