'use client'
import { ReactNode } from 'react'
import Image from 'next/image'

interface DoodleScatterProps {
  count?: number
  className?: string
}

const doodles = [
  '/doodles/star.svg',
  '/doodles/arrow.svg',
]

export function DoodleScatter({ count = 4, className }: DoodleScatterProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className || ''}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Image
          key={i}
          src={doodles[i % doodles.length]}
          alt=""
          width={48}
          height={48}
          className="absolute opacity-60"
          style={{
            top: `${10 + (i * 25) % 70}%`,
            left: `${5 + (i * 30) % 85}%`,
            transform: `rotate(${(i * 15) - 30}deg) scale(${0.8 + (i % 3) * 0.3})`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}
    </div>
  )
}
