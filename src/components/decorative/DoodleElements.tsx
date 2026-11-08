'use client'

import { cn } from '@/lib/utils'

// DoodleShape - organic blob shapes
/**
 * @deprecated Legacy shim with no direct equivalent in the new decor set yet — see @/components/decorative.
 */
export function DoodleShape({
  className,
  size = 'md',
  color = 'primary',
  animation = 'float',
  style,
  ...props
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'accent' | 'ink'
  animation?: 'float' | 'wobble' | 'pulse' | 'rotate' | 'none'
  style?: React.CSSProperties
}) {
  const sizes = { sm: 60, md: 120, lg: 200, xl: 300 }
  const animations = {
    float: 'animate-float-gentle',
    wobble: 'animate-wobble',
    pulse: 'animate-pulse-soft',
    rotate: 'animate-rotate-slow',
    none: '',
  }

  const pathSize = sizes[size]

  // Generate organic SVG path
  const pathData = `M${pathSize * 0.5},0
    C${pathSize * 0.8},${pathSize * 0.1} ${pathSize * 0.9},${pathSize * 0.4} ${pathSize},${pathSize * 0.5}
    C${pathSize * 0.9},${pathSize * 0.6} ${pathSize * 0.8},${pathSize * 0.9} ${pathSize * 0.5},${pathSize}
    C${pathSize * 0.2},${pathSize * 0.9} ${pathSize * 0.1},${pathSize * 0.6} 0,${pathSize * 0.5}
    C${pathSize * 0.1},${pathSize * 0.4} ${pathSize * 0.2},${pathSize * 0.1} ${pathSize * 0.5},0`

  return (
    <svg
      width={pathSize}
      height={pathSize}
      viewBox={`0 0 ${pathSize} ${pathSize}`}
      className={cn('text-[var(--', color, ')]', animations[animation], className)}
      aria-hidden="true"
      style={style}
      {...props}
    >
      <path d={pathData} fill="currentColor" fillOpacity={0.15} />
    </svg>
  )
}

// WashiTape - decorative tape strip
/**
 * @deprecated Use WashiTape from '@/components/decorative' instead.
 */
export function WashiTape({
  children,
  rotation = -2,
  width = 140,
  height = 28,
  className,
}: {
  children?: React.ReactNode
  rotation?: number
  width?: number
  height?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative',
        'bg-gradient-to-r from-[var(--accent)] to-[var(--pink)]',
        'border-2 border-[var(--ink)]',
        'shadow-[2px_2px_0_var(--ink)]',
        className
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {children}
    </div>
  )
}

// StickerPeel - corner peel effect
/**
 * @deprecated Use StickerPeel from '@/components/decorative' instead.
 */
export function StickerPeel({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute top-[-4px] right-[-4px] w-4.5 h-4.5 bg-[var(--primary)] border-2 border-[var(--ink)] rounded-tr-full shadow-[2px_2px_0_var(--ink)]" />
    </div>
  )
}

// TornEdge - paper tear effect
/**
 * @deprecated Use TornEdge from '@/components/decorative' instead.
 */
export function TornEdge({ position = 'top', className }: { position?: 'top' | 'bottom'; className?: string }) {
  const clipPaths = {
    top: 'polygon(0 0, 100% 0, 100% 92%, 92% 100%, 8% 92%, 0 100%)',
    bottom: 'polygon(0 0, 100% 0, 100% 100%, 92% 100%, 8% 92%, 0 92%)',
  }
  return (
    <div className={cn('relative', className)} style={{ clipPath: clipPaths[position] }} />
  )
}

// SketchUnderline - hand-drawn underline
/**
 * @deprecated Use SketchUnderline from '@/components/decorative' instead.
 */
export function SketchUnderline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      <span className="absolute bottom-[-4px] left-0 w-full h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--pink)] rounded-[9999px_4px] opacity-70" />
    </span>
  )
}

// DoodleScribble - hand-drawn scribble decoration
/**
 * @deprecated Use DoodleSquiggle from '@/components/decorative' instead.
 */
export function DoodleScribble({
  className,
  color = 'primary',
  width = 80,
  height = 40,
}: {
  className?: string
  color?: 'primary' | 'secondary' | 'accent' | 'ink'
  width?: number
  height?: number
}) {
  const pathData = `M0,${height * 0.5}
    C${width * 0.2},${height * 0.2} ${width * 0.4},${height * 0.8} ${width * 0.5},${height * 0.5}
    C${width * 0.6},${height * 0.2} ${width * 0.8},${height * 0.8} ${width},${height * 0.5}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('text-[var(--', color, ')]', className)}
      aria-hidden="true"
    >
      <path d={pathData} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
    </svg>
  )
}

// DoodleStar - decorative star shape
/**
 * @deprecated Use DoodleStar from '@/components/decorative' instead.
 */
export function DoodleStar({
  className,
  size = 'md',
  color = 'accent',
  animation = 'none',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'accent' | 'ink'
  animation?: 'float' | 'wobble' | 'pulse' | 'rotate' | 'none'
}) {
  const sizes = { sm: 24, md: 40, lg: 64 }
  const animations = {
    float: 'animate-float-gentle',
    wobble: 'animate-wobble',
    pulse: 'animate-pulse-soft',
    rotate: 'animate-rotate-slow',
    none: '',
  }

  const pathSize = sizes[size]

  return (
    <svg
      width={pathSize}
      height={pathSize}
      viewBox={`0 0 ${pathSize} ${pathSize}`}
      className={cn('text-[var(--', color, ')]', animations[animation], className)}
      aria-hidden="true"
    >
      <polygon
        points={`${pathSize * 0.5},0 ${pathSize * 0.62},${pathSize * 0.35} ${pathSize},${pathSize * 0.35} ${pathSize * 0.7},${pathSize * 0.58} ${pathSize * 0.82},${pathSize} ${pathSize * 0.5},${pathSize * 0.7} ${pathSize * 0.18},${pathSize} ${pathSize * 0.3},${pathSize * 0.58} 0,${pathSize * 0.35} ${pathSize * 0.38},${pathSize * 0.35}`}
        fill="currentColor"
        fillOpacity={0.2}
      />
    </svg>
  )
}