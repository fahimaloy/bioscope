'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUIStore } from '@/lib/stores/uiStore'
import { useCartStore } from '@/lib/stores/cartStore'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionVariants } from '@/lib/motion'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { StickerPeel } from '@/components/decorative/DoodleElements'

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
        'bg-[var(--surface-card)]/90 backdrop-blur-md border-b border-[var(--border-secondary)] shadow-glass'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
            <Image
              src="/images/bioscope-logo.png"
              alt="bioscope"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <motion.div variants={motionVariants.staggerContainer} initial="initial" animate="animate">
              <div className="flex items-center gap-6">
                {navLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'font-medium text-body transition-all duration-200 relative',
                      pathname === link.href
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--ink)] hover:text-[var(--primary)]'
                    )}
                  >
                    <motion.span
                      variants={motionVariants.staggerItem}
                      custom={index}
                      whileHover={{ rotate: [-3, 3, -3, 0], transition: { duration: 0.4, ease: 'easeInOut' } }}
                    >
                      {link.label}
                    </motion.span>
                    <motion.span
                      className="absolute bottom-[-4px] left-0 h-[3px] bg-[var(--primary)]"
                      initial={{ scaleX: 0 }}
                      animate={pathname === link.href ? { scaleX: 1 } : { scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </Link>
                ))}
              </div>
            </motion.div>

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
                    <StickerPeel />
                    <AnimatePresence mode="wait">
                      {itemCount > 0 && (
                        <motion.span
                          key={itemCount}
                          variants={motionVariants.bounceIn}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center"
                        >
                          {itemCount > 99 ? '99+' : itemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
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
      <AnimatePresence mode="wait">
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
            style={{ transformOrigin: 'top' }}
            className="md:hidden relative"
          >
            <DoodleBackground shapeCount={6} className="inset-0 -z-10" />
            <div className="bg-[var(--surface-card)]/95 backdrop-blur-md border-t border-[var(--border-secondary)] px-4 py-4 space-y-2">
              <motion.div
                variants={motionVariants.staggerContainer}
                initial="initial"
                animate="animate"
              >
                {navLinks.map((link, index) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'block px-3 py-3 rounded-input font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'text-[var(--ink)] hover:bg-[var(--light)]'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <motion.span
                      variants={motionVariants.staggerItem}
                      custom={index}
                    >
                      {link.label}
                    </motion.span>
                  </Link>
                ))}
              </motion.div>

              <motion.div
                className="pt-4 border-t border-[var(--border-secondary)] flex flex-col gap-3"
                variants={motionVariants.staggerContainer}
                initial="initial"
                animate="animate"
              >
                {isAuthenticated ? (
                  <>
                    <motion.button
                      custom={0}
                      variants={motionVariants.staggerItem}
                      onClick={() => { toggleCart(); setMobileMenuOpen(false) }}
                      className="w-full px-3 py-3 rounded-input font-medium text-[var(--ink)] hover:bg-[var(--light)] transition-colors flex items-center gap-3"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Cart {itemCount > 0 && `(${itemCount})`}
                    </motion.button>

                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full px-3 py-3 rounded-input font-medium bg-[var(--secondary)] text-[var(--ink)] hover:bg-[var(--secondary)]/90 transition-colors flex items-center gap-3 text-center"
                      >
                        <motion.span
                          custom={1}
                          variants={motionVariants.staggerItem}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </motion.span>
                      </Link>
                    )}

                    <motion.button
                      custom={isAdmin ? 2 : 1}
                      variants={motionVariants.staggerItem}
                      onClick={handleLogout}
                      className="w-full px-3 py-3 rounded-input font-medium text-red-500 border border-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      custom={0}
                      variants={motionVariants.staggerItem}
                      onClick={() => { setMobileMenuOpen(false); router.push('/login') }}
                      className="w-full px-3 py-3 rounded-input font-medium border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--light)] transition-colors"
                    >
                      Login
                    </motion.button>
                    <motion.button
                      custom={1}
                      variants={motionVariants.staggerItem}
                      onClick={() => { setMobileMenuOpen(false); router.push('/register') }}
                      className="w-full px-3 py-3 rounded-input font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors"
                    >
                      Sign Up
                    </motion.button>
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