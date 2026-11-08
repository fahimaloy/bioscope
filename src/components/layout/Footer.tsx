'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { WashiTape, SketchUnderline, DoodleShape, DoodleStar } from '@/components/decorative/DoodleElements'
import { motionVariants } from '@/lib/motion'

// All icons as SVG paths
const iconPaths = {
  facebook: 'M13 2L8 7l5 5L13 2',
  instagram: 'M7.45 18.75c0-.65.05-1.3.15-1.95A5.43 5.43 0 0 1 12 6c-.65 0-1.3.05-1.95.15m4.2 5.1a3.55 3.55 0 1 1-2.14-5.08M12 1v4m0 12v4m0-8h.01M5.05 6.95c.35-.35 1.06-.35 1.41 0l3.19 3.19m21.79-5.05a5.5 5.5 0 1 1-7.78 7.78m5.05-7.78a5.5 5.5 0 1 0-7.78 7.78m5.05 7.78a3.55 3.55 0 0 0 2.14 5.08M12 20h.01m-7.28 7.7l-5.33 5.33M5.66 5.66l-5.33 5.33M1.1 1.1l5.33 5.33m20.27-2.28l-5.33 5.33M5.66 18.34l5.33-5.33M1.1 22.9l5.33-5.33m19.56.78H17M2 12h.01m6.95-.65a5.5 5.5 0 1 0-2.14 5.08m14.71-5.05A5.5 5.5 0 1 1 15.5 9m3.61 1.45a1.1 1.1 0 0 0 0 1.73m1.95 0a1.1 1.1 0 1 1 1.73 0M2.1 2.1l4.22 4.22m5.57 5.57l4.24 4.24m5.1 5.1l4.23 4.23m3.07 3.07l4.27 4.27m6.08 6.08l4.26 4.26M13.06 2.94l4.22 4.22M2.94 13.06l4.22 4.22m15.96 15.96l-4.22-4.22m-5.96-5.96l-4.22-4.22',
  twitter: 'M15.05 4.05a5 5 0 1 1-9.95 9.95M11.05 8.95a2 2 0 1 1-1.41-2.83m13.45 5.65a2 2 0 1 1 2.83 1.41M8 14a4 4 0 1 1-7.95 1.05A4 4 0 0 1 8 14ZM21 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  linkedin: 'M16 8a6 6 0 0 1 6 6v.03m8.94-4.2a6.98 6.98 0 0 1-3.43 1.84l-.38 1.2a4.94 4.94 0 0 1-2.78 1.53L21.5 7.5a2.93 2.93 0 0 1-2.04-.85 2.93 2.93 0 0 1-.82-2.04l1.2-.38a6.98 6.98 0 0 1 1.84-3.43M10 2a6 6 0 0 0-6 6v.03m4.93-4.2a4.94 4.94 0 0 1 1.23.38l.38 1.2a2.93 2.93 0 0 1 .85 2.04 2.93 2.93 0 0 1-.85.2 2.93 2.93 0 0 1-2.04-.85l-1.2-.38a4.94 4.94 0 0 1-.38-1.23M2 10a6 6 0 0 0 6 6m4.93 4.2a4.94 4.94 0 0 1-1.23.38l-.38 1.2a2.93 2.93 0 0 1-.85 2.04 2.93 2.93 0 0 1-.85.2 2.93 2.93 0 0 1-2.04-.85l-1.2-.38a4.94 4.94 0 0 1 1.23-.38',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-1c0-1.1.9-2 2-2m16 4H6c-1 0-2 1-2 2v1c0 1 1 2 2 2h14c1 0 2-1 2-2v-1c0-1-1-2-2-2ZM6 10c0 7-9 6.5-9 6.5S6 17 6 10Z',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4 8.24 2 2 0 0 1 2.18 3.02 19.73 19.73 0 0 1 8.25 2 19.86 19.86 0 0 1 12 3.5c5.52 0 10.47 1.84 14.36 5H22Z',
  map_pin: 'M12 2v2m0 18l6-6m-6 6l6 6m7-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-3 4c0 4-4 8-4 8H1c0-4 4-8 4-8m0 0c0 4 4-8 4-8H1c0-4 4-8 4-8Z',
  arrow_right: 'M5 12h14M12 5l7 7-7 7',
}

