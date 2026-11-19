'use client'

import { useEffect } from 'react'
import { ErrorBoundaryFallback } from '@/components/ui/ErrorBoundary'
// global-error replaces the root layout, so it must supply its own <html>/<body>
// (Next.js requirement) and import the global stylesheet itself — otherwise the
// fallback renders unstyled (no tokens/utilities). The next/font --font-* vars
// live on the root layout's <html> and are absent here; display type gracefully
// falls back to the system face on this rare error surface.
import '@/app/globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to an error reporting service (no PII — digest only).
    console.error('Global error:', error.digest ?? error.message)
  }, [error])

  return (
    <html lang="en">
      <body>
        <ErrorBoundaryFallback error={error} onRetry={reset} />
      </body>
    </html>
  )
}
