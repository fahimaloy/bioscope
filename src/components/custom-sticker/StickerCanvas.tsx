'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import { cn } from '@/lib/utils'
import type { StickerDesign, DesignLayer } from '@/types'
import { useStickerBuilderStore } from '@/lib/hooks/useStickerBuilder'
import { StickerPeel } from '@/components/decorative'
import { Home } from 'lucide-react'
import { resolveHex, resolveCanvasFill } from './resolveHex'

/** Extended fabric object with app-specific properties. */
interface ExtendedFabricObject extends fabric.Object {
  id?: string
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string | number
  fontStyle?: string
  fill?: string | fabric.Pattern | fabric.Gradient
  textAlign?: string
  lineHeight?: number
  charSpacing?: number
  layerData?: DesignLayer
}

interface StickerCanvasProps {
  ref?: React.Ref<HTMLCanvasElement>
  width: number
  height: number
  backgroundColor?: string
  grid?: boolean
  rulers?: boolean
  snapToGrid?: boolean
  zoom?: number
  onZoomChange?: (zoom: number) => void
  onSelectionChange?: (layer: DesignLayer | null) => void
  className?: string
}

/**
 * The font picker offers semantic names; `next/font` registers the families
 * under hashed names (`__Outfit_<hash>`). A canvas 2D context can resolve
 * neither a CSS custom property nor a family that was never registered with
 * the `FontFace` API, so every non-system option silently fell back — the
 * default included. `resolveFontFamily` maps the semantic name through the
 * `--font-*` custom properties to the family actually loaded.
 */
const FONT_TOKENS: Record<string, string> = {
  Outfit: '--font-body',
  Shrikhand: '--font-display',
  Caveat: '--font-hand',
}

/** Resolved family → the semantic picker name it came from. */
const RESOLVED_FONT_NAMES = new Map<string, string>()

