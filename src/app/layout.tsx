import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Shantell_Sans, Caveat, Nunito } from 'next/font/google'
import { MotionConfig } from 'framer-motion'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import { Footer } from '@/components/layout/Footer'

const shantell = Shantell_Sans({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: ['400','700','800'] })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-hand', display: 'swap', weight: ['400','600','700'] })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap', weight: ['300','400','600','800'] })


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
        url: '/og-image.jpg',
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
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: 'var(--primary)',
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
    <html lang="en" className={`${shantell.variable} ${caveat.variable} ${nunito.variable} scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://utfs.io" />
      </head>
      <body className="min-h-screen bg-[var(--bg-color)] font-body antialiased flex flex-col">
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