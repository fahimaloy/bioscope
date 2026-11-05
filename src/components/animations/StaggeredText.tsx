'use client'

import { useEffect, useRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface StaggeredTextProps extends HTMLAttributes<HTMLHeadingElement> {
  children: string
  delay?: number
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'span'
}

export function StaggeredText({
  children,
  delay = 150,
  className,
  as: Component = 'h1',
  ...props
}: StaggeredTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const spans = element.querySelectorAll('span')
    spans.forEach((span, index) => {
      const htmlSpan = span as HTMLElement
      htmlSpan.style.animationDelay = `${index * delay}ms`
    })
  }, [delay])

  const chars = children.split('')

  return (
    <Component
      ref={containerRef}
      className={cn(
        'flex flex-wrap justify-center',
        'font-display',
        className
      )}
      {...props}
    >
      {chars.map((char, index) => (
        <span
          key={index}
          className="inline-block opacity-0"
          style={{
            animationDelay: `${index * delay}ms`,
            textShadow: '4px 4px 0px var(--primary)',
          }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
      <style jsx>{`
        span {
          animation: revealLetter 0.6s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes revealLetter {
          from { opacity: 0; transform: translateY(50px) rotate(-10deg); }
          to { opacity: 1; transform: translateY(0) rotate(0); }
        }
      `}</style>
    </Component>
  )
}

// Simpler version without jsx styles (for global CSS)
export function StaggeredTextSimple({
  children,
  delay = 150,
  className,
  as: Component = 'h1',
  ...props
}: StaggeredTextProps) {
  const chars = children.split('')

  return (
    <Component
      className={cn('flex flex-wrap justify-center font-display', className)}
      {...props}
    >
      {chars.map((char, index) => (
        <span
          key={index}
          className="staggered-char"
          style={{ animationDelay: `${index * delay}ms` }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </Component>
  )
}