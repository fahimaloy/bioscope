/**
 * Decor / doodle set — spec §5.7, rebuilt on the token system.
 *
 * One decor accent per section, maximum (docs/DESIGN_CONTRACT.md §3). Every
 * piece here is decorative: `aria-hidden` unless it wraps meaningful text, in
 * which case only the decoration itself is hidden.
 *
 * The legacy `DoodleBackground.tsx` / `DoodleElements.tsx` remain in place for
 * the tasks that rebuild their consumers; they are not re-exported here.
 */

export { WashiTape } from './WashiTape'
export type { WashiTapeColor, WashiTapeProps } from './WashiTape'

export { StickerPeel } from './StickerPeel'
export type { StickerPeelProps } from './StickerPeel'

export { TornEdge } from './TornEdge'
export type { TornEdgeColor, TornEdgeProps } from './TornEdge'

export { SketchUnderline } from './SketchUnderline'
export type { SketchUnderlineColor, SketchUnderlineProps } from './SketchUnderline'

export { DoodleStar } from './DoodleStar'
export type { DoodleAnimation, DoodleColor, DoodleStarProps } from './DoodleStar'

export { DoodleHeart } from './DoodleHeart'
export type { DoodleHeartProps } from './DoodleHeart'

export { DoodleArrow } from './DoodleArrow'
export type { DoodleArrowProps } from './DoodleArrow'

export { DoodleSquiggle } from './DoodleSquiggle'
export type { DoodleSquiggleProps } from './DoodleSquiggle'

export { DoodleSparkle } from './DoodleSparkle'
export type { DoodleSparkleProps } from './DoodleSparkle'

export { DoodleScatter, SCATTER_MAX } from './DoodleScatter'
export type { DoodleScatterProps } from './DoodleScatter'

export { MarqueeRibbon } from './MarqueeRibbon'
export type { MarqueeRibbonProps } from './MarqueeRibbon'

export { GrainOverlay } from './GrainOverlay'
export type { GrainOverlayProps } from './GrainOverlay'

export { GridPaper } from './GridPaper'
export type { GridPaperProps } from './GridPaper'
