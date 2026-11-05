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

// Floating emojis for hero section
interface FloatingEmojisProps {
  emojis?: string[]
  className?: string
}

export function FloatingEmojis({
  emojis = ['😎', '🎨', '✨', '⚡'],
  className,
}: FloatingEmojisProps) {
  const positions = [
    { top: '20%', left: '15%', delay: '0s' },
    { top: '30%', right: '15%', delay: '0.5s', fontSize: '4rem' },
    { bottom: '30%', left: '20%', delay: '1s' },
    { bottom: '20%', right: '25%', delay: '1.5s' },
  ]

  return (
    <div className={cn('floating-emojis pointer-events-none', className)} aria-hidden="true">
      {emojis.map((emoji, i) => (
        <span
          key={i}
          className={cn('emoji', `e${i + 1}`)}
          style={{
            ...positions[i % positions.length],
            fontSize: positions[i % positions.length].fontSize || '3rem',
            animationDelay: positions[i % positions.length].delay,
          } as React.CSSProperties}
        >
          {emoji}
        </span>
      ))}
    </div>
  )
}