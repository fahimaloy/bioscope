'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

// All icons as SVG paths
const iconPaths = {
  facebook: 'M13 2L8 7l5 5L13 2',
  instagram: 'M7.45 18.75c0-.65.05-1.3.15-1.95A5.43 5.43 0 0 1 12 6c-.65 0-1.3.05-1.95.15m4.2 5.1a3.55 3.55 0 1 1-2.14-5.08M12 1v4m0 12v4m0-8h.01M5.05 6.95c.35-.35 1.06-.35 1.41 0l3.19 3.19m21.79-5.05a5.5 5.5 0 1 1-7.78 7.78m5.05-7.78a5.5 5.5 0 1 0-7.78 7.78m5.05 7.78a3.55 3.55 0 0 0 2.14 5.08M12 20h.01m-7.28 7.7l-5.33 5.33M5.66 5.66l-5.33 5.33M1.1 1.1l5.33 5.33m20.27-2.28l-5.33 5.33M5.66 18.34l5.33-5.33M1.1 22.9l5.33-5.33m19.56.78H17M2 12h.01m6.95-.65a5.5 5.5 0 1 0-2.14 5.08m14.71-5.05A5.5 5.5 0 1 1 15.5 9m3.61 1.45a1.1 1.1 0 0 0 0 1.73m1.95 0a1.1 1.1 0 1 1 1.73 0M2.1 2.1l4.22 4.22m5.57 5.57l4.24 4.24m5.1 5.1l4.23 4.23m3.07 3.07l4.27 4.27m6.08 6.08l4.26 4.26M13.06 2.94l4.22 4.22M2.94 13.06l4.22 4.22m15.96 15.96l-4.22-4.22m-5.96-5.96l-4.22-4.22',
  twitter: 'M15.05 4.05a5 5 0 1 1-9.95 9.95M11.05 8.95a2 2 0 1 1-1.41-2.83m13.45 5.65a2 2 0 1 1 2.83 1.41M8 14a4 4 0 1 1-7.95 1.05A4 4 0 0 1 8 14ZM21 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  linkedin: 'M16 8a6 6 0 0 1 6 6v.03m8.94-4.2a6.98 6.98 0 0 1-3.43 1.84l-.38 1.2a4.94 4.94 0 0 1-2.78 1.53L21.5 7.5a2.93 2.93 0 0 1-2.04-.85 2.93 2.93 0 0 1-.82-2.04l1.2-.38a6.98 6.98 0 0 1 1.84-3.43M10 2a6 6 0 0 0-6 6v.03m4.93-4.2a4.94 4.94 0 0 1 1.23.38l.38 1.2a2.93 2.93 0 0 1 .85 2.04 2.93 2.93 0 0 1-.85.2 2.93 2.93 0 0 1-2.04-.85l-1.2-.38a4.94 4.94 0 0 1-.38-1.23M2 10a6 6 0 0 0 6 6m4.93 4.2a4.94 4.94 0 0 1-1.23.38l-.38 1.2a2.93 2.93 0 0 1-.85 2.04 2.93 2.93 0 0 1-.85.2 2.93 2.93 0 0 1-2.04-.85l-1.2-.38a4.94 4.94 0 0 1 1.23-.38',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-1c0-1.1.9-2 2-2m16 4H6c-1 0-2 1-2 2v1c0 1 1 2 2 2h14c1 0 2-1 2-2v-1c0-1-1-2-2-2ZM6 10c0 7-9 6.5-9 6.5S6 17 6 10Z',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4 8.24 2 2 0 0 1 2.18 3.02 19.73 19.73 0 0 1 8.25 2 19.86 19.86 0 0 1 12 3.5c5.52 0 10.47 1.84 14.36 5H22Z',
  map_pin: 'M12 2v2m0 18l6-6m-6 6l6 6m7-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-3 4c0 4-4 8-4 8H1c0-4 4-8 4-8m0 0c0 4 4 8 4 8H1c0-4 4-8 4-8Z',
}

const footerLinks = {
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/shop', label: 'Our Products' },
    { href: '/custom-sticker', label: 'Custom Stickers' },
    { href: '/contact', label: 'Contact' },
  ],
  support: [
    { href: '/faq', label: 'FAQ' },
    { href: '/shipping', label: 'Shipping Info' },
    { href: '/returns', label: 'Returns Policy' },
    { href: '/track-order', label: 'Track Order' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
  ],
}

const socialLinks = [
  { href: 'https://facebook.com', label: 'Facebook', icon: 'facebook' },
  { href: 'https://instagram.com', label: 'Instagram', icon: 'instagram' },
  { href: 'https://twitter.com', label: 'Twitter', icon: 'twitter' },
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: 'linkedin' },
]

const contactInfo = [
  { icon: 'mail', text: 'support@stickershop.com', href: 'mailto:support@stickershop.com' },
  { icon: 'phone', text: '+880 1700 000000', href: 'tel:+8801700000000' },
  { icon: 'map_pin', text: 'Dhaka, Bangladesh', href: '#' },
]

export function Footer() {
  return (
    <footer className="bg-dark text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6" aria-label="Go to homepage">
              <span className="text-4xl font-display text-accent">bioscope</span>
              <span className="text-3xl">🚀</span>
            </Link>
            <p className="text-[var(--ink)]/60 text-body leading-relaxed mb-6 max-w-xs">
              Making Awesome Fun Things Happen since today! We create custom stickers that bring your ideas to life.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-dark/30 flex items-center justify-center text-white transition-all duration-300 hover:bg-primary hover:scale-110"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5 text-white">
                    <path d={iconPaths[social.icon as keyof typeof iconPaths]} className="fill-current" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-display text-primary mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--ink)]/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-display text-primary mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--ink)]/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-display text-primary mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--ink)]/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-[var(--ink)]/30 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactInfo.map((contact) => (
              <a
                key={contact.text}
                href={contact.href}
                className="flex items-center gap-3 text-[var(--ink)]/60 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 text-primary flex-shrink-0">
                  <path d={iconPaths[contact.icon as keyof typeof iconPaths]} className="fill-current" />
                </svg>
                <span className="text-body">{contact.text}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[var(--ink)]/30 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[var(--ink)]/50 text-sm">
              © 2024 bioscope. All rights reserved.
            </p>
            <p className="text-[var(--ink)]/50 text-sm">
              Made with ❤️ in Bangladesh
            </p>
          </div>
        </div>

        {/* Floating shapes */}
        <div className="fixed bottom-0 left-0 right-0 h-64 bg-shapes pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
          <div className="shape shape-1" style={{ width: '300px', height: '300px', background: 'var(--primary)', bottom: '-10%', left: '-10%', animationDelay: '0s' }} />
          <div className="shape shape-2" style={{ width: '400px', height: '400px', background: 'var(--secondary)', bottom: '-10%', right: '-10%', animationDelay: '-5s' }} />
          <div className="shape shape-3" style={{ width: '250px', height: '250px', background: 'var(--accent)', bottom: '40%', left: '50%', animationDelay: '-10s' }} />
        </div>
      </div>
    </footer>
  )
}