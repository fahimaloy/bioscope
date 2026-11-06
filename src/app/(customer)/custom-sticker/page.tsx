'use client'

import { DoodleScatter } from '@/components/decorative/DoodleScatter'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion'
import { StickerCanvas } from '@/components/custom-sticker/StickerCanvas'
import { UploadZone } from '@/components/custom-sticker/UploadZone'
import { EditingTools } from '@/components/custom-sticker/EditingTools'
import { DimensionControls } from '@/components/custom-sticker/DimensionControls'
import { ColorAdjustments } from '@/components/custom-sticker/ColorAdjustments'
import { PreviewPanel } from '@/components/custom-sticker/PreviewPanel'
import { LayerPanel } from '@/components/custom-sticker/LayerPanel'
import { useStickerBuilderStore, useStickerBuilderActions, useStickerDesign } from '@/lib/hooks/useStickerBuilder'
import { motionVariants } from '@/lib/motion'
import { motion, AnimatePresence } from 'framer-motion'
import type { MaterialType, FinishType, CutType } from '@/types'
import {
  Upload,
  Download,
  RotateCcw,
  Share2,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Image as ImageIcon,
  Type,
  Square,
  Layers,
  Palette,
  Ruler,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { SketchUnderline, StickerPeel } from '@/components/decorative/DoodleElements'

const MATERIALS = [
  { value: 'vinyl', label: 'Vinyl', description: 'Durable, Weatherproof', priceMultiplier: 1.0 },
  { value: 'paper', label: 'Paper', description: 'Eco-friendly, Indoor', priceMultiplier: 0.7 },
  { value: 'holographic', label: 'Holographic', description: 'Color-shifting', priceMultiplier: 1.5 },
  { value: 'clear', label: 'Clear', description: 'Transparent', priceMultiplier: 1.2 },
  { value: 'kraft', label: 'Kraft Paper', description: 'Natural, Rustic', priceMultiplier: 0.8 },
]

const FINISHES = [
  { value: 'matte', label: 'Matte', description: 'Non-reflective', priceMultiplier: 1.0 },
  { value: 'glossy', label: 'Glossy', description: 'Shiny', priceMultiplier: 1.0 },
  { value: 'transparent', label: 'Transparent', description: 'Clear', priceMultiplier: 1.1 },
]

const CUT_TYPES = [
  { value: 'kiss_cut', label: 'Kiss Cut', description: 'Peel-off backing', priceMultiplier: 1.0 },
  { value: 'die_cut', label: 'Die Cut', description: 'Cut to shape', priceMultiplier: 1.2 },
  { value: 'custom', label: 'Custom Shape', description: 'Unique shapes', priceMultiplier: 1.5 },
]

// Base price per cm² in BDT
const BASE_PRICE_PER_CM2 = 2.5

export default function CustomStickerPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [mobileTab, setMobileTab] = useState<'tools' | 'canvas' | 'preview'>('canvas')
  const [showToolsMobile, setShowToolsMobile] = useState(false)
  const [pricePulse, setPricePulse] = useState(false)

  const {
    design,
    selectedLayerId,
    canvasRef,
    fabricCanvas,
  } = useStickerBuilderStore()

  const actions = useStickerBuilderActions()

  const [material, setMaterial] = useState<MaterialType>(design.material)
  const [finish, setFinish] = useState<FinishType>(design.finish)
  const [cutType, setCutType] = useState<CutType>(design.cutType)
  const [quantity, setQuantity] = useState(10)

  // Sync with store
  useEffect(() => {
    actions.setMaterial(material)
  }, [material, actions])

  useEffect(() => {
    actions.setFinish(finish)
  }, [finish, actions])

  useEffect(() => {
    actions.setCutType(cutType)
  }, [cutType, actions])

  // Calculate live price
  const livePrice = useMemo(() => {
    const area = design.canvas.width * design.canvas.height
    const materialMult = MATERIALS.find(m => m.value === material)?.priceMultiplier ?? 1.0
    const finishMult = FINISHES.find(f => f.value === finish)?.priceMultiplier ?? 1.0
    const cutMult = CUT_TYPES.find(c => c.value === cutType)?.priceMultiplier ?? 1.0
    const basePrice = area * BASE_PRICE_PER_CM2 * materialMult * finishMult * cutMult
    return Math.round(basePrice * quantity)
  }, [design.canvas.width, design.canvas.height, material, finish, cutType, quantity])

  // Trigger price pulse animation
  useEffect(() => {
    setPricePulse(true)
    const timer = setTimeout(() => setPricePulse(false), 600)
    return () => clearTimeout(timer)
  }, [livePrice])

  const handleUpload = useCallback((file: File, fabricImage: any) => {
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
  }, [actions, design.canvas.width, design.canvas.height])

  const handleExport = useCallback(async (format: 'png' | 'jpg' | 'pdf' | 'svg') => {
    if (!fabricCanvas) {
      toast.error('Canvas is not ready yet')
      return
    }
    const dataUrl = fabricCanvas.toDataURL({
      format: format === 'pdf' ? 'png' : format,
      multiplier: 2,
      quality: 0.95,
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `custom-sticker.${format === 'pdf' ? 'png' : format}`
    a.click()
    toast.success(`Exported as ${format.toUpperCase()}`)
  }, [fabricCanvas])

  const handleRequestQuote = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      if (!fabricCanvas) throw new Error('Canvas is not ready yet')
      const dataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 })

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
  }, [submitting, fabricCanvas, design.canvas.width, design.canvas.height, quantity, material, finish, cutType, router])

  return (
    <div className="min-h-screen bg-[linear-gradient(90deg,transparent_95%,rgba(51,38,26,0.05)_95%),linear-gradient(rgba(51,38,26,0.05)_1px,transparent_1px)] bg-[length:20px_20px]">
      {/* Doodle Scatter Background */}
      <DoodleScatter count={6} className="pointer-events-none fixed inset-0 z-0" />

      {/* Mobile Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--paper-deep)] border-t-3 border-[var(--ink)] shadow-[0_-10px_30px_rgba(51,38,26,0.1)] animate-slide-up">
        <div className="grid grid-cols-3">
          {(['tools', 'canvas', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-2 transition-all',
                mobileTab === tab
                  ? 'text-primary'
                  : 'text-[var(--ink)]/50'
              )}
            >
              {tab === 'tools' && <Layers className="w-6 h-6" />}
              {tab === 'canvas' && <Ruler className="w-6 h-6" />}
              {tab === 'preview' && <Eye className="w-6 h-6" />}
              <span className="text-xs font-medium">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header - Sticky with Live Price */}
      <header className="bg-[var(--paper-deep)] border-b-3 border-[var(--ink)] sticky top-0 z-40 shadow-[0_8px_30px_rgba(51,38,26,0.1)]">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div>
              <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl text-primary">Custom Sticker Builder</h1>
              <p className="text-[var(--ink)]/60">Design your perfect sticker</p>
            </div>

            {/* Material/Finish/Cut Badges + Quantity + Live Price */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="doodle" size="sm" className="whitespace-nowrap">
                {MATERIALS.find(m => m.value === material)?.label}
              </Badge>
              <Badge variant="secondary" size="sm" className="whitespace-nowrap">
                {FINISHES.find(f => f.value === finish)?.label}
              </Badge>
              <Badge variant="outline" size="sm" className="whitespace-nowrap">
                {CUT_TYPES.find(c => c.value === cutType)?.label}
              </Badge>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2 bg-white border-3 border-[var(--ink)] rounded-pill px-3 py-1.5 shadow-sm">
                <span className="text-sm text-[var(--ink)]/60 mr-2">Qty</span>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink)] hover:bg-[var(--light)] transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-16 text-center font-display text-lg text-[var(--ink)]">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10000, quantity + 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink)] hover:bg-[var(--light)] transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Live Price */}
              <motion.div
                className="flex items-center gap-2 bg-primary text-white border-3 border-[var(--ink)] rounded-pill px-6 py-3 shadow-btn"
                variants={motionVariants.pulseSoft}
                animate={pricePulse ? 'animate' : 'initial'}
              >
                <span className="font-[var(--font-display)] text-xl">৳{livePrice.toLocaleString()}</span>
                <span className="text-sm opacity-80">BDT</span>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-full px-4 sm:px-6 lg:px-8 py-6 pb-[100px]">
        {/* Mobile: Tools Panel Overlay */}
        {showToolsMobile && mobileTab === 'tools' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowToolsMobile(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-96 h-full bg-[var(--paper-deep)] border-r-3 border-[var(--ink)] shadow-xl overflow-y-auto p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-primary">Tools</h2>
                <button
                  onClick={() => setShowToolsMobile(false)}
                  className="p-2 text-[var(--ink)]/50 hover:text-primary transition-colors"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
              </div>
              <ToolsPanel
                design={design}
                selectedLayerId={selectedLayerId}
                material={material}
                setMaterial={setMaterial}
                finish={finish}
                setFinish={setFinish}
                cutType={cutType}
                setCutType={setCutType}
                quantity={quantity}
                setQuantity={setQuantity}
                actions={actions}
                handleUpload={handleUpload}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Left Sidebar - Tools */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <ToolsPanel
              design={design}
              selectedLayerId={selectedLayerId}
              material={material}
              setMaterial={setMaterial}
              finish={finish}
              setFinish={setFinish}
              cutType={cutType}
              setCutType={setCutType}
              quantity={quantity}
              setQuantity={setQuantity}
              actions={actions}
              handleUpload={handleUpload}
            />
          </aside>

          {/* Canvas Area - Center */}
          <section className="lg:col-span-6 flex flex-col">
            {/* Canvas Toolbar */}
            <div className="bg-[var(--paper-deep)] rounded-card border-3 border-[var(--ink)] p-4 shadow-card mb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.undo}
                    disabled={!actions.canUndo}
                    aria-label="Undo"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.redo}
                    disabled={!actions.canRedo}
                    aria-label="Redo"
                  >
                    <RotateCcw className="w-4 h-4 rotate-180" />
                  </Button>
                  <div className="w-px h-6 bg-[var(--light)] mx-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.reset}
                    aria-label="Clear canvas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--ink)]/60">Zoom:</span>
                  <Button variant="ghost" size="sm" onClick={actions.zoomOut} aria-label="Zoom out">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="w-16 text-center text-sm font-medium text-[var(--ink)]">{Math.round(actions.zoom * 100)}%</span>
                  <Button variant="ghost" size="sm" onClick={actions.zoomIn} aria-label="Zoom in">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={actions.resetZoom} aria-label="Reset zoom">
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => actions.setZoom(0)}>
                    <Minimize2 className="w-4 h-4 mr-1" />
                    Fit
                  </Button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="outline" size="sm">Layers: {design.layers.length}</Badge>
                </div>
              </div>
            </div>

            {/* Canvas with Rulers & Border */}
            <div className="flex-1 relative bg-[var(--light)] rounded-card border-3 border-[var(--ink)] overflow-hidden shadow-[inset_0_2px_10px_rgba(51,38,26,0.05)]">
              {/* Sticker Peel Corner */}
              <div className="absolute top-[-4px] right-[-4px] w-5 h-5 bg-[var(--primary)] border-3 border-[var(--ink)] rounded-tr-full shadow-[2px_2px_0_var(--ink)] z-10 pointer-events-none" />

              <StickerCanvas
                ref={canvasRef}
                width={design.canvas.width}
                height={design.canvas.height}
                backgroundColor="#FFFFFF"
                grid={true}
                rulers={true}
              />
            </div>
          </section>

          {/* Right Sidebar - Preview */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <PreviewPanel
              design={design}
              material={material}
              finish={finish}
              cutType={cutType}
              quantity={quantity}
              livePrice={livePrice}
              onExport={handleExport}
            />
          </aside>
        </div>

        {/* Mobile Canvas Area */}
        <div className="lg:hidden">
          {mobileTab === 'canvas' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={motionVariants.slideInRight}
              className="h-[calc(100vh-280px)] min-h-[400px]"
            >
              <div className="relative bg-[var(--light)] rounded-card border-3 border-[var(--ink)] overflow-hidden shadow-[inset_0_2px_10px_rgba(51,38,26,0.05)] h-full">
                <div className="absolute top-[-4px] right-[-4px] w-5 h-5 bg-[var(--primary)] border-3 border-[var(--ink)] rounded-tr-full shadow-[2px_2px_0_var(--ink)] z-10 pointer-events-none" />
                <StickerCanvas
                  ref={canvasRef}
                  width={design.canvas.width}
                  height={design.canvas.height}
                  backgroundColor="#FFFFFF"
                  grid={true}
                  rulers={true}
                />
              </div>
            </motion.div>
          )}

          {mobileTab === 'preview' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={motionVariants.slideInRight}
              className="h-[calc(100vh-280px)] min-h-[400px]"
            >
              <PreviewPanel
                design={design}
                material={material}
                finish={finish}
                cutType={cutType}
                quantity={quantity}
                livePrice={livePrice}
                onExport={handleExport}
              />
            </motion.div>
          )}

          {mobileTab === 'tools' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={motionVariants.slideInLeft}
              className="h-[calc(100vh-280px)] min-h-[400px]"
            >
              <button
                onClick={() => setShowToolsMobile(true)}
                className="w-full mb-4 py-3 bg-primary text-white border-3 border-[var(--ink)] rounded-pill font-display text-lg shadow-btn"
              >
                <ChevronDown className="w-6 h-6 inline mr-2" />
                Open Tools Panel
              </button>
              <div className="bg-[var(--light)] rounded-card border-3 border-[var(--ink)] p-4">
                <p className="text-center text-[var(--ink)]/50">Tap the button above to open tools</p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Request Quote CTA - Fixed bottom on mobile, sticky on desktop */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 lg:static lg:sticky lg:bottom-auto lg:mt-8 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <Button
            variant="doodle"
            size="xl"
            fullWidth
            onClick={handleRequestQuote}
            loading={submitting}
            className="relative shadow-[0_8px_30px_rgba(51,38,26,0.3)]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <span className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <span>Request Quote</span>
                </span>
              </>
            )}
            <StickerPeel />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// Tools Panel Component with Accordion Sections