export function resolveFontFamily(name: string): string {
  const token = FONT_TOKENS[name]
  if (!token || typeof window === 'undefined') return name

  const declared = window
    .getComputedStyle(window.document.documentElement)
    .getPropertyValue(token)
    .trim()
  if (!declared) return name

  const families = declared
    .split(',')
    .map((family) => family.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
  if (families.length === 0) return name

  // Prefer a family that is actually registered with the FontFace API: the
  // `next/font` `@font-face` rule lands in `document.fonts` once parsed, and
  // that is the only set a canvas 2D context can resolve.
  const faceSet = (window.document as Document & { fonts?: FontFaceSet }).fonts
  if (faceSet) {
    const loaded = families.find((family) =>
      Array.from(faceSet as unknown as Iterable<FontFace>).some((face) => face.family === family),
    )
    if (loaded) {
      RESOLVED_FONT_NAMES.set(loaded, name)
      return loaded
    }
  }

  const [first] = families
  RESOLVED_FONT_NAMES.set(first, name)
  return first
}

/**
 * The picker-facing name for a family string read back off a fabric object.
 * Without this, `handleObjectModified` would write the resolved
 * `__Outfit_<hash>` back into the layer and the picker would show the hash.
 */
export function semanticFontName(family: string | undefined): string | undefined {
  if (!family) return family
  return RESOLVED_FONT_NAMES.get(family) ?? family
}

export function StickerCanvas({
  ref: externalRef,
  width,
  height,
  backgroundColor = 'var(--die-cut)',
  grid = true,
  rulers = true,
  onSelectionChange,
  className,
}: StickerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const [zoom, setZoom] = useState(1)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const {
    design,
    selectedLayerId,
    setFabricCanvas,
    updateLayer,
    selectLayer,
  } = useStickerBuilderStore()

  // `backgroundColor` may be a token; fabric needs a real colour.
  const resolvedBackgroundColor = resolveHex(backgroundColor) ?? backgroundColor

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerSize.width || width * 2,
      height: containerSize.height || height * 2,
      backgroundColor: resolvedBackgroundColor,
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    })

    // Set up grid
    if (grid) {
      const gridSize = 20
      canvas.on('after:render', () => {
        const ctx = canvas.getContext()
        if (!ctx) return

        ctx.save()
        ctx.strokeStyle = 'color-mix(in srgb, var(--ink) 12%, transparent)'
        ctx.lineWidth = 0.5

        const cw = canvas.getWidth() ?? 0
        const ch = canvas.getHeight() ?? 0
        for (let i = 0; i < cw; i += gridSize) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i, ch)
          ctx.stroke()
        }
        for (let i = 0; i < ch; i += gridSize) {
          ctx.beginPath()
          ctx.moveTo(0, i)
          ctx.lineTo(cw, i)
          ctx.stroke()
        }
        ctx.restore()
      })
    }

    // Selection handling
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => {
      selectLayer(null)
      onSelectionChange?.(null)
    })

    // Object modification
    canvas.on('object:modified', handleObjectModified)
    canvas.on('object:moving', handleObjectModified)
    canvas.on('object:scaling', handleObjectModified)
    canvas.on('object:rotating', handleObjectModified)

    fabricRef.current = canvas
    setFabricCanvas(canvas)

    // Load design
    loadDesign(canvas)

    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once canvas init: handlers/refs are captured at mount by design
  }, [])

  // Handle container resize
  useEffect(() => {
    const container = canvasRef.current?.parentElement
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
        if (fabricRef.current) {
          fabricRef.current.setDimensions({ width, height })
          fabricRef.current.renderAll()
        }
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  // Sync design changes to canvas
  useEffect(() => {
    if (!fabricRef.current) return
    loadDesign(fabricRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync only on design/selection changes; loadDesign closes over current props/state
  }, [design, selectedLayerId])

  const loadDesign = (canvas: fabric.Canvas) => {
    // Clear canvas
    canvas.clear()
    canvas.backgroundColor = resolvedBackgroundColor
    canvas.renderAll()

    // Set canvas size based on design

    // Add background image if exists
    if (design.background) {
      fabric.Image.fromURL(design.background.url, (img: fabric.Image) => {
        img.set({
          left: 0,
          top: 0,
          scaleX: design.canvas.width / img.width!,
          scaleY: design.canvas.height / img.height!,
          selectable: false,
          evented: false,
        })
        canvas.add(img)
        canvas.sendToBack(img)
        canvas.renderAll()
      }, { crossOrigin: 'anonymous' })
    }

    // Add layers
    design.layers.forEach((layer) => {
      let fabricObject: fabric.Object

      switch (layer.type) {
        case 'image':
          if (layer.imageUrl) {
            fabric.Image.fromURL(layer.imageUrl, (img: fabric.Image) => {
              img.set({
                left: layer.x,
                top: layer.y,
                scaleX: layer.scaleX,
                scaleY: layer.scaleY,
                angle: layer.rotation,
                opacity: layer.opacity,
                selectable: layer.visible && !layer.locked,
                evented: layer.visible && !layer.locked,
              })
              ;(img as ExtendedFabricObject).id = layer.id
              ;(img as ExtendedFabricObject).layerData = layer
              canvas.add(img)
              canvas.renderAll()
            }, { crossOrigin: 'anonymous' })
          }
          break

        case 'text':
          fabricObject = new fabric.Text(layer.text || '', {
            left: layer.x,
            top: layer.y,
            fontSize: layer.fontSize || 40,
            fontFamily: resolveFontFamily(layer.fontFamily || 'Outfit'),
            fontWeight: layer.fontWeight || 'normal',
            fontStyle: (layer.fontStyle as 'normal' | 'italic' | 'oblique') || 'normal',
            fill: resolveCanvasFill(layer.textColor, 'var(--ink)'),
            textAlign: layer.textAlign || 'left',
            lineHeight: layer.lineHeight || 1.2,
            charSpacing: layer.letterSpacing || 0,
            scaleX: layer.scaleX,
            scaleY: layer.scaleY,
            angle: layer.rotation,
            opacity: layer.opacity,
            selectable: layer.visible && !layer.locked,
            evented: layer.visible && !layer.locked,
          })
          ;(fabricObject as ExtendedFabricObject).id = layer.id
          ;(fabricObject as ExtendedFabricObject).layerData = layer
          canvas.add(fabricObject)
          break

        case 'shape': {
          const shapeObj = createShapeObject(layer)
          if (shapeObj) {
            ;(shapeObj as fabric.Object).set({
              left: layer.x,
              top: layer.y,
              scaleX: layer.scaleX,
              scaleY: layer.scaleY,
              angle: layer.rotation,
              opacity: layer.opacity,
              selectable: layer.visible && !layer.locked,
              evented: layer.visible && !layer.locked,
            })
            ;(shapeObj as ExtendedFabricObject).id = layer.id
            ;(shapeObj as ExtendedFabricObject).layerData = layer
            canvas.add(shapeObj)
          }
          break
        }
      }
    })

    // Set selection
    if (selectedLayerId) {
      const obj = canvas.getObjects().find((o: fabric.Object) => (o as fabric.Object & { id?: string }).id === selectedLayerId)
      if (obj) {
        canvas.setActiveObject(obj)
      }
    }

    canvas.renderAll()
  }

  const handleSelection = (e: fabric.IEvent) => {
    const activeObject = (e.selected?.[0] || e.target) as ExtendedFabricObject | undefined
    if (activeObject?.id) {
      selectLayer(activeObject.id)
      onSelectionChange?.(design.layers.find((l) => l.id === activeObject.id) || null)
    }
  }

  const handleObjectModified = (e: fabric.IEvent) => {
    const obj = e.target as ExtendedFabricObject | undefined
    if (!obj?.id) return

    const updates: Partial<DesignLayer> = {
      x: obj.left || 0,
      y: obj.top || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
      rotation: obj.angle || 0,
      opacity: obj.opacity ?? 1,
    }

    if (obj.type === 'textbox' || obj.type === 'i-text') {
      updates.text = obj.text
      updates.fontSize = obj.fontSize
      updates.fontFamily = semanticFontName(obj.fontFamily)
      updates.fontWeight = String(obj.fontWeight ?? '')
      updates.fontStyle = obj.fontStyle
      updates.fill = typeof obj.fill === 'string' ? obj.fill : undefined
      updates.textAlign = (obj.textAlign as 'left' | 'center' | 'right') || undefined
      updates.lineHeight = obj.lineHeight
      updates.charSpacing = obj.charSpacing
    }

    updateLayer(obj.id, updates)
  }

  const createShapeObject = (layer: DesignLayer) => {
    const { shapeType, fill, stroke, strokeWidth } = layer
    const size = 100

    switch (shapeType) {
      case 'rect':
        return new fabric.Rect({
          width: size,
          height: size,
          fill: resolveCanvasFill(fill, 'var(--brand)'),
          stroke: stroke || 'transparent',
          strokeWidth: strokeWidth || 0,
        })
      case 'circle':
        return new fabric.Circle({
          radius: size / 2,
          fill: resolveCanvasFill(fill, 'var(--brand)'),
          stroke: stroke || 'transparent',
          strokeWidth: strokeWidth || 0,
        })
      case 'triangle':
        return new fabric.Triangle({
          width: size,
          height: size,
          fill: resolveCanvasFill(fill, 'var(--brand)'),
          stroke: stroke || 'transparent',
          strokeWidth: strokeWidth || 0,
        })
      default:
        return null
    }
  }

  // Rulers with cm marks
  const drawRulers = useCallback(() => {
    if (!fabricRef.current || !rulers) return
    const canvas = fabricRef.current
    const cw = canvas.getWidth() ?? 0
    const ch = canvas.getHeight() ?? 0
    const rulerSize = 30
    const rulerFont = `10px ${resolveFontFamily('Outfit')}`

    // Top ruler
    const topRulerCanvas = document.querySelector('.ruler-top canvas') as HTMLCanvasElement
    if (topRulerCanvas) {
      const rctx = topRulerCanvas.getContext('2d')
      if (rctx) {
        rctx.clearRect(0, 0, topRulerCanvas.width, topRulerCanvas.height)
        rctx.fillStyle = 'color-mix(in srgb, var(--die-cut) 90%, transparent)'
        rctx.fillRect(0, 0, topRulerCanvas.width, topRulerCanvas.height)
        rctx.strokeStyle = 'color-mix(in srgb, var(--ink) 20%, transparent)'
        rctx.lineWidth = 1

        // Draw cm marks
        const pxPerCm = cw / (width * 2)
        for (let cm = 0; cm <= width; cm += 1) {
          const x = cm * pxPerCm
          rctx.beginPath()
          rctx.moveTo(x, rulerSize - 10)
          rctx.lineTo(x, rulerSize)
          rctx.stroke()
          if (cm % 1 === 0) {
            rctx.font = rulerFont
            rctx.fillStyle = 'color-mix(in srgb, var(--ink) 60%, transparent)'
            rctx.textAlign = 'center'
            rctx.fillText(`${cm}`, x, rulerSize - 12)
          }
        }
      }
    }

    // Left ruler
    const leftRulerCanvas = document.querySelector('.ruler-left canvas') as HTMLCanvasElement
    if (leftRulerCanvas) {
      const rctx = leftRulerCanvas.getContext('2d')
      if (rctx) {
        rctx.clearRect(0, 0, leftRulerCanvas.width, leftRulerCanvas.height)
        rctx.fillStyle = 'color-mix(in srgb, var(--die-cut) 90%, transparent)'
        rctx.fillRect(0, 0, leftRulerCanvas.width, leftRulerCanvas.height)
        rctx.strokeStyle = 'color-mix(in srgb, var(--ink) 20%, transparent)'
        rctx.lineWidth = 1

        const pxPerCm = ch / (height * 2)
        for (let cm = 0; cm <= height; cm += 1) {
          const y = cm * pxPerCm
          rctx.beginPath()
          rctx.moveTo(rulerSize - 10, y)
          rctx.lineTo(rulerSize, y)
          rctx.stroke()
          if (cm % 1 === 0) {
            rctx.font = rulerFont
            rctx.fillStyle = 'color-mix(in srgb, var(--ink) 60%, transparent)'
            rctx.textAlign = 'right'
            rctx.fillText(`${cm}`, rulerSize - 12, y + 3)
          }
        }
      }
    }
  }, [width, height, rulers])

  // Draw rulers on render
  useEffect(() => {
    if (!rulers) return
    const canvas = fabricRef.current
    if (!canvas) return

    const handleRender = () => {
      drawRulers()
    }
    canvas.on('after:render', handleRender)
    drawRulers()
    return () => {
      canvas.off('after:render', handleRender)
    }
  }, [drawRulers, rulers])

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!fabricRef.current) return
    const newZoom = Math.min(zoom * 1.2, 5)
    fabricRef.current.setZoom(newZoom)
    setZoom(newZoom)
  }, [zoom])

  const zoomOut = useCallback(() => {
    if (!fabricRef.current) return
    const newZoom = Math.max(zoom / 1.2, 0.1)
    fabricRef.current.setZoom(newZoom)
    setZoom(newZoom)
  }, [zoom])

  const resetZoom = useCallback(() => {
    if (!fabricRef.current) return
    fabricRef.current.setZoom(1)
    setZoom(1)
    fabricRef.current.viewportTransform = [1, 0, 0, 1, 0, 0]
    fabricRef.current.renderAll()
  }, [])

  return (
    <div className={cn('relative overflow-hidden bg-[var(--paper-deep)] rounded-[var(--radius-lg)]', className)}>
      {/* Rulers */}
      {rulers && (
        <>
          <div className="absolute top-0 left-8 w-full h-8 bg-[color-mix(in_srgb,var(--die-cut)_90%,transparent)] backdrop-blur-sm border-b border-[color-mix(in_srgb,var(--ink)_20%,transparent)] overflow-hidden ruler-top z-10">
            <canvas className="w-full h-full" width={width * 2} height={30} />
          </div>
          <div className="absolute top-8 left-0 w-8 h-full bg-[color-mix(in_srgb,var(--die-cut)_90%,transparent)] backdrop-blur-sm border-r border-[color-mix(in_srgb,var(--ink)_20%,transparent)] overflow-hidden ruler-left z-10">
            <canvas className="w-full h-full" width={30} height={height * 2} />
          </div>
          {/* Corner */}
          <div className="absolute top-0 left-0 w-8 h-8 bg-[color-mix(in_srgb,var(--die-cut)_90%,transparent)] backdrop-blur-sm border-b border-r border-[color-mix(in_srgb,var(--ink)_20%,transparent)] z-20" />
        </>
      )}

      {/* Canvas with 3px ink border and StickerPeel corner */}
      <div className="relative aspect-square border-[3px] border-[var(--ink)]">
        <canvas
          ref={(el) => {
            canvasRef.current = el
            if (typeof externalRef === 'function') externalRef(el)
            else if (externalRef && 'current' in externalRef) (externalRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
          }}
          className="w-full h-full"
        />
        {/* Sticker Peel Corner */}
        <StickerPeel className="absolute top-[-5px] right-[-5px]" />
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-[color-mix(in_srgb,var(--die-cut)_90%,transparent)] backdrop-blur-sm rounded-[var(--radius-md)] p-2 shadow-[var(--shadow-ink-2)] z-10">
        <button onClick={zoomOut} className="p-2 text-[var(--ink)] hover:text-[var(--brand)] transition-colors" aria-label="Zoom out">−</button>
        <span className="px-3 text-sm font-medium text-[var(--ink)]">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} className="p-2 text-[var(--ink)] hover:text-[var(--brand)] transition-colors" aria-label="Zoom in">+</button>
        <button onClick={resetZoom} className="p-2 text-[var(--ink)] hover:text-[var(--brand)] transition-colors" aria-label="Reset zoom">
          <Home className="w-4 h-4" />
        </button>
      </div>

      {/* Dimensions Display */}
      <div className="absolute bottom-4 left-4 bg-[color-mix(in_srgb,var(--die-cut)_90%,transparent)] backdrop-blur-sm rounded-[var(--radius-md)] px-3 py-1 text-sm font-medium text-[var(--ink)] z-10">
        {design.canvas.width} × {design.canvas.height} cm @ {design.canvas.dpi} DPI
      </div>
    </div>
  )
}

