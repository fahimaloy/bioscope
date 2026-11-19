'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StickerPreview } from './StickerCanvas'
import type { StickerDesign, MaterialType, FinishType, CutType } from '@/types'
import {
  Eye,
  Download,
  Maximize,
  Minimize,
  Share2,
  Copy,
  Laptop,
  Smartphone,
  BookOpen,
  Droplet,
  Package,
  Sparkles,
  Scissors,
  type LucideIcon,
} from 'lucide-react'
import { WashiTape } from '@/components/decorative'
import { useMotionVariants } from '@/lib/motion'
import { motion } from 'framer-motion'

const MATERIAL_INFO: Record<MaterialType, { name: string; description: string; durability: string }> = {
  vinyl: { name: 'Vinyl', description: 'Durable, weatherproof, waterproof', durability: '3-5 years outdoor' },
  paper: { name: 'Paper', description: 'Eco-friendly, indoor use only', durability: '1-2 years indoor' },
  holographic: { name: 'Holographic', description: 'Color-shifting, eye-catching', durability: '2-3 years outdoor' },
  clear: { name: 'Clear', description: 'Transparent, seamless look', durability: '2-3 years outdoor' },
  kraft: { name: 'Kraft Paper', description: 'Natural, rustic, biodegradable', durability: '1-2 years indoor' },
}

const FINISH_INFO: Record<FinishType, { name: string; description: string }> = {
  matte: { name: 'Matte', description: 'Non-reflective, subtle finish' },
  glossy: { name: 'Glossy', description: 'Shiny, vibrant colors' },
  transparent: { name: 'Transparent', description: 'Clear, no background' },
}

const CUT_INFO: Record<CutType, { name: string; description: string }> = {
  kiss_cut: { name: 'Kiss Cut', description: 'Sticker peels off backing, backing stays intact' },
  die_cut: { name: 'Die Cut', description: 'Cut to exact shape, no excess backing' },
  custom: { name: 'Custom Shape', description: 'Custom die line for unique shapes' },
}

/**
 * Material surfaces are flat token fills. The contract bans gradients on brand
 * surfaces (§5), so the legacy simulated sheens are gone — the material is
 * communicated by the spec copy and the swatch colour, not by a fake gradient.
 */
const MATERIAL_SURFACE: Record<MaterialType, string> = {
  vinyl: 'bg-[var(--surface-raised)]',
  holographic: 'bg-[var(--violet)]',
  clear: 'bg-[var(--surface-raised)]',
  paper: 'bg-[var(--paper)]',
  kraft: 'bg-[var(--paper-deep)]',
}

interface PreviewPanelProps {
  design: StickerDesign
  material: MaterialType
  finish: FinishType
  cutType: CutType
  quantity: number
  livePrice: number
  onExport: (format: 'png' | 'jpg' | 'pdf' | 'svg') => void
  className?: string
}

