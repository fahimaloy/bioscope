'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StickerPreview } from './StickerCanvas'
import type { StickerDesign, MaterialType, FinishType, CutType } from '@/types'
import { Eye, Download, Maximize, Minimize, RotateCcw, Share2, Copy, Laptop, Smartphone, BookOpen, Droplet } from 'lucide-react'
import { DoodleBackground } from '@/components/decorative/DoodleBackground'
import { SketchUnderline } from '@/components/decorative/DoodleElements'
import { motionVariants } from '@/lib/motion'
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
    <Card variant="doodle" padding="none" className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--light)]">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-primary">Live Preview</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSpecs(!showSpecs)}>
              {showSpecs ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              Specs
            </Button>
            <div className="flex items-center gap-1 bg-[var(--light)] rounded-input px-3 py-1">
              <Button variant="ghost" size="sm" onClick={() => setViewMode('canvas')} className={viewMode === 'canvas' ? 'bg-white shadow-sm' : ''} aria-label="Canvas view">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewMode('3d')} className={viewMode === '3d' ? 'bg-white shadow-sm' : ''} aria-label="3D view">
                <Maximize className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewMode('mockup')} className={viewMode === 'mockup' ? 'bg-white shadow-sm' : ''} aria-label="Mockup view">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-hidden p-4">
        <DoodleBackground shapeCount={6} className="absolute inset-0 pointer-events-none opacity-30" />

        {viewMode === 'canvas' && (
          <motion.div
            key="canvas"
            initial="hidden"
            animate="visible"
            variants={motionVariants.slideInRight}
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
            variants={motionVariants.slideInRight}
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
            variants={motionVariants.slideInRight}
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
          className="border-t border-[var(--light)] overflow-hidden"
        >
          <div className="p-4 space-y-4">
            <SketchUnderline className="-mb-2"><span className="font-display text-lg text-primary">Specifications</span></SketchUnderline>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <SpecItem label="Size" value={`${design.canvas.width} × ${design.canvas.height} cm`} />
              <SpecItem label="Area" value={`${(design.canvas.width * design.canvas.height).toFixed(1)} cm²`} />
              <SpecItem label="Resolution" value={`${design.canvas.dpi} DPI`} />
              <SpecItem label="Pixels" value={`${Math.round(design.canvas.width * design.canvas.dpi / 2.54)} × ${Math.round(design.canvas.height * design.canvas.dpi / 2.54)}`} />
            </div>

            {/* Material Texture Preview */}
            <div className="pt-2 border-t border-[var(--light)]">
              <MaterialTexturePreview material={material} finish={finish} />
            </div>

            {/* Cut Line Preview */}
            <div className="pt-2 border-t border-[var(--light)]">
              <CutLinePreview cutType={cutType} />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[var(--light)]">
              <SpecDetail
                icon="📦"
                label="Material"
                value={materialInfo.name}
                description={materialInfo.description}
                badge={materialInfo.durability}
              />
              <SpecDetail
                icon="✨"
                label="Finish"
                value={finishInfo.name}
                description={finishInfo.description}
              />
              <SpecDetail
                icon="✂️"
                label="Cut Type"
                value={cutInfo.name}
                description={cutInfo.description}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--light)]">
              <Badge variant="doodle" size="sm">Layers: {design.layers.length}</Badge>
              <Badge variant="secondary" size="sm">Background: {design.background ? 'Yes' : 'No'}</Badge>
              <Badge variant="outline" size="sm">Export Ready</Badge>
            </div>
          </div>
        </motion.div>
      )}

      {/* Export Actions & Price */}
      <div className="border-t border-[var(--light)] p-4 space-y-4">
        {/* Live Price Summary */}
        <div className="bg-primary/5 border-2 border-primary rounded-card p-4 text-center">
          <div className="text-sm text-primary/80 mb-1">Estimated Total (Qty: {quantity})</div>
          <motion.div
            className="font-display text-2xl text-primary"
            variants={motionVariants.pulseSoft}
            animate="initial"
          >
            ৳{livePrice.toLocaleString()} BDT
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="doodle" onClick={() => onExport('png')} className="flex-1 min-w-[120px]">
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
          <Button variant="doodle" className="flex-1">
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
    <div className="p-3 bg-[var(--light)] rounded-input">
      <div className="text-xs text-[var(--text-subtle)] uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-lg text-primary">{value}</div>
    </div>
  )
}

