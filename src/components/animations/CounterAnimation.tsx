'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CounterAnimationProps {
  target: number
  duration?: number
  start?: number
  className?: string
  onComplete?: () => void
  format?: (value: number) => string
  children?: ReactNode
}

export function CounterAnimation({
  target,
  duration = 2000,
  start = 0,
  className,
  onComplete,
  format = (v) => Math.ceil(v).toLocaleString(),
  children,
}: CounterAnimationProps) {
  const [count, setCount] = useState<string>(() => format(start))
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (target - start) * eased

      setCount(format(current))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setCount(format(target))
        onComplete?.()
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isVisible, target, start, duration, format, onComplete])

  return (
    <div
      ref={elementRef}
      className={cn('font-display', className)}
      aria-live="polite"
    >
      {count}
      {children}
    </div>
  )
}

// Simple counter for multiple counters
interface StatCounterProps {
  value: number
  label: string
  className?: string
}

export function StatCounter({ value, label, className }: StatCounterProps) {
  return (
    <div className={cn('stat-item', className)}>
      <CounterAnimation target={value} className="text-4xl" format={(v) => Math.ceil(v).toString() + '+'} />
      <p className="font-black text-uppercase text-sm mt-1">{label}</p>
    </div>
  )
}