export function PreviewPanel({
  design,
  material,
  finish,
  cutType,
  quantity,
  livePrice,
  onExport,
  className,
}: PreviewPanelProps) {
  const variants = useMotionVariants()
  const [viewMode, setViewMode] = useState<'canvas' | '3d' | 'mockup'>('canvas')
  const [showSpecs, setShowSpecs] = useState(true)
  const [copied, setCopied] = useState(false)

  const materialInfo = MATERIAL_INFO[material]
  const finishInfo = FINISH_INFO[finish]
  const cutInfo = CUT_INFO[cutType]

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <Card variant="default" padding="none" className={cn('flex flex-col h-full', className)}>
      {/* Header — the panel's one decor accent */}
      <div className="p-4 border-b border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
        <div className="flex items-center gap-3 mb-3">
          <WashiTape color="gold" width={84} height={22} />
          <h3 className="font-display text-xl text-[var(--ink)]">Live Preview</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSpecs(!showSpecs)}>
              {showSpecs ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              Specs
            </Button>
          </div>
          <div className="flex items-center gap-1 bg-[var(--paper-deep)] rounded-[var(--radius-md)] px-3 py-1">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('canvas')} className={viewMode === 'canvas' ? 'bg-[var(--surface-raised)] shadow-ink-1' : ''} aria-label="Canvas view">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('3d')} className={viewMode === '3d' ? 'bg-[var(--surface-raised)] shadow-ink-1' : ''} aria-label="3D view">
              <Maximize className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('mockup')} className={viewMode === 'mockup' ? 'bg-[var(--surface-raised)] shadow-ink-1' : ''} aria-label="Mockup view">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-hidden p-4">
        {viewMode === 'canvas' && (
          <motion.div
            key="canvas"
            initial="hidden"
            animate="visible"
            variants={variants.slideInRight}
            className="w-full h-full flex items-center justify-center"
          >
            <StickerPreview design={design} width={500} height={500} />
          </motion.div>
        )}

        {viewMode === '3d' && (
          <motion.div
            key="3d"
            initial="hidden"
            animate="visible"
            variants={variants.slideInRight}
            className="w-full h-full flex items-center justify-center"
          >
            <Sticker3DPreview design={design} material={material} finish={finish} cutType={cutType} />
          </motion.div>
        )}

        {viewMode === 'mockup' && (
          <motion.div
            key="mockup"
            initial="hidden"
            animate="visible"
            variants={variants.slideInRight}
            className="w-full h-full flex items-center justify-center p-4"
          >
            <MockupPreview design={design} />
          </motion.div>
        )}
      </div>

      {/* Specs Panel */}
      {showSpecs && (
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          exit={{ scaleY: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ transformOrigin: 'top' }}
          className="border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)] overflow-hidden"
        >
          <div className="p-4 space-y-4">
            <h4 className="font-display text-lg text-[var(--ink)]">Specifications</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <SpecItem label="Size" value={`${design.canvas.width} × ${design.canvas.height} cm`} />
              <SpecItem label="Area" value={`${(design.canvas.width * design.canvas.height).toFixed(1)} cm²`} />
              <SpecItem label="Resolution" value={`${design.canvas.dpi} DPI`} />
              <SpecItem label="Pixels" value={`${Math.round(design.canvas.width * design.canvas.dpi / 2.54)} × ${Math.round(design.canvas.height * design.canvas.dpi / 2.54)}`} />
            </div>

            {/* Material Texture Preview */}
            <div className="pt-2 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
              <MaterialTexturePreview material={material} finish={finish} />
            </div>

            {/* Cut Line Preview */}
            <div className="pt-2 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
              <CutLinePreview cutType={cutType} />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
              <SpecDetail
                icon={Package}
                label="Material"
                value={materialInfo.name}
                description={materialInfo.description}
                badge={materialInfo.durability}
              />
              <SpecDetail
                icon={Sparkles}
                label="Finish"
                value={finishInfo.name}
                description={finishInfo.description}
              />
              <SpecDetail
                icon={Scissors}
                label="Cut Type"
                value={cutInfo.name}
                description={cutInfo.description}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
              <Badge variant="doodle" size="sm">Layers: {design.layers.length}</Badge>
              <Badge variant="secondary" size="sm">Background: {design.background ? 'Yes' : 'No'}</Badge>
              <Badge variant="outline" size="sm">Export Ready</Badge>
            </div>
          </div>
        </motion.div>
      )}

      {/* Export Actions & Price */}
      <div className="border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)] p-4 space-y-4">
        {/* Live Price Summary */}
        <div className="bg-[color-mix(in_srgb,var(--brand)_5%,transparent)] border-2 border-[var(--brand)] rounded-[var(--radius-lg)] p-4 text-center">
          <div className="text-sm text-[var(--brand)] mb-1">Estimated Total (Qty: {quantity})</div>
          <motion.div
            className="font-display text-2xl text-[var(--brand)]"
            variants={variants.pulseSoft}
            animate="initial"
          >
            ৳{livePrice.toLocaleString()} BDT
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => onExport('png')} className="flex-1 min-w-[120px]">
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
          <Button variant="secondary" onClick={() => onExport('jpg')} className="flex-1 min-w-[120px]">
            <Download className="w-4 h-4 mr-2" />
            Export JPG
          </Button>
          <Button variant="outline" onClick={() => onExport('pdf')} className="flex-1 min-w-[120px]">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => onExport('svg')} className="flex-1 min-w-[120px]">
            <Download className="w-4 h-4 mr-2" />
            Export SVG
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </>
            )}
          </Button>
          <Button variant="primary" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share Design
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Spec Item Component
function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[var(--paper-deep)] rounded-[var(--radius-md)]">
      <div className="text-xs text-[var(--text-subtle)] uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-lg text-[var(--brand)]">{value}</div>
    </div>
  )
}

// Spec Detail Component
function SpecDetail({
  icon: Icon,
  label,
  value,
  description,
  badge,
}: { icon: LucideIcon; label: string; value: string; description: string; badge?: string }) {
  return (
    <div className="p-4 bg-[var(--paper-deep)] rounded-[var(--radius-md)] text-center">
      <Icon className="w-7 h-7 mx-auto mb-2 text-[var(--brand)]" />
      <div className="font-medium text-[var(--text)] text-[var(--ink)]">{label}</div>
      <div className="font-display text-lg text-[var(--brand)] mt-1">{value}</div>
      <div className="text-xs text-[var(--text-subtle)] mt-1">{description}</div>
      {badge && (
        <Badge variant="secondary" size="sm" className="mt-2 mx-auto w-fit">
          {badge}
        </Badge>
      )}
    </div>
  )
}

