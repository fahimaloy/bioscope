'use client'

import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

/**
 * E12 — reusable fetch-error state on the doodle language with a retry
 * affordance. Used by fetch surfaces (orders, etc.) so a failed load shows an
 * honest, recoverable error instead of a misleading empty state or a transient
 * toast alone.
 */
export function FetchErrorState({
  message = 'Something went wrong while loading. Please try again.',
  onRetry,
  retryLabel = 'Try again',
}: {
  message?: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <Card variant="doodle" padding="lg" className="relative text-center" role="alert">
      <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[var(--error)]" aria-hidden="true" />
      <p className="mb-4 text-[var(--text-muted)]">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </Card>
  )
}