// Minimal canvas for preview
export function StickerPreview({
  design,
  width = 300,
  height = 300,
  className,
}: {
  design: StickerDesign
  width?: number
  height?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: resolveHex('var(--die-cut)') ?? 'var(--die-cut)',
      selection: false,
      renderOnAddRemove: true,
    })

    // Load design similar to main canvas
    if (design.background) {
      fabric.Image.fromURL(design.background.url, (img: fabric.Image) => {
        img.set({
          left: 0,
          top: 0,
          scaleX: design.canvas.width / img.width!,
          scaleY: design.canvas.height / img.height!,
          selectable: false,
          evented: false,
        })
        canvas.add(img)
        canvas.sendToBack(img)
        canvas.renderAll()
      }, { crossOrigin: 'anonymous' })
    }

    design.layers.forEach((layer) => {
      if (layer.type === 'image' && layer.imageUrl) {
        fabric.Image.fromURL(layer.imageUrl, (img: fabric.Image) => {
          img.set({
            left: layer.x,
            top: layer.y,
            scaleX: layer.scaleX,
            scaleY: layer.scaleY,
            angle: layer.rotation,
            opacity: layer.opacity,
            selectable: false,
            evented: false,
          })
          canvas.add(img)
          canvas.renderAll()
        }, { crossOrigin: 'anonymous' })
      }
    })

    return () => { canvas.dispose() }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-apply only on design changes; width/height read from props snapshot
  }, [design])

  return (
    <canvas ref={canvasRef} className={cn('rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]', className)} width={width} height={height} />
  )
}
