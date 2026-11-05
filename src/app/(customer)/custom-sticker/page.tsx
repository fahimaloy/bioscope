'use client'

import { DoodleScatter } from '@/components/decorative/DoodleScatter'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StickerCanvas } from '@/components/custom-sticker/StickerCanvas'
import { UploadZone } from '@/components/custom-sticker/UploadZone'
import { EditingTools } from '@/components/custom-sticker/EditingTools'
import { DimensionControls } from '@/components/custom-sticker/DimensionControls'
import { ColorAdjustments } from '@/components/custom-sticker/ColorAdjustments'
import { PreviewPanel } from '@/components/custom-sticker/PreviewPanel'
import { LayerPanel } from '@/components/custom-sticker/LayerPanel'
import { useStickerBuilderStore, useStickerBuilderActions } from '@/lib/hooks/useStickerBuilder'
import { Upload, Download, RotateCcw, Share2, Trash2, Eye, EyeOff, Settings, Image as ImageIcon, Type, Square } from 'lucide-react'

const MATERIALS = [
  { value: 'vinyl', label: 'Vinyl (Durable, Weatherproof)', priceMultiplier: 1.0 },
  { value: 'paper', label: 'Paper (Eco-friendly, Indoor)', priceMultiplier: 0.7 },
  { value: 'holographic', label: 'Holographic (Color-shifting)', priceMultiplier: 1.5 },
  { value: 'clear', label: 'Clear (Transparent)', priceMultiplier: 1.2 },
  { value: 'kraft', label: 'Kraft Paper (Natural, Rustic)', priceMultiplier: 0.8 },
]

const FINISHES = [
  { value: 'matte', label: 'Matte (Non-reflective)', priceMultiplier: 1.0 },
  { value: 'glossy', label: 'Glossy (Shiny)', priceMultiplier: 1.0 },
  { value: 'transparent', label: 'Transparent (Clear)', priceMultiplier: 1.1 },
]

const CUT_TYPES = [
  { value: 'kiss_cut', label: 'Kiss Cut (Peel-off backing)', priceMultiplier: 1.0 },
  { value: 'die_cut', label: 'Die Cut (Cut to shape)', priceMultiplier: 1.2 },
  { value: 'custom', label: 'Custom Shape', priceMultiplier: 1.5 },
]

