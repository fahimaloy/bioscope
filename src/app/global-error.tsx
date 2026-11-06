'use client'

import { useEffect } from 'react'
import { ErrorBoundaryFallback } from '@/components/ui/ErrorBoundary'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return <ErrorBoundaryFallback error={error} onRetry={reset} />
}