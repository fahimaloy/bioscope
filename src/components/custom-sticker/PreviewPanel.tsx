'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StickerPreview } from './StickerCanvas'
import type { StickerDesign, MaterialType, FinishType, CutType } from '@/types'
import { Eye, Download, Maximize, Minimize, RotateCcw, Share2, Copy } from 'lucide-react'

interface PreviewPanelProps {
  design: StickerDesign
  onExport: (format: 'png' | 'jpg' | 'pdf' | 'svg') => void
  onShare?: () => void
  className?: string
}

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

export function PreviewPanel({
  design,
  onExport,
  onShare,
  className,
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'canvas' | '3d' | 'mockup'>('canvas')
  const [zoom, setZoom] = useState(1)
  const [showSpecs, setShowSpecs] = useState(true)

  const materialInfo = MATERIAL_INFO[design.material]
  const finishInfo = FINISH_INFO[design.finish]
  const cutInfo = CUT_INFO[design.cutType]

  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--light)]">
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

      {/* Preview Area */}
      <div className="flex-1 relative overflow-hidden p-4">
        {viewMode === 'canvas' && (
          <div className="w-full h-full flex items-center justify-center">
            <StickerPreview design={design} width={500} height={500} />
          </div>
        )}

        {viewMode === '3d' && (
          <div className="w-full h-full flex items-center justify-center">
            <Sticker3DPreview design={design} />
          </div>
        )}

        {viewMode === 'mockup' && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <MockupPreview design={design} />
          </div>
        )}
      </div>

      {/* Specs Panel */}
      {showSpecs && (
        <div className="border-t border-[var(--light)] p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <SpecItem label="Size" value={`${design.canvas.width} × ${design.canvas.height} cm`} />
            <SpecItem label="Area" value={`${(design.canvas.width * design.canvas.height).toFixed(1)} cm²`} />
            <SpecItem label="Resolution" value={`${design.canvas.dpi} DPI`} />
            <SpecItem label="Pixels" value={`${Math.round(design.canvas.width * design.canvas.dpi / 2.54)} × ${Math.round(design.canvas.height * design.canvas.dpi / 2.54)}`} />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--light)]">
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

          <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--light)]">
            <Badge variant="outline" size="sm">Layers: {design.layers.length}</Badge>
            <Badge variant="outline" size="sm">Background: {design.background ? 'Yes' : 'No'}</Badge>
            <Badge variant="outline" size="sm">Export Ready</Badge>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="border-t border-[var(--light)] p-4 space-y-3">
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

        {onShare && (
          <Button variant="ghost" className="w-full" onClick={onShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Design
          </Button>
        )}
      </div>
    </div>
  )
}

// Spec Item Component
function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[var(--light)] rounded-input">
      <div className="text-xs text-[var(--ink)]/50 uppercase tracking-wider mb-1">{label}</div>
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
      <div className="text-xs text-[var(--ink)]/50 mt-1">{description}</div>
      {badge && (
        <Badge variant="secondary" size="sm" className="mt-2 mx-auto w-fit">
          {badge}
        </Badge>
      )}
    </div>
  )
}

// 3D Preview Component (simplified)
function Sticker3DPreview({ design }: { design: StickerDesign }) {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="relative w-96 h-96">
        {/* Simulated 3D with CSS transforms */}
        <div className="w-full h-full relative transform rotate-x-10 rotate-y-5 transition-all duration-500">
          <StickerPreview design={design} width={384} height={384} />
          {/* Shadow */}
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  )
}

// Mockup Preview Component
function MockupPreview({ design }: { design: StickerDesign }) {
  const mockups = [
    { name: 'Laptop', icon: '💻', bg: 'bg-gradient-to-br from-gray-100 to-gray-200' },
    { name: 'Water Bottle', icon: '🚰', bg: 'bg-gradient-to-br from-blue-100 to-blue-200' },
    { name: 'Phone Case', icon: '📱', bg: 'bg-gradient-to-br from-pink-100 to-pink-200' },
    { name: 'Notebook', icon: '📓', bg: 'bg-gradient-to-br from-yellow-100 to-yellow-200' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
      {mockups.map((mockup) => (
        <div key={mockup.name} className={`${mockup.bg} rounded-xl p-6 relative overflow-hidden`}>
          <div className="absolute top-2 right-2 text-xs text-[var(--ink)]/50">{mockup.name}</div>
          <div className="relative z-10 flex items-center justify-center h-48">
            <StickerPreview design={design} width={150} height={150} />
          </div>
        </div>
      ))}
    </div>
  )
}