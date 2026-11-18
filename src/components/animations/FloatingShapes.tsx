'use client'

import { cn } from '@/lib/utils'

interface FloatingShapesProps {
  className?: string
  colors?: string[]
  count?: number
}

export function FloatingShapes({
  className,
  colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--primary)'],
  count = 4,
}: FloatingShapesProps) {
  const shapes = Array.from({ length: count }, (_, i) => {
    const sizes = [300, 400, 250, 200, 350, 280]
    const delays = [0, -5, -10, -15, -3, -8]

    return (
      <div
        key={i}
        className={cn('shape')}
        style={{
          width: `${sizes[i % sizes.length]}px`,
          height: `${sizes[i % sizes.length]}px`,
          background: colors[i % colors.length],
          animationDelay: `${delays[i % delays.length]}s`,
        } as React.CSSProperties}
      />
    )
  })

  return (
    <div
      className={cn('bg-shapes', className)}
      aria-hidden="true"
    >
      {shapes}
    </div>
  )
}

