'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/Button'
import { StickerPeel } from '@/components/decorative/StickerPeel'
import { motion, AnimatePresence } from 'framer-motion'
import { motionVariants } from '@/lib/motion'
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUIStore } from '@/lib/stores/uiStore'
import { useCartStore } from '@/lib/stores/cartStore'
import { signOut } from 'next-auth/react'
import { FOCUS_VISIBLE } from '@/components/ui/shared'

/**
 * Task 1.2 — the top bar (spec §5.8 / plan Task 1.2).
 *
 * Paper surface, 2px ink bottom border, hard offset ink shadow, the
 * `BIOSCOPE` lockup, four nav links as pills that fill on hover with the
 * spring, and a cart control that opens the cart drawer. The mobile menu is a
 * full-width panel below the bar with a staggered link entrance.
 *
 * Mounted once in `src/app/layout.tsx` (Ruling 3), fixed at `h-16` so
 * `PageWrapper`'s `pt-16` offset is correct. Every `var(--…)` below resolves
 * to a token defined in `globals.css`'s `:root`.
 */

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/custom-sticker', label: 'Custom Sticker' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout, isAdmin } = useAuth()
  const { mobileMenuOpen, setMobileMenuOpen, toggleMobileMenu } = useUIStore()
  const { itemCount, toggleCart } = useCartStore()
  const [scrolled, setScrolled] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    signOut({ callbackUrl: '/' })
  }

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed top-0 left-0 right-0 z-[var(--z-dropdown)] h-16',
        'bg-[var(--paper)] border-b-2 border-[var(--ink)]',
        'transition-shadow duration-fast ease-out',
        scrolled ? 'shadow-ink-1' : 'shadow-none'
      )}
    >
      <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Lockup */}
          <Link
            href="/"
            aria-label="BIOSCOPE — home"
            className={cn(
              'flex shrink-0 items-center rounded-pill px-2 py-1',
              FOCUS_VISIBLE
            )}
          >
            <Wordmark size="md" />
          </Link>

          {/* Desktop Navigation — from `lg` up: below 1024px the lockup, four
              pills, cart and auth controls do not fit the 64px bar. */}
          <div className="hidden items-center gap-6 lg:flex">
            <motion.ul
              variants={motionVariants.staggerContainer}
              initial="initial"
              animate="animate"
              className="flex items-center gap-1"
            >
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href
                return (
                  <motion.li key={link.href} variants={motionVariants.staggerItem} custom={index}>
                    <Link
                      href={link.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative block rounded-pill border-2 px-4 py-2 font-body text-base font-medium',
                        'transition-[transform,background-color,color] duration-fast ease-spring',
                        'hover:-translate-y-0.5',
                        FOCUS_VISIBLE,
                        isActive
                          ? 'border-[var(--ink)] bg-[var(--gold)] text-[var(--ink)] shadow-ink-1'
                          : 'border-transparent text-[var(--ink)] hover:bg-[var(--paper-deep)]'
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                )
              })}
            </motion.ul>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCart}
                    className="relative"
                    aria-label={`Shopping cart${itemCount > 0 ? ` with ${itemCount} items` : ''}`}
                  >
                    <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                    <StickerPeel />
                    <AnimatePresence mode="wait">
                      {itemCount > 0 && (
                        <motion.span
                          key={itemCount}
                          variants={motionVariants.bounceIn}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-[var(--pink-strong)] text-xs font-semibold text-[var(--on-pink-strong)]"
                        >
                          {itemCount > 99 ? '99+' : itemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>

                  {isAdmin && (
                    <Link href="/admin/dashboard" className="hidden sm:block">
                      <Button variant="secondary" size="sm">
                        <LayoutDashboard className="mr-1 h-4 w-4" aria-hidden="true" />
                        Admin
                      </Button>
                    </Link>
                  )}

                  <div
                    className="group relative"
                    onMouseEnter={() => setAccountMenuOpen(true)}
                    onMouseLeave={() => setAccountMenuOpen(false)}
                    onFocus={() => setAccountMenuOpen(true)}
                    onBlur={() => setAccountMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      aria-haspopup="true"
                      aria-expanded={accountMenuOpen}
                    >
                      <User className="h-5 w-5" aria-hidden="true" />
                      <span className="hidden max-w-[10rem] truncate sm:block">
                        {user?.name || user?.email}
                      </span>
                    </Button>
                    <div className="invisible absolute right-0 top-full z-50 mt-2 w-48 rounded-pill border-2 border-[var(--ink)] bg-[var(--surface-raised)] p-2 opacity-0 shadow-ink-2 transition-all duration-fast ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <Link
                        href="/profile"
                        className={cn(
                          'block rounded-pill px-3 py-2 font-body text-base text-[var(--ink)] transition-colors duration-fast hover:bg-[var(--paper-deep)]',
                          FOCUS_VISIBLE
                        )}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/orders"
                        className={cn(
                          'block rounded-pill px-3 py-2 font-body text-base text-[var(--ink)] transition-colors duration-fast hover:bg-[var(--paper-deep)]',
                          FOCUS_VISIBLE
                        )}
                      >
                        My Orders
                      </Link>
                      <hr className="my-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)]" />
                      <button
                        onClick={handleLogout}
                        className={cn(
                          'w-full rounded-pill px-3 py-2 text-left font-body text-base text-[var(--error)] transition-colors duration-fast hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)]',
                          FOCUS_VISIBLE
                        )}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill text-[var(--ink)] transition-colors duration-fast hover:bg-[var(--paper-deep)] lg:hidden',
              FOCUS_VISIBLE
            )}
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu-panel"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu — full-width panel below the bar */}
      <AnimatePresence mode="wait">
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu-panel"
            key="mobile-menu-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'top' }}
            className="overflow-hidden border-t-2 border-[var(--ink)] bg-[var(--paper)] lg:hidden"
          >
            <div className="space-y-2 px-4 py-4">
              <motion.ul
                variants={motionVariants.staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-col gap-1"
              >
                {navLinks.map((link, index) => {
                  const isActive = pathname === link.href
                  return (
                    <motion.li key={link.href} variants={motionVariants.staggerItem} custom={index}>
                      <Link
                        href={link.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex min-h-[44px] items-center rounded-pill border-2 px-4 py-3 font-body text-base font-medium transition-colors duration-fast',
                          FOCUS_VISIBLE,
                          isActive
                            ? 'border-[var(--ink)] bg-[var(--gold)] text-[var(--ink)] shadow-ink-1'
                            : 'border-transparent text-[var(--ink)] hover:bg-[var(--paper-deep)]'
                        )}
                      >
                        <span>{link.label}</span>
                      </Link>
                    </motion.li>
                  )
                })}
              </motion.ul>

              <motion.div
                className="flex flex-col gap-2 border-t-2 border-dashed border-[color-mix(in_srgb,var(--ink)_30%,transparent)] pt-4"
                variants={motionVariants.staggerContainer}
                initial="initial"
                animate="animate"
              >
                {isAuthenticated ? (
                  <>
                    <motion.div variants={motionVariants.staggerItem} custom={0}>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          toggleCart()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                        Cart {itemCount > 0 && `(${itemCount})`}
                      </Button>
                    </motion.div>

                    {isAdmin && (
                      <motion.div variants={motionVariants.staggerItem} custom={1}>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block"
                        >
                          <Button variant="secondary" className="w-full justify-start gap-3">
                            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                            Admin Dashboard
                          </Button>
                        </Link>
                      </motion.div>
                    )}

                    <motion.div variants={motionVariants.staggerItem} custom={isAdmin ? 2 : 1}>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 text-[var(--error)]"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" aria-hidden="true" />
                        Logout
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div variants={motionVariants.staggerItem} custom={0}>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                        <Button variant="outline" className="w-full">
                          Login
                        </Button>
                      </Link>
                    </motion.div>
                    <motion.div variants={motionVariants.staggerItem} custom={1}>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block"
                      >
                        <Button variant="primary" className="w-full">
                          Sign Up
                        </Button>
                      </Link>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
