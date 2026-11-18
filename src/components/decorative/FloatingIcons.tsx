import type { CSSProperties, ComponentType } from 'react'
import {
  Brush,
  Drama,
  Flower2,
  Heart,
  Music,
  Palette,
  PenTool,
  Pencil,
  Rainbow,
  Rocket,
  Ruler,
  Scissors,
  Sparkle,
  Sparkles,
  Star,
  Sticker,
  Sun,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Floating craft icons — the fixed, decorative field that floats behind every
 * page. One mount in the root layout (`src/app/layout.tsx`); individual pages
 * should NOT mount their own.
 *
 * The set mirrors the old login/signup floating-emoji vocabulary (🎨→Palette,
 * ✨→Sparkles, 🌈→Rainbow, 🎭→Drama) plus more stationery / vintage /
 * paper-craft icons (Scissors, Sticker, Pencil, Ruler, Brush, Flower2…). The
 * design contract bans emoji as icons, so the whole field is Lucide.
 *
 * Icons hug the edges and stay translucent so body copy and cards stay
 * legible; motion is a slow bob (`@keyframes floating-drift` in globals.css)
 * and collapses entirely under `prefers-reduced-motion`.
 */

interface FloatingIconSpec {
  Icon: ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>
  /** Edge placement — percentages of the viewport. */
  position: CSSProperties
  size: number
  color: string
  /** Drift amplitude/rotation seeds so no two icons bob in phase. */
  rot: number
  dur: number
  delay: number
  opacity: number
}

const ICONS: readonly FloatingIconSpec[] = [
  { Icon: Palette, position: { top: '13%', left: '4%' }, size: 46, color: 'var(--pink-strong)', rot: -8, dur: 11, delay: 0, opacity: 0.42 },
  { Icon: Sparkles, position: { top: '9%', right: '7%' }, size: 38, color: 'var(--gold)', rot: 6, dur: 9, delay: -2, opacity: 0.45 },
  { Icon: Rainbow, position: { top: '19%', right: '22%' }, size: 42, color: 'var(--teal)', rot: 5, dur: 12, delay: -4, opacity: 0.38 },
  { Icon: Sun, position: { top: '24%', left: '15%' }, size: 30, color: 'var(--gold)', rot: -6, dur: 10, delay: -1, opacity: 0.4 },
  { Icon: Sparkle, position: { top: '15%', left: '29%' }, size: 24, color: 'var(--blue)', rot: 5, dur: 8, delay: -3, opacity: 0.42 },
  { Icon: Scissors, position: { top: '36%', left: '2.5%' }, size: 40, color: 'var(--orange)', rot: -6, dur: 13, delay: -5, opacity: 0.4 },
  { Icon: Drama, position: { top: '33%', right: '3%' }, size: 46, color: 'var(--pink-strong)', rot: 7, dur: 11, delay: -2.5, opacity: 0.4 },
  { Icon: Star, position: { top: '50%', right: '2.5%' }, size: 32, color: 'var(--gold)', rot: -9, dur: 9, delay: -6, opacity: 0.45 },
  { Icon: PenTool, position: { top: '52%', left: '5%' }, size: 34, color: 'var(--blue)', rot: 8, dur: 12, delay: -3.5, opacity: 0.4 },
  { Icon: Ruler, position: { top: '45%', left: '11%' }, size: 26, color: 'var(--ink-muted)', rot: -4, dur: 10, delay: -1.5, opacity: 0.35 },
  { Icon: Flower2, position: { top: '60%', right: '12%' }, size: 30, color: 'var(--pink)', rot: 8, dur: 13, delay: -4.5, opacity: 0.4 },
  { Icon: Sticker, position: { top: '71%', left: '2%' }, size: 44, color: 'var(--violet)', rot: -7, dur: 11, delay: -2, opacity: 0.4 },
  { Icon: Brush, position: { top: '67%', right: '5%' }, size: 38, color: 'var(--teal)', rot: 6, dur: 12, delay: -5.5, opacity: 0.38 },
  { Icon: Heart, position: { bottom: '15%', left: '9%' }, size: 36, color: 'var(--pink)', rot: -5, dur: 10, delay: -3, opacity: 0.42 },
  { Icon: Rocket, position: { bottom: '9%', left: '30%' }, size: 32, color: 'var(--blue)', rot: 10, dur: 14, delay: -7, opacity: 0.38 },
  { Icon: Pencil, position: { bottom: '14%', right: '11%' }, size: 36, color: 'var(--orange)', rot: -8, dur: 9, delay: -1, opacity: 0.42 },
  { Icon: Music, position: { bottom: '8%', right: '29%' }, size: 30, color: 'var(--violet)', rot: 6, dur: 11, delay: -4, opacity: 0.4 },
] as const

export interface FloatingIconsProps {
  className?: string
}

export function FloatingIcons({ className }: FloatingIconsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'floating-icons pointer-events-none fixed inset-0 -z-10 overflow-hidden',
        className
      )}
    >
      {ICONS.map(({ Icon, position, size, color, rot, dur, delay, opacity }, index) => (
        <span
          key={index}
          className="floating-icon"
          style={
            {
              ...position,
              color,
              opacity,
              '--float-rot': `${rot}deg`,
              '--float-dur': `${dur}s`,
              '--float-delay': `${delay}s`,
            } as CSSProperties
          }
        >
          <Icon size={size} strokeWidth={1.6} />
        </span>
      ))}
    </div>
  )
}