// Spec Detail Component
function SpecDetail({
  icon,
  label,
  value,
  description,
  badge,
}: { icon: string; label: string; value: string; description: string; badge?: string }) {
  return (
    <div className="p-4 bg-[var(--light)] rounded-input text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-medium text-body text-[var(--ink)]">{label}</div>
      <div className="font-display text-lg text-primary mt-1">{value}</div>
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
  const getTextureStyle = () => {
    const base = 'w-full h-20 rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] relative overflow-hidden'
    switch (material) {
      case 'vinyl':
        return `${base} bg-gradient-to-br from-gray-100 via-white to-gray-200`
      case 'holographic':
        return `${base} bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 animate-shimmer`
      case 'clear':
        return `${base} bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[length:20px_20px]`
      case 'paper':
        return `${base} bg-gradient-to-br from-amber-50 via-white to-amber-100`
      case 'kraft':
        return `${base} bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400`
      default:
        return base
    }
  }

  const getFinishOverlay = () => {
    switch (finish) {
      case 'glossy':
        return 'absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent pointer-events-none'
      case 'matte':
        return 'absolute inset-0 bg-white/5 pointer-events-none'
      case 'transparent':
        return 'absolute inset-0 bg-transparent pointer-events-none'
      default:
        return 'absolute inset-0 pointer-events-none'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-body text-[var(--ink)]">Material Texture</span>
        <Badge variant="doodle" size="sm">{MATERIAL_INFO[material].name} / {FINISH_INFO[finish].name}</Badge>
      </div>
      <div className="relative">
        <div className={getTextureStyle()}>
          <div className={getFinishOverlay()} />
          {/* Simulated light reflection for glossy */}
          {finish === 'glossy' && (
            <div className="absolute top-1 left-1 w-8 h-8 bg-white/60 rounded-full blur-xl" />
          )}
          {/* Holographic shift indicator */}
          {material === 'holographic' && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-300/30 via-pink-300/30 to-blue-300/30 animate-shimmer" />
          )}
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
        <span className="font-medium text-body text-[var(--ink)]">Cut Line Preview</span>
        <Badge variant="secondary" size="sm">{CUT_INFO[cutType].name}</Badge>
      </div>
      <div className="relative w-full h-24 flex items-center justify-center bg-[var(--light)] rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
        {/* Sticker shape */}
        <div className="relative w-32 h-32">
          {/* Background sticker */}
          <div className="absolute inset-0 bg-white border-2 border-[var(--ink)] rounded-full shadow-sm" />
          
          {/* Cut line */}
          {cutType === 'kiss_cut' && (
            <>
              {/* Kiss cut - inner line */}
              <div className="absolute inset-2 border-2 border-dashed border-primary/60 rounded-full" />
              {/* Backing paper */}
              <div className="absolute -inset-2 border-2 border-dashed border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-full" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-t-full" />
            </>
          )}
          
          {cutType === 'die_cut' && (
            <>
              {/* Die cut - single cut line to shape */}
              <div className="absolute inset-0 border-3 border-primary rounded-[20px]" />
              {/* Shape indicator */}
              <div className="absolute inset-0 flex items-center justify-center text-primary font-display text-xs">
                ✂️ Cut to Shape
              </div>
            </>
          )}
          
          {cutType === 'custom' && (
            <>
              {/* Custom shape */}
              <div className="absolute inset-0 border-3 border-dashed border-accent rounded-[20px]" />
              <div className="absolute inset-0 flex items-center justify-center text-accent font-display text-xs">
                ✨ Custom Shape
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
  const get3DStyle = () => {
    switch (material) {
      case 'holographic':
        return 'bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 animate-shimmer'
      case 'clear':
        return 'bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[length:20px_20px]'
      case 'vinyl':
        return 'bg-gradient-to-br from-gray-100 via-white to-gray-200'
      case 'paper':
        return 'bg-gradient-to-br from-amber-50 via-white to-amber-100'
      case 'kraft':
        return 'bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400'
      default:
        return 'bg-white'
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="relative w-96 h-96">
        {/* 3D sticker with CSS transforms */}
        <div className="w-full h-full relative transform rotate-x-10 rotate-y-5 transition-all duration-500">
          {/* Base material layer */}
          <div className={cn('absolute inset-0 rounded-full shadow-[8px_12px_0_rgba(51,38,26,0.15)]', get3DStyle())} />
          
          {/* Glossy highlight */}
          {finish === 'glossy' && (
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent rounded-full pointer-events-none" />
          )}
          
          {/* Holographic shimmer */}
          {material === 'holographic' && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-300/40 via-pink-300/40 to-blue-300/40 animate-shimmer rounded-full pointer-events-none" />
          )}
          
          {/* Sticker preview on top */}
          <div className="relative z-10 p-2">
            <StickerPreview design={design} width={384} height={384} />
          </div>
          
          {/* Shadow */}
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 rounded-full blur-2xl" />
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
  const mockups = [
    { name: 'Laptop', icon: Laptop, bg: 'bg-gradient-to-br from-gray-100 to-gray-200' },
    { name: 'Phone', icon: Smartphone, bg: 'bg-gradient-to-br from-blue-50 to-blue-100' },
    { name: 'Notebook', icon: BookOpen, bg: 'bg-gradient-to-br from-amber-50 to-amber-100' },
    { name: 'Water Bottle', icon: Droplet, bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
      {mockups.map((mockup) => (
        <div key={mockup.name} className={`${mockup.bg} rounded-xl p-6 relative overflow-hidden border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)]`}>
          <div className="absolute top-2 right-2 text-xs text-[var(--text-subtle)] flex items-center gap-1">
            <mockup.icon className="w-3 h-3" />
            {mockup.name}
          </div>
          <div className="relative z-10 flex items-center justify-center h-48">
            <div className="relative transform rotate-3">
              <StickerPreview design={design} width={150} height={150} />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/20 rounded-full blur-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}