// Material Texture Preview
function MaterialTexturePreview({ material, finish }: { material: MaterialType; finish: FinishType }) {
  const base = 'w-full h-20 rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] relative overflow-hidden'

  const getFinishOverlay = () => {
    switch (finish) {
      case 'glossy':
        return 'absolute inset-0 bg-[color-mix(in_srgb,var(--die-cut)_30%,transparent)] pointer-events-none'
      case 'matte':
      case 'transparent':
      default:
        return 'absolute inset-0 pointer-events-none'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-[var(--text)] text-[var(--ink)]">Material Texture</span>
        <Badge variant="doodle" size="sm">{MATERIAL_INFO[material].name} / {FINISH_INFO[finish].name}</Badge>
      </div>
      <div className="relative">
        <div className={cn(base, MATERIAL_SURFACE[material])}>
          <div className={getFinishOverlay()} />
        </div>
      </div>
      <p className="text-xs text-[var(--text-subtle)] mt-2 text-center">
        {MATERIAL_INFO[material].description} • {FINISH_INFO[finish].description}
      </p>
    </div>
  )
}

// Cut Line Preview
function CutLinePreview({ cutType }: { cutType: CutType }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-[var(--text)] text-[var(--ink)]">Cut Line Preview</span>
        <Badge variant="secondary" size="sm">{CUT_INFO[cutType].name}</Badge>
      </div>
      <div className="relative w-full h-24 flex items-center justify-center bg-[var(--paper-deep)] rounded-[var(--radius-md)] border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
        {/* Sticker shape */}
        <div className="relative w-32 h-32">
          {/* Background sticker */}
          <div className="absolute inset-0 bg-[var(--surface-raised)] border-2 border-[var(--ink)] rounded-full shadow-ink-1" />

          {/* Cut line */}
          {cutType === 'kiss_cut' && (
            <>
              {/* Kiss cut - inner line */}
              <div className="absolute inset-2 border-2 border-dashed border-[color-mix(in_srgb,var(--brand)_60%,transparent)] rounded-full" />
              {/* Backing paper */}
              <div className="absolute -inset-2 border-2 border-dashed border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-full" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-t-full" />
            </>
          )}

          {cutType === 'die_cut' && (
            <>
              {/* Die cut - single cut line to shape */}
              <div className="absolute inset-0 border-[3px] border-[var(--brand)] rounded-[20px]" />
              {/* Shape indicator */}
              <div className="absolute inset-0 flex items-center justify-center text-[var(--brand)] font-display text-xs">
                Cut to Shape
              </div>
            </>
          )}

          {cutType === 'custom' && (
            <>
              {/* Custom shape */}
              <div className="absolute inset-0 border-[3px] border-dashed border-[var(--accent)] rounded-[20px]" />
              <div className="absolute inset-0 flex items-center justify-center text-[var(--text-subtle)] font-display text-xs">
                Custom Shape
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-[var(--text-subtle)] mt-2 text-center">
        {CUT_INFO[cutType].description}
      </p>
    </div>
  )
}

// 3D Preview Component
function Sticker3DPreview({ design, material, finish, cutType }: { design: StickerDesign; material: MaterialType; finish: FinishType; cutType: CutType }) {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="relative w-96 h-96">
        {/* 3D sticker with CSS transforms */}
        <div className="w-full h-full relative transform rotate-x-10 rotate-y-5 transition-all duration-500">
          {/* Base material layer */}
          <div className={cn('absolute inset-0 rounded-full shadow-ink-3', MATERIAL_SURFACE[material])} />

          {/* Sticker preview on top */}
          <div className="relative z-10 p-2">
            <StickerPreview design={design} width={384} height={384} />
          </div>

          {/* Shadow */}
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[color-mix(in_srgb,var(--ink)_20%,transparent)] rounded-full blur-2xl" />
        </div>

        {/* Cut line indicator */}
        <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-center text-xs text-[var(--text-subtle)]">
          {CUT_INFO[cutType].name} • {MATERIAL_INFO[material].name} • {FINISH_INFO[finish].name}
        </div>
      </div>
    </div>
  )
}

// Mockup Preview Component
function MockupPreview({ design }: { design: StickerDesign }) {
  // Static literal classes: Tailwind scans source text, so an interpolated
  // `${mockup.bg}` would emit no CSS at all.
  const mockups: Array<{ name: string; icon: LucideIcon; surface: string }> = [
    { name: 'Laptop', icon: Laptop, surface: 'bg-[var(--surface-sunken)]' },
    { name: 'Phone', icon: Smartphone, surface: 'bg-[color-mix(in_srgb,var(--blue)_12%,transparent)]' },
    { name: 'Notebook', icon: BookOpen, surface: 'bg-[color-mix(in_srgb,var(--orange)_12%,transparent)]' },
    { name: 'Water Bottle', icon: Droplet, surface: 'bg-[color-mix(in_srgb,var(--teal)_12%,transparent)]' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
      {mockups.map((mockup) => (
        <div key={mockup.name} className={cn(mockup.surface, 'rounded-[var(--radius-lg)] p-6 relative overflow-hidden border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)]')}>
          <div className="absolute top-2 right-2 text-xs text-[var(--text-subtle)] flex items-center gap-1">
            <mockup.icon className="w-3 h-3" />
            {mockup.name}
          </div>
          <div className="relative z-10 flex items-center justify-center h-48">
            <div className="relative transform rotate-3">
              <StickerPreview design={design} width={150} height={150} />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-[color-mix(in_srgb,var(--ink)_20%,transparent)] rounded-full blur-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
