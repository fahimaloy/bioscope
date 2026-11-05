'use client'

import { ReactNode } from 'react'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: ReactNode
  background?: 'default' | 'doodle' | 'grid' | 'none'
  className?: string
}

export function PageWrapper({ children, background = 'doodle', className }: PageWrapperProps) {
  return (
    <div className={cn('min-h-screen bg-[var(--bg-primary)] relative', className)}>
      {background === 'doodle' && <DoodleBackground shapeCount={6} />}
      {/* {background === 'grid' && <GridBackground />} */}
      <main className="relative z-10 pt-16 pb-12">{children}</main>
    </div>
  )
}