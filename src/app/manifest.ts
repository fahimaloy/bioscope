import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BIOSCOPE — Custom Stickers & Designs',
    short_name: 'BIOSCOPE',
    description: 'Design and print fun custom stickers, doodle art, and vintage-style vinyl.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF3E3',
    theme_color: '#241B12',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/images/bioscope-logo.png', sizes: '500x500', type: 'image/png', purpose: 'any' },
    ],
  }
}
