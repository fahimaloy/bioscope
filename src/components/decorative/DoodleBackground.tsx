'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { DoodleShape } from './DoodleElements'
import { cn } from '@/lib/utils'

/**
 * @deprecated Legacy full-screen floating background with no direct equivalent in the new decor set yet — see @/components/decorative.
 */
export function DoodleBackground({
  shapeCount = 8,
  className,

}: {
  shapeCount?: number
  className?: string
  interactive?: boolean
}) {
  const shapesRef = useRef<
    Array<{
      x: number
      y: number
      size: 'sm' | 'md' | 'lg'
      color: 'primary' | 'secondary' | 'accent' | 'ink'
      delay: number
      duration: number
    }>
  >([])

  useEffect(() => {
    const colors = ['primary', 'secondary', 'accent', 'ink'] as const satisfies ('primary' | 'secondary' | 'accent' | 'ink')[]
    const sizes = ['sm', 'md', 'lg'] as const

    shapesRef.current = Array.from({ length: shapeCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 15,
    }))
  }, [shapeCount])

  return (
    <div
      className={cn(
        'fixed inset-0 -z-10 overflow-hidden pointer-events-none',
        className
      )}
      aria-hidden="true"
    >
      {shapesRef.current.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            opacity: 0.15,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <DoodleShape size={shape.size} color={shape.color} animation="none" />
        </motion.div>
      ))}
    </div>
  )
}