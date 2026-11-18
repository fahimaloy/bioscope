import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Shrikhand, Outfit, Caveat } from 'next/font/google'
import { MotionConfig } from 'framer-motion'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { FloatingIcons } from '@/components/decorative/FloatingIcons'

/**
 * Self-hosted via next/font (spec §5.3): Shrikhand for display, Outfit for
 * body, Caveat for annotations. The `--font-*` variables are mapped into
 * Tailwind (`fontFamily.display/body/hand`) and into `globals.css`.
 */
const shrikhand = Shrikhand({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: '400' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-body', display: 'swap', weight: ['400', '500', '600', '700'] })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-hand', display: 'swap', weight: ['400', '600', '700'] })

const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BIOSCOPE — Custom Stickers & Designs',
    template: '%s | BIOSCOPE',
  },
  description: 'BIOSCOPE — design and print fun custom stickers, doodle art, and vintage-style vinyl. Warm craft nostalgia for young creators.',
  keywords: ['BIOSCOPE', 'stickers', 'custom stickers', 'vinyl stickers', 'holographic stickers', 'sticker printing', 'custom designs'],
  authors: [{ name: 'BIOSCOPE' }],
  creator: 'BIOSCOPE',
  publisher: 'BIOSCOPE',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'BIOSCOPE',
    title: 'BIOSCOPE — Custom Stickers & Designs',
    description: 'Create custom stickers, browse our collection, or design your own.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'BIOSCOPE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BIOSCOPE — Custom Stickers & Designs',
    description: 'Create custom stickers, browse our collection, or design your own.',
    images: ['/opengraph-image'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: 'var(--pink)',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className={`${shrikhand.variable} ${outfit.variable} ${caveat.variable} scroll-smooth`}>
      <head>
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://utfs.io" />
      </head>
      <body className="min-h-screen font-body antialiased flex flex-col">
        <FloatingIcons />
        <MotionConfig reducedMotion="user">
          <Providers>
            {/* Ruling 3: the navbar is mounted once, here, so the admin layout's
                `fixed top-16` header and PageWrapper's `pt-16` offset both land
                under a real 64px bar. */}
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'sonner-toast',
              }}
            />
            {/* Ruling 3: mounted once, here, so every route — including `/` and
                `/admin/*` — has cart access. It is closed by default and only
                opens from the cart store. */}
            <CartDrawer />
          </Providers>
        </MotionConfig>
      </body>
    </html>
  )
}