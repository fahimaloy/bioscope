'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { SketchUnderline } from '@/components/decorative'
import { motionVariants } from '@/lib/motion'
import { FOCUS_VISIBLE } from '@/components/ui/shared'
import { ChevronRight, LogOut, User, Settings, Menu } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * Task 1.4 — the admin chrome (spec §13, plan Task 1.4).
 *
 * Calm pro shell: a near-white `--surface` page with a `--surface-raised`
 * sticky top bar, 1px `--border` hairlines, dense type, and one teal accent.
 * The sidebar rail sits under the 64px fixed navbar (`top-16`), and the top
 * bar sticks below it, so nothing collides with the brand navbar above.
 *
 * The `isAdmin` guard is unchanged: a non-admin gets the Access Denied state
 * and no sidebar (Ruling 2). `src/middleware.ts` is the primary gate; this
 * is the backstop. The logout action is unchanged.
 *
 * Geometry: the top bar reserves its own in-flow slot with `pt-16` on the
 * content column below, so the `sticky top-16` bar occupies y=64–128 and the
 * page content starts at y=128. Without that offset the bar's in-flow slot is
 * y=0–64, `sticky top-16` paints it at y=64–128, and it covers the first 40px
 * of the content column. `tests/unit/components/admin-sidebar.test.tsx` pins
 * this with a geometric assertion.
 */

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface)]">
        Access Denied
      </div>
    )
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
    <div className="min-h-screen bg-[var(--surface)]">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'flex min-h-screen flex-col pt-16 transition-[margin] duration-base ease-out',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-16 z-40 border-b border-[var(--border)] bg-[var(--surface-raised)]">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className={cn(
                  'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[var(--ink)] transition-colors duration-fast hover:bg-[var(--surface-sunken)] lg:hidden',
                  FOCUS_VISIBLE
                )}
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                  <li>
                    <Link
                      href="/admin/dashboard"
                      className={cn(
                        'font-medium text-[var(--text-muted)] transition-colors duration-fast hover:text-[var(--ink)]',
                        FOCUS_VISIBLE
                      )}
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
                        <ChevronRight
                          className="h-4 w-4 flex-shrink-0 text-[var(--text-subtle)]"
                          aria-hidden="true"
                        />
                        {isLast ? (
                          <span className="font-semibold text-[var(--ink)]" aria-current="page">
                            <SketchUnderline color="teal">{name}</SketchUnderline>
                          </span>
                        ) : (
                          <Link
                            href={href}
                            className={cn(
                              'font-medium text-[var(--text-muted)] transition-colors duration-fast hover:text-[var(--ink)]',
                              FOCUS_VISIBLE
                            )}
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

              {/* User menu */}
              <div className="group relative">
                <button
                  className={cn(
                    'flex min-h-[44px] items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm font-medium text-[var(--ink)] transition-colors duration-fast hover:bg-[var(--surface-sunken)]',
                    FOCUS_VISIBLE
                  )}
                  aria-haspopup="true"
                >
                  <User className="h-4 w-4 text-[var(--teal)]" aria-hidden="true" />
                  <span className="hidden sm:block">{user?.name || 'Admin'}</span>
                </button>
                <div className="invisible absolute right-0 top-full z-50 mt-2 w-52 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-2 opacity-0 shadow-sm transition-all duration-fast group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="border-b border-[var(--border)] px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {user?.name || 'Admin'}
                    </p>
                    <p className="truncate text-xs text-[var(--text-subtle)]">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/admin/profile"
                      className={cn(
                        'flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-medium text-[var(--ink)] transition-colors duration-fast hover:bg-[var(--surface-sunken)]',
                        FOCUS_VISIBLE
                      )}
                    >
                      <User className="h-4 w-4 text-[var(--teal)]" aria-hidden="true" /> Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      className={cn(
                        'flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-medium text-[var(--ink)] transition-colors duration-fast hover:bg-[var(--surface-sunken)]',
                        FOCUS_VISIBLE
                      )}
                    >
                      <Settings className="h-4 w-4 text-[var(--teal)]" aria-hidden="true" /> Settings
                    </Link>
                    <hr className="my-1 border-[var(--border)]" />
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-[var(--error)] transition-colors duration-fast hover:bg-[var(--surface-sunken)]',
                        FOCUS_VISIBLE
                      )}
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
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
