'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin } from 'lucide-react'
import { TornEdge } from '@/components/decorative'
import { Wordmark } from '@/components/brand/Wordmark'
import { motionVariants } from '@/lib/motion'
import { FOCUS_VISIBLE } from '@/components/ui/shared'

/**
 * Footer — spec §5.1 (lockup), §5.7 (decor), §5.8 (brand surfaces);
 * plan Task 1.3.
 *
 * Ink surface, paper text. Four link columns (Shop, Company, Support, Legal)
 * carrying the 16 real destinations, a brand column with the `Wordmark`, and a
 * contact block. The single decor accent is the `TornEdge` capping the top of
 * the ink block (contract §3).
 *
 * Deliberately absent:
 * - the newsletter form — the legacy submit handler only wrote to the browser
 *   console and no planned task provides a newsletter backend (Ruling 3);
 * - `/cookies` — spec §7.1 lists no cookie page, so the link is dropped
 *   rather than pointed at a route that will never exist (Ruling 1).
 */

const FOOTER_COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All Stickers' },
      { href: '/custom-sticker', label: 'Custom Sticker' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
      { href: '/press', label: 'Press Kit' },
      { href: '/affiliates', label: 'Affiliates' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/shipping', label: 'Shipping' },
      { href: '/returns', label: 'Returns' },
      { href: '/track-order', label: 'Track Order' },
      { href: '/orders', label: 'My Orders' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/accessibility', label: 'Accessibility' },
    ],
  },
] as const

// TODO: owner copy
const CONTACT = [
  {
    icon: Mail,
    label: 'hello@bioscope.shop',
    href: 'mailto:hello@bioscope.shop',
    note: 'Email us anytime',
  },
  { icon: Phone, label: '+880 1700 000000', href: 'tel:+8801700000000', note: 'Mon-Fri 9am-6pm' },
  {
    icon: MapPin,
    label: 'Dhaka, Bangladesh',
    href: 'https://maps.google.com/?q=Dhaka,Bangladesh',
    note: 'Visit our studio',
  },
] as const

const SOCIAL = [
  { label: 'Facebook', href: 'https://facebook.com/bioscope' },
  { label: 'Instagram', href: 'https://instagram.com/bioscope' },
  { label: 'Twitter', href: 'https://twitter.com/bioscope' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/bioscope' },
] as const

/**
 * A destination row: 44px tall so the hit target clears contract §6.
 *
 * Translucent paper is written as `color-mix`, not an opacity modifier:
 * Tailwind 3.4 emits no rule for `text-[var(--paper)]/75` (the `/75` modifier
 * does not apply to a `var()` arbitrary value), so the class silently does
 * nothing. `color-mix(in srgb, …)` compiles and resolves at paint time.
 */
const LINK_CLASS = `flex min-h-[44px] items-center font-body text-[color-mix(in_srgb,var(--paper)_75%,transparent)] transition-colors duration-fast hover:text-[var(--paper)] ${FOCUS_VISIBLE}`

export function Footer() {
  return (
    <footer className="relative bg-[var(--ink)] text-[var(--paper)]">
      {/* The one decor accent (contract §3). The tear is cut from the paper page
          above, so the ink block's top edge reads as torn. */}
      <TornEdge position="top" color="paper" />

      <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand column: the lockup, the wordmark in its light (paper) variant
              because the surface is ink (Ruling 4). */}
          <motion.div
            className="lg:col-span-4"
            variants={motionVariants.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <Link
              href="/"
              aria-label="bioscope — home"
              className={`inline-flex items-center rounded-pill ${FOCUS_VISIBLE}`}
            >
              <Wordmark size="lg" variant="light" />
            </Link>

            {/* TODO: owner copy */}
            <motion.p
              variants={motionVariants.staggerItem}
              className="mt-6 max-w-sm font-body leading-relaxed text-[color-mix(in_srgb,var(--paper)_75%,transparent)]"
            >
              Custom stickers, vinyl and holographic, designed and printed in Dhaka.
            </motion.p>

            <motion.div variants={motionVariants.staggerItem} className="mt-8 flex flex-wrap gap-2">
              {SOCIAL.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={motionVariants.hoverLift}
                  whileTap={motionVariants.tapPress}
                  className={`inline-flex min-h-[44px] items-center rounded-pill border-2 border-[color-mix(in_srgb,var(--paper)_30%,transparent)] px-4 text-sm font-medium text-[var(--paper)] transition-colors duration-fast hover:border-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)] ${FOCUS_VISIBLE}`}
                >
                  {social.label}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* The four destination columns. */}
          {FOOTER_COLUMNS.map((column) => (
            <motion.nav
              key={column.title}
              aria-label={column.title}
              className="lg:col-span-2"
              variants={motionVariants.staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.h2
                variants={motionVariants.staggerItem}
                className="font-display text-lg uppercase tracking-wider text-[var(--paper)]"
              >
                {column.title}
              </motion.h2>
              <ul className="mt-4 space-y-1">
                {column.links.map((link) => (
                  <motion.li key={link.href} variants={motionVariants.staggerItem}>
                    <Link href={link.href} className={LINK_CLASS}>
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          ))}
        </div>

        {/* Contact block. */}
        <motion.ul
          variants={motionVariants.staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-16 grid grid-cols-1 gap-4 border-t-2 border-[color-mix(in_srgb,var(--paper)_20%,transparent)] pt-10 sm:grid-cols-3"
        >
          {CONTACT.map(({ icon: Icon, label, href, note }) => {
            const external = href.startsWith('http')
            return (
              <motion.li key={label} variants={motionVariants.staggerItem}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`flex items-start gap-4 rounded-md font-body text-[var(--paper)] transition-colors duration-fast hover:text-[var(--paper-raised)] ${FOCUS_VISIBLE}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border-2 border-[color-mix(in_srgb,var(--paper)_30%,transparent)]">
                    <Icon size={18} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-medium">{label}</span>
                    <span className="mt-0.5 block text-sm text-[color-mix(in_srgb,var(--paper)_60%,transparent)]">
                      {note}
                    </span>
                  </span>
                </a>
              </motion.li>
            )
          })}
        </motion.ul>

        {/* Bottom bar. */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t-2 border-[color-mix(in_srgb,var(--paper)_20%,transparent)] pt-8 sm:flex-row">
          <p className="text-sm text-[color-mix(in_srgb,var(--paper)_60%,transparent)]">
            © {new Date().getFullYear()} bioscope. All rights reserved.
          </p>
          <p className="text-sm text-[color-mix(in_srgb,var(--paper)_60%,transparent)]">
            Made with care in Bangladesh
          </p>
        </div>
      </div>
    </footer>
  )
}