export default function CustomStickerPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const {
    design,
    selectedLayerId,
    canvasRef,
  } = useStickerBuilderStore()

  const actions = useStickerBuilderActions()

  const [activePanel, setActivePanel] = useState<'tools' | 'layers' | 'settings'>('tools')
  const [material, setMaterial] = useState('vinyl')
  const [finish, setFinish] = useState('matte')
  const [cutType, setCutType] = useState('kiss_cut')
  const [quantity, setQuantity] = useState(10)

  const handleUpload = (file: File, fabricImage: any) => {
    actions.addLayer({
      type: 'image',
      imageUrl: fabricImage.url,
      x: design.canvas.width / 2,
      y: design.canvas.height / 2,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    })
  }

  const handleExport = async (format: 'png' | 'jpg' | 'pdf' | 'svg') => {
    const canvas = useStickerBuilderStore.getState().fabricCanvas
    if (!canvas) {
      toast.error('Canvas is not ready yet')
      return
    }
    const dataUrl = canvas.toDataURL({
      format: format === 'pdf' ? 'png' : format,
      multiplier: 2,
      quality: 0.95,
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `custom-sticker.${format === 'pdf' ? 'png' : format}`
    a.click()
    toast.success(`Exported as ${format.toUpperCase()}`)
  }

  const handleRequestQuote = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const canvas = useStickerBuilderStore.getState().fabricCanvas
      if (!canvas) throw new Error('Canvas is not ready yet')
      const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 })

      const upRes = await fetch('/api/custom-requests/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: 'custom-sticker.png' }),
      })
      const upJson = await upRes.json()
      if (!upRes.ok) throw new Error(upJson.error || 'Image upload failed')

      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: upJson.data.url,
          originalName: upJson.data.originalName,
          width: design.canvas.width,
          height: design.canvas.height,
          quantity,
          material,
          finish,
          cutType,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login?callbackUrl=/custom-sticker')
          return
        }
        throw new Error(json.error || 'Could not submit request')
      }
      toast.success('Custom sticker request submitted! We will price it shortly.')
      router.push('/profile')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(90deg,transparent_95%,rgba(51,38,26,0.05)_95%),linear-gradient(rgba(51,38,26,0.05)_1px,transparent_1px)] bg-[length:20px_20px]">
      {/* Header */}
      <header className="bg-[var(--paper-deep)] border-b border-[var(--light)] sticky top-16 z-40">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-[var(--font-display)] text-2xl text-primary">Custom Sticker Builder</h1>
              <p className="text-[var(--ink)]/60">Design your perfect sticker</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="primary" size="sm">{MATERIALS.find(m => m.value === material)?.label}</Badge>
              <Badge variant="secondary" size="sm">{FINISHES.find(f => f.value === finish)?.label}</Badge>
              <Badge variant="accent" size="sm">{CUT_TYPES.find(c => c.value === cutType)?.label}</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Tools */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Upload Zone */}
            <div className="bg-[var(--paper-deep)] rounded-card border-3 border-[var(--ink)] p-4 shadow-card">
              <h3 className="font-[var(--font-display)] text-lg text-primary mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Upload Design
              </h3>
              <UploadZone
                onUpload={handleUpload}
                maxSize={16}
                multiple={false}
                className="w-full"
              />
            </div>

            {/* Material/Finish/Cut */}
            <div className="bg-[var(--paper-deep)] rounded-card border-3 border-[var(--ink)] p-4 shadow-card space-y-4">
              <h3 className="font-[var(--font-display)] text-lg text-primary flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Materials & Options
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Material</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MATERIALS.map((mat) => (
                      <button
                        key={mat.value}
                        onClick={() => setMaterial(mat.value)}
                        className={`p-3 rounded-input border-3 text-sm text-center transition-all ${
                          material === mat.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
                        }`}
                      >
                        <div className="font-medium">{mat.label.split(' ')[0]}</div>
                        <div className="text-xs text-[var(--ink)]/60">{mat.priceMultiplier}x</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Finish</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FINISHES.map((fin) => (
                      <button
                        key={fin.value}
                        onClick={() => setFinish(fin.value)}
                        className={`p-3 rounded-input border-3 text-sm text-center transition-all ${
                          finish === fin.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
                        }`}
                      >
                        <div className="font-medium">{fin.label.split(' ')[0]}</div>
                        <div className="text-xs text-[var(--ink)]/60">{fin.priceMultiplier}x</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Cut Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CUT_TYPES.map((cut) => (
                      <button
                        key={cut.value}
                        onClick={() => setCutType(cut.value)}
                        className={`p-3 rounded-input border-3 text-sm text-center transition-all ${
                          cutType === cut.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
                        }`}
                      >
                        <div className="font-medium">{cut.label.split(' ')[0]}</div>
                        <div className="text-xs text-[var(--ink)]/60">{cut.priceMultiplier}x</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={10000}
                    className="w-full px-4 py-3 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input text-body text-[var(--ink)]"
                  />
                </div>
              </div>
            </div>

            {/* Active Panel Content */}
            <div className="bg-[var(--paper-deep)] rounded-card border-3 border-[var(--ink)] p-4 shadow-card">
              <div className="flex gap-2 mb-4 border-b border-[var(--light)] pb-2">
                {(['tools', 'layers', 'settings'] as const).map((panel) => (
                  <button
                    key={panel}
                    onClick={() => setActivePanel(panel)}
                    className={`flex-1 py-2 px-3 rounded-input text-sm font-medium transition-all ${
                      activePanel === panel
                        ? 'bg-primary text-white shadow-btn'
                        : 'text-[var(--ink)]/60 hover:bg-[var(--light)]'
                    }`}
                  >
                    {panel.charAt(0).toUpperCase() + panel.slice(1)}
                  </button>
                ))}
              </div>

              {activePanel === 'tools' && (
                <EditingTools
                  selectedLayer={design.layers.find((l) => l.id === selectedLayerId) ?? null}
                  onUpdateLayer={(id, updates) => actions.updateLayer(id, updates)}
                  onDeleteLayer={(id) => actions.removeLayer(id)}
                  onDuplicateLayer={(id) => actions.duplicateLayer(id)}
                  onLockLayer={(id) => actions.toggleLayerLock(id)}
                  onToggleVisibility={(id) => actions.toggleLayerVisibility(id)}
                  onCropLayer={() => {}}
                  onResetTransform={() => {}}
                />
              )}

              {activePanel === 'layers' && (
                <LayerPanel
                  layers={design.layers}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={actions.selectLayer}
                  onReorderLayer={actions.reorderLayer}
                  onToggleVisibility={actions.toggleLayerVisibility}
                  onToggleLock={actions.toggleLayerLock}
                  onDuplicateLayer={actions.duplicateLayer}
                  onDeleteLayer={actions.removeLayer}
                  onAddLayer={(type) => {
                    if (type === 'text') {
                      actions.addLayer({
                        type: 'text',
                        text: 'Your Text',
                        fontFamily: 'Outfit',
                        fontSize: 40,
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        textColor: '#000000',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        letterSpacing: 0,
                        x: 100,
                        y: 100,
                        scaleX: 1,
                        scaleY: 1,
                        rotation: 0,
                        opacity: 1,
                        visible: true,
                        locked: false,
                      })
                    }
                  }}
                />
              )}

              {activePanel === 'settings' && (
                <div className="space-y-4">
                  <DimensionControls
                    width={design.canvas.width}
                    height={design.canvas.height}
                    onWidthChange={(w) => actions.setCanvasSize(w, design.canvas.height, design.canvas.dpi)}
                    onHeightChange={(h) => actions.setCanvasSize(design.canvas.width, h, design.canvas.dpi)}
                    onLockAspectRatio={(locked) => {}}
                    locked={true}
                    dpi={design.canvas.dpi}
                  />
                  <ColorAdjustments
                    filter={design.background?.imageFilter || {}}
                    onChange={(filter) => actions.updateBackgroundFilter(filter)}
                  />
                </div>
              )}
            </div>
          </aside>

          {/* Canvas Area */}
          <main className="lg:col-span-6 flex flex-col">
            {/* Canvas Toolbar */}
            <div className="bg-[var(--paper-deep)] rounded-card border-3 border-[var(--ink)] p-4 shadow-card mb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={actions.undo} disabled={!actions.canUndo}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={actions.redo} disabled={!actions.canRedo}>
                    <RotateCcw className="w-4 h-4 rotate-180" />
                  </Button>
                  <div className="w-px h-6 bg-[var(--light)] mx-2" />
                  <Button variant="ghost" size="sm" onClick={actions.reset}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--ink)]/60">Zoom:</span>
                  <Button variant="ghost" size="sm" onClick={actions.zoomOut} aria-label="Zoom out">−</Button>
                  <span className="w-16 text-center text-sm font-medium text-[var(--ink)]">{Math.round(actions.zoom * 100)}%</span>
                  <Button variant="ghost" size="sm" onClick={actions.zoomIn} aria-label="Zoom in">+</Button>
                  <Button variant="ghost" size="sm" onClick={actions.resetZoom} aria-label="Reset zoom">⌂</Button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="outline" size="sm">Layers: {design.layers.length}</Badge>
                  <Button variant="primary" onClick={handleRequestQuote} loading={submitting} className="ml-2">
                    <Download className="w-4 h-4 mr-2" />
                    Request Quote
                  </Button>
                  <Button variant="secondary" onClick={() => handleExport('png')}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-[var(--light)] rounded-card border-3 border-[var(--ink)] relative overflow-hidden">
              <StickerCanvas
                ref={canvasRef}
                width={design.canvas.width}
                height={design.canvas.height}
                backgroundColor="#FFFFFF"
                grid={true}
                rulers={true}
              />
            </div>
          </main>

          {/* Right Sidebar - Preview */}
          <aside className="lg:col-span-3 space-y-6">
            <PreviewPanel
              design={design}
              onExport={handleExport}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