const footerLinks = {
  shop: [
    { href: '/shop', label: 'All Stickers' },
    { href: '/shop?category=vinyl', label: 'Vinyl Stickers' },
    { href: '/shop?category=holographic', label: 'Holographic' },
    { href: '/shop?category=matte', label: 'Matte Finish' },
    { href: '/custom-sticker', label: 'Custom Design' },
  ],
  support: [
    { href: '/faq', label: 'FAQ' },
    { href: '/shipping', label: 'Shipping Info' },
    { href: '/returns', label: 'Returns Policy' },
    { href: '/track-order', label: 'Track Order' },
    { href: '/contact', label: 'Contact Us' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
    { href: '/accessibility', label: 'Accessibility' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/careers', label: 'Careers' },
    { href: '/press', label: 'Press Kit' },
    { href: '/affiliates', label: 'Affiliates' },
  ],
}

const socialLinks = [
  { href: 'https://facebook.com/bioscope', label: 'Facebook', icon: 'facebook' },
  { href: 'https://instagram.com/bioscope', label: 'Instagram', icon: 'instagram' },
  { href: 'https://twitter.com/bioscope', label: 'Twitter', icon: 'twitter' },
  { href: 'https://linkedin.com/company/bioscope', label: 'LinkedIn', icon: 'linkedin' },
]

const contactInfo = [
  { icon: 'mail', text: 'hello@bioscope.shop', href: 'mailto:hello@bioscope.shop' },
  { icon: 'phone', text: '+880 1700 000000', href: 'tel:+8801700000000' },
  { icon: 'map_pin', text: 'Dhaka, Bangladesh', href: 'https://maps.google.com/?q=Dhaka,Bangladesh' },
]

export function Footer() {
  return (
    <footer className="relative bg-[var(--bg-color)] text-[var(--ink)] pt-20 pb-12 overflow-hidden">
      {/* Doodle Background - replaces old bg-shapes system */}
      <DoodleBackground shapeCount={8} />
      
      {/* Decorative corner doodles */}
      <DoodleShape size="lg" color="primary" animation="float" className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 opacity-20" />
      <DoodleShape size="md" color="accent" animation="wobble" className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 opacity-20" />
      <DoodleShape size="md" color="secondary" animation="pulse" className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 opacity-20" />
      <DoodleShape size="sm" color="accent" animation="rotate" className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 opacity-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top decorative scatter line with washi tape */}
        <div className="flex items-center justify-center gap-4 mb-12 relative">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--ink)]/30 to-transparent" />
          <WashiTape width={180} height={32} rotation={-3}>
            <span className="font-display text-[var(--ink)] text-sm tracking-wider uppercase">bioscope</span>
          </WashiTape>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--ink)]/30 to-transparent" />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-8" style={{ animationDelay: '0ms' }}>
            <motion.div variants={motionVariants.staggerContainer} initial="hidden" animate="visible">
              {/* Logo with DoodleStar */}
              <Link 
                href="/" 
                className="flex items-center gap-3 group"
                aria-label="Go to bioscope homepage"
              >
                <motion.span 
                  whileHover="hoverScale"
                  className="relative"
                >
                  <DoodleStar size="md" color="accent" animation="float" className="absolute -top-2 -right-2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
                  <span className="text-5xl font-display text-[var(--primary)] tracking-wider relative z-10">bioscope</span>
                </motion.span>
                <motion.span 
                  whileHover="hoverScale"
                  className="text-4xl"
                  aria-hidden="true"
                >🚀</motion.span>
              </Link>

              <motion.p 
                className="text-[var(--ink)]/70 text-body leading-relaxed max-w-xs"
                variants={motionVariants.staggerItem}
              >
                Making awesome fun things happen since today! We create custom stickers that bring your ideas to life with premium vinyl, holographic finishes, and endless creativity.
              </motion.p>

              {/* Social Icons with hover bounce */}
              <motion.div 
                className="flex gap-3"
                variants={motionVariants.staggerContainer}
              >
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="relative group"
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={motionVariants.staggerItem}
                    style={{ transitionDelay: `${index * 50}ms` }}
                    whileHover="hoverScale"
                    whileTap="tapPress"
                  >
                    <div className="w-11 h-11 rounded-full bg-[var(--surface-card)] border-2 border-[var(--ink)]/20 flex items-center justify-center transition-all duration-300 group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:shadow-[4px_4px_0px_var(--ink)]">
                      <svg className="w-5 h-5 text-[var(--ink)] group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={iconPaths[social.icon as keyof typeof iconPaths]} />
                      </svg>
                    </div>
                    {/* Tooltip */}
                    <motion.span
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 text-xs font-body font-medium text-white bg-[var(--ink)] rounded-md whitespace-nowrap opacity-0 pointer-events-none"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {social.label}
                    </motion.span>
                  </motion.a>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Shop Links */}
          <div style={{ animationDelay: '100ms' }}>
            <motion.h3 
              className="mb-6"
              variants={motionVariants.fadeInUp}
            >
              <SketchUnderline className="font-display text-xl text-[var(--ink)] uppercase tracking-wider">
                Shop
              </SketchUnderline>
            </motion.h3>
            <motion.ul 
              className="space-y-4"
              variants={motionVariants.staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {footerLinks.shop.map((link, index) => (
                <motion.li key={link.href} variants={motionVariants.staggerItem} style={{ transitionDelay: `${index * 50}ms` }}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-[var(--ink)]/70 hover:text-[var(--primary)] transition-colors group"
                  >
                    <span className="text-body">{link.label}</span>
                    <motion.svg
                      className="w-4 h-4 text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-all duration-300"
                      variants={motionVariants.slideInRight}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={iconPaths.arrow_right} />
                    </motion.svg>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Support Links */}
          <div style={{ animationDelay: '200ms' }}>
            <motion.h3 
              className="mb-6"
              variants={motionVariants.fadeInUp}
            >
              <SketchUnderline className="font-display text-xl text-[var(--ink)] uppercase tracking-wider">
                Support
              </SketchUnderline>
            </motion.h3>
            <motion.ul 
              className="space-y-4"
              variants={motionVariants.staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {footerLinks.support.map((link, index) => (
                <motion.li key={link.href} variants={motionVariants.staggerItem} style={{ transitionDelay: `${index * 50}ms` }}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-[var(--ink)]/70 hover:text-[var(--primary)] transition-colors group"
                  >
                    <span className="text-body">{link.label}</span>
                    <motion.svg
                      className="w-4 h-4 text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-all duration-300"
                      variants={motionVariants.slideInRight}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={iconPaths.arrow_right} />
                    </motion.svg>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Legal Links */}
          <div style={{ animationDelay: '300ms' }}>
            <motion.h3 
              className="mb-6"
              variants={motionVariants.fadeInUp}
            >
              <SketchUnderline className="font-display text-xl text-[var(--ink)] uppercase tracking-wider">
                Legal
              </SketchUnderline>
            </motion.h3>
            <motion.ul 
              className="space-y-4"
              variants={motionVariants.staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {footerLinks.legal.map((link, index) => (
                <motion.li key={link.href} variants={motionVariants.staggerItem} style={{ transitionDelay: `${index * 50}ms` }}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-[var(--ink)]/70 hover:text-[var(--primary)] transition-colors group"
                  >
                    <span className="text-body">{link.label}</span>
                    <motion.svg
                      className="w-4 h-4 text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-all duration-300"
                      variants={motionVariants.slideInRight}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={iconPaths.arrow_right} />
                    </motion.svg>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Newsletter Signup */}
          <div className="relative" style={{ animationDelay: '400ms' }}>
            <motion.h3 
              className="mb-6"
              variants={motionVariants.fadeInUp}
            >
              <SketchUnderline className="font-display text-xl text-[var(--ink)] uppercase tracking-wider">
                Newsletter
              </SketchUnderline>
            </motion.h3>
            
            <motion.p 
              className="text-[var(--ink)]/60 text-body mb-6"
              variants={motionVariants.fadeInUp}
              style={{ transitionDelay: '100ms' }}
            >
              Get 10% off your first order + exclusive designs & early access.
            </motion.p>

            {/* Newsletter Form with Floating Label */}
            <motion.form 
              className="space-y-4"
              variants={motionVariants.staggerContainer}
              initial="hidden"
              animate="visible"
              onSubmit={(e) => {
                e.preventDefault()
                // Handle newsletter signup
                const formData = new FormData(e.currentTarget)
                const email = formData.get('email')
                console.log('Newsletter signup:', email)
                // TODO: Integrate with newsletter service
                e.currentTarget.reset()
              }}
            >
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="footer-email"
                  placeholder=" "
                  className="w-full px-4 py-4 bg-[var(--surface-card)] border-2 border-[var(--ink)]/20 rounded-[var(--radius-md)] text-[var(--ink)] placeholder:text-transparent focus:outline-none focus:border-[var(--primary)] focus:shadow-[4px_4px_0px_var(--primary)] transition-all duration-300"
                  required
                  autoComplete="email"
                  aria-label="Email address for newsletter"
                />
                <label
                  htmlFor="footer-email"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink)]/50 text-body pointer-events-none transition-all duration-300 origin-left"
                >
                  Enter your email
                </label>
              </div>
              <motion.button
                type="submit"
                className="w-full py-4 px-6 bg-[var(--primary)] text-white font-display text-lg uppercase tracking-wider rounded-[var(--radius-md)] border-2 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)] hover:shadow-[6px_6px_0px_var(--ink)] hover:-translate-y-1 hover:bg-[var(--primary)]/90 active:translate-y-1 active:shadow-[2px_2px_0px_var(--ink)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                whileHover="hoverLift"
                whileTap="tapPress"
                variants={motionVariants.staggerItem}
                style={{ transitionDelay: '200ms' }}
              >
                Subscribe
              </motion.button>
            </motion.form>

            {/* Decorative elements around newsletter */}
            <DoodleShape size="sm" color="accent" animation="float" className="absolute -top-4 -right-4 opacity-30" />
            <DoodleStar size="sm" color="primary" animation="wobble" className="absolute bottom-20 right-10 opacity-30" />
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="relative py-10 border-y border-[var(--ink)]/10 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactInfo.map((contact, index) => (
              <motion.a
                key={contact.text}
                href={contact.href}
                className="flex items-start gap-4 text-[var(--ink)]/70 hover:text-[var(--primary)] transition-colors group"
                target={contact.href.startsWith('http') ? '_blank' : undefined}
                rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-card)] border-2 border-[var(--ink)]/20 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:shadow-[4px_4px_0px_var(--ink)]">
                  <svg className="w-5 h-5 text-[var(--ink)] group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={iconPaths[contact.icon as keyof typeof iconPaths]} />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-body">{contact.text}</p>
                  <p className="text-sm text-[var(--ink)]/50 mt-0.5">
                    {contact.icon === 'mail' && 'We reply within 24h'}
                    {contact.icon === 'phone' && 'Mon-Fri 9am-6pm'}
                    {contact.icon === 'map_pin' && 'Visit our studio'}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
          
          {/* Washi tape decorative element in contact section */}
          <WashiTape width={200} height={36} rotation={2} className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 z-10">
            <span className="font-display text-[var(--ink)] text-xs tracking-wider uppercase">stay sticky</span>
          </WashiTape>
        </div>

        {/* Copyright & Bottom */}
        <div className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.p 
              className="text-[var(--ink)]/50 text-sm text-center md:text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              © {new Date().getFullYear()} bioscope. All rights reserved.
            </motion.p>
            
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <span className="text-[var(--ink)]/50 text-sm">Made with</span>
              <motion.span 
                className="text-[var(--primary)]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                aria-label="Love"
              >
                ❤️
              </motion.span>
              <span className="text-[var(--ink)]/50 text-sm">in Bangladesh</span>
            </motion.div>

            {/* Payment/Trust badges */}
            <motion.div 
              className="flex items-center gap-3 text-[var(--ink)]/40 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <span className="font-medium uppercase tracking-wider">Secure payments:</span>
              <span className="font-display text-lg">🔒</span>
              <span className="font-display text-lg">💳</span>
              <span className="font-display text-lg">📱</span>
            </motion.div>
          </div>
        </div>

        {/* Bottom doodle scatter */}
        <div className="flex justify-center gap-2 mt-8">
          <DoodleStar size="sm" color="primary" animation="float" />
          <DoodleStar size="sm" color="accent" animation="wobble" />
          <DoodleStar size="sm" color="secondary" animation="pulse" />
          <DoodleStar size="sm" color="primary" animation="float" />
        </div>
      </div>
    </footer>
  )
}