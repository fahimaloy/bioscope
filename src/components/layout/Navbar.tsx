'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUIStore } from '@/lib/stores/uiStore'
import { useCartStore } from '@/lib/stores/cartStore'
import { signOut } from 'next-auth/react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/custom-sticker', label: 'Custom Sticker' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout, isAdmin } = useAuth()
  const { mobileMenuOpen, setMobileMenuOpen, toggleMobileMenu } = useUIStore()
  const { itemCount, toggleCart } = useCartStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    signOut({ callbackUrl: '/' })
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-all duration-300',
        'glass-morphism',
        scrolled && 'shadow-glass'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
            <span className="text-3xl font-display text-[var(--primary)]">bioscope</span>
            <span className="text-2xl">🚀</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'font-medium text-body transition-all duration-200',
                    'relative after:absolute after:bottom-[-4px] after:left-0 after:h-[3px] after:bg-primary after:transition-all',
                    pathname === link.href
                      ? 'text-[var(--primary)] after:w-full'
                      : 'text-[var(--ink)] hover:text-[var(--primary)] after:w-0'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCart}
                    className="relative"
                    aria-label={`Shopping cart${itemCount > 0 ? ` with ${itemCount} items` : ''}`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                        {itemCount > 99 ? '99+' : itemCount}
                      </span>
                    )}
                  </Button>

                  {isAdmin && (
                    <Link href="/admin/dashboard" className="hidden sm:block">
                      <Button variant="secondary" size="sm">
                        <LayoutDashboard className="w-4 h-4 mr-1" />
                        Admin
                      </Button>
                    </Link>
                  )}

                  <div className="relative group">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="w-5 h-5" />
                      <span className="hidden sm:block">{user?.name || user?.email}</span>
                    </Button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border-3 border-[var(--ink)] rounded-card shadow-[0_10px_40px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 animate-scale-in">
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="block px-3 py-2 text-body text-[var(--ink)] hover:bg-[var(--light)] rounded-input transition-colors"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-3 py-2 text-body text-[var(--ink)] hover:bg-[var(--light)] rounded-input transition-colors"
                        >
                          My Orders
                        </Link>
                        <hr className="my-2 border-[var(--light)]" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-body text-red-500 hover:bg-[var(--light)] rounded-input transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[var(--ink)] hover:text-[var(--primary)] transition-colors"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          'bg-white border-t border-[var(--light)]',
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'block px-3 py-3 rounded-input font-medium transition-colors',
                pathname === link.href
                  ? 'bg-primary/10 text-[var(--primary)]'
                  : 'text-[var(--ink)] hover:bg-[var(--light)]'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-[var(--light)] flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => { toggleCart(); setMobileMenuOpen(false) }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Cart {itemCount > 0 && `(${itemCount})`}
                </Button>

                {isAdmin && (
                  <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full justify-start gap-3">
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}

                <Button variant="outline" className="w-full justify-start gap-3 text-red-500 border-red-500" onClick={handleLogout}>
                  <LogOut className="w-5 h-5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" onClick={() => { setMobileMenuOpen(false); router.push('/login') }}>
                  Login
                </Button>
                <Button variant="primary" className="w-full" onClick={() => { setMobileMenuOpen(false); router.push('/register') }}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}