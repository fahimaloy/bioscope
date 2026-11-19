/**
 * E6 — single source of the public site origin for SEO files (sitemap, robots,
 * manifest, canonical URLs). Mirrors the root layout's metadataBase. Strips
 * nested quotes (the .env UntrustedHost trap) and trailing slashes.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return raw.replace(/^["']|["']$/g, '').replace(/\/+$/, '')
}
