import { Children, type ComponentType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DoodleArrow } from './DoodleArrow'
import { DoodleHeart } from './DoodleHeart'
import { DoodleSparkle } from './DoodleSparkle'
import { DoodleSquiggle } from './DoodleSquiggle'
import { DoodleStar, type DoodleAnimation, type DoodleColor } from './DoodleStar'

/**
 * Doodle scatter — the composed decor accent of spec §5.7.
 *
 * Scatters up to `count` doodles across a `relative` section, each positioned
 * with inline `left`/`top`/`rotate` derived from a deterministic seed, so a
 * section renders the same layout on the server and the client (no hydration
 * drift, no `Math.random()`).
 *
 * The component accepts a hard maximum of 8 elements; the design rule remains
 * **one accent per section, ≤ 6 elements** (docs/DESIGN_CONTRACT.md §3).
 * Pass `children` to scatter your own doodles instead of the built-in set.
 *
 * Purely decorative: `aria-hidden`, no text of its own.
 */

/** Hard ceiling on scattered elements, regardless of the `count` prop. */
export const SCATTER_MAX = 8

interface ScatterSlot {
  left: string
  top: string
  rotate: string
  size: number
}

/**
 * FNV-1a over `seed:index`, normalised to 0–1. Deterministic across renders,
 * servers and browsers — unlike `Math.random()`, which would hydration-mismatch.
 */
function seededUnit(seed: string, index: number, salt: number): number {
  let hash = 2166136261 ^ salt
  const input = `${seed}:${index}`
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 10000) / 10000
}

function buildSlots(count: number, seed: string): ScatterSlot[] {
  return Array.from({ length: count }, (_, index) => ({
    left: `${(4 + seededUnit(seed, index, 11) * 88).toFixed(1)}%`,
    top: `${(4 + seededUnit(seed, index, 23) * 88).toFixed(1)}%`,
    rotate: `rotate(${Math.round(seededUnit(seed, index, 37) * 36 - 18)}deg)`,
    size: 20 + Math.round(seededUnit(seed, index, 53) * 28),
  }))
}

type ScatterDoodle = ComponentType<{
  size?: number
  color?: DoodleColor
  animation?: DoodleAnimation
  className?: string
}>

/** Built-in scatter set, cycled when the caller supplies no children. */
const DEFAULT_SHAPES: ReadonlyArray<{
  Component: ScatterDoodle
  color: DoodleColor
  animation: DoodleAnimation
}> = [
  { Component: DoodleStar, color: 'gold', animation: 'float' },
  { Component: DoodleHeart, color: 'pink', animation: 'wobble' },
  { Component: DoodleArrow, color: 'teal', animation: 'none' },
  { Component: DoodleSquiggle, color: 'violet', animation: 'none' },
  { Component: DoodleSparkle, color: 'orange', animation: 'pulse' },
  { Component: DoodleStar, color: 'blue', animation: 'spin' },
  { Component: DoodleHeart, color: 'red', animation: 'float' },
  { Component: DoodleSparkle, color: 'lime', animation: 'wobble' },
]

export interface DoodleScatterProps {
  /** Number of elements to scatter. Default 6, hard max 8. */
  count?: number
  /** Layout seed — the same seed always yields the same scatter. */
  seed?: string
  className?: string
  /** Doodles to scatter instead of the built-in set. */
  children?: ReactNode
}

export function DoodleScatter({
  count = 6,
  seed = 'bioscope',
  className,
  children,
}: DoodleScatterProps) {
  const shapeCount = Math.max(0, Math.min(SCATTER_MAX, Math.floor(count)))
  const slots = buildSlots(shapeCount, seed)
  const kids = Children.toArray(children).slice(0, shapeCount)

  const nodes: ReactNode[] =
    kids.length > 0
      ? kids
      : DEFAULT_SHAPES.slice(0, shapeCount).map(({ Component, color, animation }, index) => (
          <Component
            key={index}
            size={slots[index].size}
            color={color}
            animation={animation}
          />
        ))

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {nodes.map((node, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: slots[index].left,
            top: slots[index].top,
            transform: slots[index].rotate,
          }}
        >
          {node}
        </div>
      ))}
    </div>
  )
}
