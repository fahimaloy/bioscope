'use client'

import { DoodleBackground } from './DoodleBackground'

export function DoodleScatter({
  count = 6,
  className,
  interactive = false,
}: {
  count?: number
  className?: string
  interactive?: boolean
}) {
  return <DoodleBackground shapeCount={count} className={className} interactive={interactive} />
}