import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Shrikhand, Outfit, Caveat } from 'next/font/google'
import { MotionConfig } from 'framer-motion'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import { Footer } from '@/components/layout/Footer'

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
    default: 'bioscope — Custom Stickers & Designs',
    template: '%s | bioscope',
  },
  description: 'bioscope — design and print fun custom stickers, doodle art, and vintage-style vinyl. Warm craft nostalgia for young creators.',
  keywords: ['bioscope', 'stickers', 'custom stickers', 'vinyl stickers', 'holographic stickers', 'sticker printing', 'custom designs'],
  authors: [{ name: 'bioscope' }],
  creator: 'bioscope',
  publisher: 'bioscope',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'bioscope',
    title: 'bioscope — Custom Stickers & Designs',
    description: 'Create custom stickers, browse our collection, or design your own.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'bioscope',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'bioscope — Custom Stickers & Designs',
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
      <body className="min-h-screen bg-paper font-body antialiased flex flex-col">
        <MotionConfig reducedMotion="user">
          <Providers>
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster
              position="bottom-right"
              theme="system"
              toastOptions={{
                className: 'sonner-toast',
              }}
            />
          </Providers>
        </MotionConfig>
      </body>
    </html>
  )
}