function ToolsPanel({
  design,
  selectedLayerId,
  material,
  setMaterial,
  finish,
  setFinish,
  cutType,
  setCutType,
  quantity,
  setQuantity,
  actions,
  handleUpload,
}: {
  design: any
  selectedLayerId: string | null
  material: MaterialType
  setMaterial: (v: MaterialType) => void
  finish: FinishType
  setFinish: (v: FinishType) => void
  cutType: CutType
  setCutType: (v: CutType) => void
  quantity: number
  setQuantity: (v: number) => void
  actions: any
  handleUpload: (file: File, fabricImage: any) => void
}) {
  const selectedLayer = design.layers.find((l: any) => l.id === selectedLayerId) ?? null
  const isImage = selectedLayer?.type === 'image'
  const isText = selectedLayer?.type === 'text'
  const isShape = selectedLayer?.type === 'shape'

  const handleMaterialChange = (value: string) => setMaterial(value as MaterialType)
  const handleFinishChange = (value: string) => setFinish(value as FinishType)
  const handleCutTypeChange = (value: string) => setCutType(value as CutType)

  return (
    <div className="space-y-4">
      {/* Section 1: Upload */}
      <Card variant="doodle" padding="md" className="border-primary">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="upload">
            <AccordionTrigger className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-input bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <SketchUnderline><span className="font-display text-lg text-primary">Upload Design</span></SketchUnderline>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <UploadZone
                onUpload={handleUpload}
                maxSize={16}
                multiple={false}
                className="w-full mt-4"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Section 2: Materials & Options */}
      <Card variant="doodle" padding="md" className="border-primary">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="materials">
            <AccordionTrigger className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-input bg-accent/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-accent" />
              </div>
              <SketchUnderline><span className="font-display text-lg text-primary">Materials & Options</span></SketchUnderline>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 mt-4">
              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-3">Material</label>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIALS.map((mat) => (
                    <button
                      key={mat.value}
                      onClick={() => setMaterial(mat.value as MaterialType)}
                      className={cn(
                        'p-3 rounded-input border-3 text-sm text-center transition-all',
                        material === mat.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
                      )}
                    >
                      <div className="font-medium">{mat.label}</div>
                      <div className="text-xs text-[var(--ink)]/60">{mat.description}</div>
                      <div className="text-xs font-display text-primary mt-1">{mat.priceMultiplier}x</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Finish */}
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-3">Finish</label>
                <div className="grid grid-cols-3 gap-2">
                  {FINISHES.map((fin) => (
                    <button
                      key={fin.value}
                      onClick={() => setFinish(fin.value as FinishType)}
                      className={cn(
                        'p-3 rounded-input border-3 text-sm text-center transition-all',
                        finish === fin.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
                      )}
                    >
                      <div className="font-medium">{fin.label}</div>
                      <div className="text-xs text-[var(--ink)]/60">{fin.description}</div>
                      <div className="text-xs font-display text-primary mt-1">{fin.priceMultiplier}x</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cut Type */}
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-3">Cut Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CUT_TYPES.map((cut) => (
                    <button
                      key={cut.value}
                      onClick={() => setCutType(cut.value as CutType)}
                      className={cn(
                        'p-3 rounded-input border-3 text-sm text-center transition-all',
                        cutType === cut.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[var(--ink)]/30 text-[var(--ink)] hover:border-primary'
                      )}
                    >
                      <div className="font-medium">{cut.label}</div>
                      <div className="text-xs text-[var(--ink)]/60">{cut.description}</div>
                      <div className="text-xs font-display text-primary mt-1">{cut.priceMultiplier}x</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-3">Quantity</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={10000}
                    className="flex-1"
                  />
                  <div className="text-sm text-[var(--ink)]/60">pcs</div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Section 3: Active Panel Content (Editing / Layers / Settings) */}
      <Card variant="doodle" padding="md" className="border-primary flex-1 flex flex-col min-h-0">
        <Accordion type="single" collapsible className="w-full flex-1 flex flex-col">
          <AccordionItem value="editing">
            <AccordionTrigger className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-input bg-secondary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-secondary" />
              </div>
              <SketchUnderline><span className="font-display text-lg text-primary">Editing</span></SketchUnderline>
            </AccordionTrigger>
            <AccordionContent className="flex-1 mt-4">
              {selectedLayer ? (
                <EditingTools
                  selectedLayer={selectedLayer}
                  onUpdateLayer={(id: string, updates: any) => actions.updateLayer(id, updates)}
                  onDeleteLayer={(id: string) => actions.removeLayer(id)}
                  onDuplicateLayer={(id: string) => actions.duplicateLayer(id)}
                  onLockLayer={(id: string) => actions.toggleLayerLock(id)}
                  onToggleVisibility={(id: string) => actions.toggleLayerVisibility(id)}
                  onCropLayer={() => {}}
                  onResetTransform={() => {}}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-[var(--ink)]/50">
                  <p className="text-body">Select a layer to edit</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="layers">
            <AccordionTrigger className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-input bg-accent/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-accent" />
              </div>
              <SketchUnderline><span className="font-display text-lg text-primary">Layers</span></SketchUnderline>
            </AccordionTrigger>
            <AccordionContent className="flex-1 mt-4">
              <LayerPanel
                layers={design.layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={actions.selectLayer}
                onReorderLayer={actions.reorderLayer}
                onToggleVisibility={actions.toggleLayerVisibility}
                onToggleLock={actions.toggleLayerLock}
                onDuplicateLayer={actions.duplicateLayer}
                onDeleteLayer={actions.removeLayer}
                onAddLayer={(type: string) => {
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
                      x: design.canvas.width / 2,
                      y: design.canvas.height / 2,
                      scaleX: 1,
                      scaleY: 1,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      locked: false,
                    })
                  } else if (type === 'shape') {
                    actions.addLayer({
                      type: 'shape',
                      shapeType: 'rect',
                      fill: 'var(--primary)',
                      stroke: 'transparent',
                      strokeWidth: 0,
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
                }}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="settings">
            <AccordionTrigger className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-input bg-primary/10 flex items-center justify-center">
                <Ruler className="w-5 h-5 text-primary" />
              </div>
              <SketchUnderline><span className="font-display text-lg text-primary">Settings</span></SketchUnderline>
            </AccordionTrigger>
            <AccordionContent className="flex-1 mt-4 overflow-y-auto">
              <DimensionControls
                width={design.canvas.width}
                height={design.canvas.height}
                onWidthChange={(w) => actions.setCanvasSize(w, design.canvas.height, design.canvas.dpi)}
                onHeightChange={(h) => actions.setCanvasSize(design.canvas.width, h, design.canvas.dpi)}
                onLockAspectRatio={() => {}}
                locked={true}
                dpi={design.canvas.dpi}
              />
              <ColorAdjustments
                filter={design.background?.imageFilter || {}}
                onChange={(filter) => actions.updateBackgroundFilter(filter)}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  )
}