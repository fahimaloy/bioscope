'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import { cn } from '@/lib/utils'
import type { StickerDesign, DesignLayer, MaterialType, FinishType, CutType } from '@/types'
import { useStickerBuilderStore } from '@/lib/hooks/useStickerBuilder'

interface StickerCanvasProps {
  ref?: any
  width: number
  height: number
  backgroundColor?: string
  grid?: boolean
  rulers?: boolean
  onSelectionChange?: (layer: DesignLayer | null) => void
  className?: string
}

export function StickerCanvas({
  ref: externalRef,
  width,
  height,
  backgroundColor = '#FFFFFF',
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
    fabricCanvas: storeFabricCanvas,
    setFabricCanvas,
    updateLayer,
    selectLayer,
  } = useStickerBuilderStore()

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerSize.width || width * 2,
      height: containerSize.height || height * 2,
      backgroundColor,
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
        ctx.strokeStyle = '#E0E0E0'
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
  }, [design, selectedLayerId])

  const loadDesign = (canvas: fabric.Canvas) => {
    // Clear canvas
    canvas.clear()
    canvas.backgroundColor = backgroundColor
    canvas.renderAll()

    // Set canvas size based on design
    const scale = Math.min(
      (containerSize.width || width * 2) / (design.canvas.width * 2),
      (containerSize.height || height * 2) / (design.canvas.height * 2)
    ) * 0.9

    // Add background image if exists
    if (design.background) {
      fabric.Image.fromURL(design.background.url, (img: any) => {
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
    design.layers.forEach((layer, index) => {
      let fabricObject: any

      switch (layer.type) {
        case 'image':
          if (layer.imageUrl) {
            fabric.Image.fromURL(layer.imageUrl, (img: any) => {
              img.set({
                left: layer.x,
                top: layer.y,
                scaleX: layer.scaleX,
                scaleY: layer.scaleY,
                angle: layer.rotation,
                opacity: layer.opacity,
                selectable: layer.visible && !layer.locked,
                evented: layer.visible && !layer.locked,
                id: layer.id,
                layerData: layer,
              })
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
            fontFamily: layer.fontFamily || 'Outfit',
            fontWeight: layer.fontWeight || 'normal',
            fontStyle: (layer.fontStyle || 'normal') as any,
            fill: layer.textColor || '#000000',
            textAlign: layer.textAlign || 'left',
            lineHeight: layer.lineHeight || 1.2,
            charSpacing: layer.letterSpacing || 0,
            scaleX: layer.scaleX,
            scaleY: layer.scaleY,
            angle: layer.rotation,
            opacity: layer.opacity,
            selectable: layer.visible && !layer.locked,
            evented: layer.visible && !layer.locked,
            id: layer.id,
            layerData: layer,
          } as any)
          canvas.add(fabricObject)
          break

        case 'shape':
          fabricObject = createShapeObject(layer)
          if (fabricObject) {
            fabricObject.set({
              left: layer.x,
              top: layer.y,
              scaleX: layer.scaleX,
              scaleY: layer.scaleY,
              angle: layer.rotation,
              opacity: layer.opacity,
              selectable: layer.visible && !layer.locked,
              evented: layer.visible && !layer.locked,
              id: layer.id,
              layerData: layer,
            })
            canvas.add(fabricObject)
          }
          break
      }
    })

    // Set selection
    if (selectedLayerId) {
      const obj = canvas.getObjects().find((o: any) => o.id === selectedLayerId)
      if (obj) {
        canvas.setActiveObject(obj)
      }
    }

    canvas.renderAll()
  }

  const handleSelection = (e: any) => {
    const activeObject = e.selected?.[0] || e.target
    if (activeObject?.id) {
      selectLayer(activeObject.id)
      onSelectionChange?.(design.layers.find((l) => l.id === activeObject.id) || null)
    }
  }

  const handleObjectModified = (e: any) => {
    const obj = e.target
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
      updates.fontFamily = obj.fontFamily
      updates.fontWeight = obj.fontWeight
      updates.fontStyle = obj.fontStyle as any
      updates.fill = obj.fill
      updates.textAlign = obj.textAlign
      updates.lineHeight = obj.lineHeight
      updates.charSpacing = obj.charSpacing
    }

    updateLayer(obj.id, updates)
  }

  const createShapeObject = (layer: DesignLayer) => {
    const { shapeType, fill, stroke, strokeWidth, sides } = layer
    const size = 100

    switch (shapeType) {
      case 'rect':
        return new fabric.Rect({
          width: size,
          height: size,
          fill: fill || 'var(--primary)',
          stroke: stroke || 'transparent',
          strokeWidth: strokeWidth || 0,
        })
      case 'circle':
        return new fabric.Circle({
          radius: size / 2,
          fill: fill || 'var(--primary)',
          stroke: stroke || 'transparent',
          strokeWidth: strokeWidth || 0,
        })
      case 'triangle':
        return new fabric.Triangle({
          width: size,
          height: size,
          fill: fill || 'var(--primary)',
          stroke: stroke || 'transparent',
          strokeWidth: strokeWidth || 0,
        })
      default:
        return null
    }
  }

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
    <div className={cn('relative overflow-hidden bg-[var(--light)] rounded-card', className)}>
      {/* Canvas */}
      <div className="relative aspect-square">
        <canvas
          ref={(el) => {
            canvasRef.current = el
            if (typeof externalRef === 'function') externalRef(el)
            else if (externalRef) (externalRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
          }}
          className="w-full h-full"
        />
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-input p-2 shadow-lg">
        <button onClick={zoomOut} className="p-2 text-[var(--ink)] hover:text-primary transition-colors" aria-label="Zoom out">−</button>
        <span className="px-3 text-sm font-medium text-[var(--ink)]">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} className="p-2 text-[var(--ink)] hover:text-primary transition-colors" aria-label="Zoom in">+</button>
        <button onClick={resetZoom} className="p-2 text-[var(--ink)] hover:text-primary transition-colors" aria-label="Reset zoom">⌂</button>
      </div>

      {/* Rulers */}
      {rulers && (
        <>
          <div className="absolute top-0 left-0 w-full h-8 bg-white/90 backdrop-blur-sm border-b border-[var(--ink)]/20 overflow-hidden">
            <canvas className="w-full h-full" width={width * 2} height={80} />
          </div>
          <div className="absolute top-0 left-0 w-8 h-full bg-white/90 backdrop-blur-sm border-r border-[var(--ink)]/20 overflow-hidden">
            <canvas className="w-full h-full" width={80} height={height * 2} />
          </div>
        </>
      )}

      {/* Dimensions Display */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-input px-3 py-1 text-sm font-medium text-[var(--ink)]">
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
      backgroundColor: '#FFFFFF',
      selection: false,
      renderOnAddRemove: true,
    })

    // Load design similar to main canvas
    if (design.background) {
      fabric.Image.fromURL(design.background.url, (img: any) => {
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
        fabric.Image.fromURL(layer.imageUrl, (img: any) => {
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
  }, [design])

  return (
    <canvas ref={canvasRef} className={cn('rounded-input border border-[var(--ink)]/20', className)} width={width} height={height} />
  )
}