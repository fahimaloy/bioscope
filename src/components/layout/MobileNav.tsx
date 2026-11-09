'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { FOCUS_VISIBLE } from '@/components/ui/shared'
import { Home, ShoppingBag, Edit3, Info, Mail, X, Menu } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCartStore } from '@/lib/stores/cartStore'
import { signOut } from 'next-auth/react'

/**
 * Task 1.2 — the bottom tab bar (spec §6 component inventory; owner ruling 1).
 *
 * `Navbar` owns the top bar and its mobile dropdown panel; this stays as the
 * mobile bottom tab bar. Rebuilt onto the token set: paper surface, 2px ink
 * top border, hard offset ink shadow, token-only colour, 44px hit targets.
 */

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/custom-sticker', label: 'Custom', icon: Edit3 },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
]

export function MobileNav() {
  const pathname = usePathname()
  const { isAuthenticated, logout, isAdmin } = useAuth()
  const { itemCount, toggleCart } = useCartStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[var(--z-fixed)] md:hidden',
          'border-t-2 border-[var(--ink)] bg-[var(--paper)] shadow-ink-2'
        )}
        aria-label="Bottom navigation"
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 py-3 transition-colors duration-fast',
                  FOCUS_VISIBLE,
                  isActive
                    ? 'bg-[var(--gold)] text-[var(--ink)]'
                    : 'text-[var(--ink-muted)] hover:bg-[var(--paper-deep)] hover:text-[var(--ink)]'
                )}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
              >
                <item.icon
                  className={cn('h-6 w-6', isActive && 'fill-current')}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 py-3 transition-colors duration-fast',
              FOCUS_VISIBLE,
              isOpen
                ? 'bg-[var(--gold)] text-[var(--ink)]'
                : 'text-[var(--ink-muted)] hover:bg-[var(--paper-deep)] hover:text-[var(--ink)]'
            )}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
            <span className="text-xs font-medium">{isOpen ? 'Close' : 'More'}</span>
          </button>
        </div>

        {/* Expanded Menu */}
        <div
          id="mobile-nav-menu"
          className={cn(
            'border-t-2 border-[var(--ink)] bg-[var(--paper-raised)]',
            isOpen ? 'block' : 'hidden'
          )}
        >
          <div className="space-y-2 px-4 py-4">
            {/* Cart */}
            {isAuthenticated && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => {
                  toggleCart()
                  setIsOpen(false)
                }}
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                Cart {itemCount > 0 && `(${itemCount})`}
              </Button>
            )}

            {/* Admin Link */}
            {isAuthenticated && isAdmin && (
              <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="block">
                <Button variant="secondary" className="w-full justify-start gap-3">
                  <Edit3 className="h-5 w-5" aria-hidden="true" />
                  Admin Dashboard
                </Button>
              </Link>
            )}

            {/* Auth Links */}
            {isAuthenticated ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-[var(--error)]"
                onClick={handleLogout}
              >
                <X className="h-5 w-5" aria-hidden="true" />
                Logout
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="block">
                  <Button variant="primary" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Floating Action Button for Cart (when menu closed) */}
      {isAuthenticated && !isOpen && (
        <Button
          onClick={toggleCart}
          className="fixed bottom-24 right-4 z-[var(--z-fixed)] md:hidden"
          aria-label={`Shopping cart${itemCount > 0 ? ` with ${itemCount} items` : ''}`}
        >
          <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          {itemCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--pink-strong)] text-xs font-semibold text-[var(--on-pink-strong)]">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Button>
      )}
    </>
  )
}
