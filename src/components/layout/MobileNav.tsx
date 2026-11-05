'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, ShoppingBag, Edit3, Info, Mail, X, Menu } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCartStore } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/Button'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/custom-sticker', label: 'Custom', icon: Edit3 },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout, isAdmin } = useAuth()
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
          'fixed bottom-0 left-0 right-0 z-40 md:hidden',
          'bg-white border-t-3 border-[var(--ink)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]',
          isOpen && 'mb-64'
        )}
        aria-label="Bottom navigation"
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-3 px-2 min-h-[44px] transition-colors',
                  isActive ? 'text-primary' : 'text-[var(--ink)]/60 hover:text-primary'
                )}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={cn('w-6 h-6', isActive && 'fill-current')} aria-hidden="true" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-3 px-2 min-h-[44px] transition-colors',
              'text-[var(--ink)]/60 hover:text-primary'
            )}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <span className="text-xs font-medium">{isOpen ? 'Close' : 'More'}</span>
          </button>
        </div>

        {/* Expanded Menu */}
        <div
          id="mobile-nav-menu"
          className={cn(
            'md:hidden border-t border-[var(--light)] bg-white animate-slide-in',
            isOpen ? 'block' : 'hidden'
          )}
        >
          <div className="px-4 py-4 space-y-2">
            {/* Cart */}
            {isAuthenticated && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => { toggleCart(); setIsOpen(false) }}
              >
                <ShoppingBag className="w-5 h-5" />
                Cart {itemCount > 0 && `(${itemCount})`}
              </Button>
            )}

            {/* Admin Link */}
            {isAuthenticated && isAdmin && (
              <Link href="/admin/dashboard" onClick={() => setIsOpen(false)}>
                <Button variant="secondary" className="w-full justify-start gap-3">
                  <Edit3 className="w-5 h-5" />
                  Admin Dashboard
                </Button>
              </Link>
            )}

            {/* Auth Links */}
            {isAuthenticated ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-red-500 border-red-500"
                onClick={handleLogout}
              >
                <X className="w-5 h-5" />
                Logout
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" className="w-full">Sign Up</Button>
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
          className="fixed bottom-24 right-4 md:hidden z-30 shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
          aria-label={`Shopping cart${itemCount > 0 ? ` with ${itemCount} items` : ''}`}
        >
          <ShoppingBag className="w-6 h-6" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Button>
      )}
    </>
  )
}