'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Dropdown } from '@/components/ui/Dropdown'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import type { DesignLayer, ImageFilter } from '@/types'
import {
  Crop,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Circle,
  Square,
  Triangle,
  Star,
  Type,
  Image as ImageIcon,
  Undo,
  Redo,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
} from 'lucide-react'

interface EditingToolsProps {
  selectedLayer: DesignLayer | null
  onUpdateLayer: (id: string, updates: Partial<DesignLayer>) => void
  onDeleteLayer: (id: string) => void
  onDuplicateLayer: (id: string) => void
  onLockLayer: (id: string) => void
  onToggleVisibility: (id: string) => void
  onCropLayer: (id: string) => void
  onResetTransform: (id: string) => void
  className?: string
}

export function EditingTools({
  selectedLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onLockLayer,
  onToggleVisibility,
  onCropLayer,
  onResetTransform,
  className,
}: EditingToolsProps) {
  const [activeTab, setActiveTab] = useState<'transform' | 'filters' | 'text' | 'shape'>('transform')
  const [cropMode, setCropMode] = useState(false)

  if (!selectedLayer) {
    return (
      <div className={cn('p-4 text-center text-[var(--ink)]/50', className)}>
        <p className="text-body">Select a layer to edit</p>
      </div>
    )
  }

  const isImage = selectedLayer.type === 'image'
  const isText = selectedLayer.type === 'text'
  const isShape = selectedLayer.type === 'shape'

  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card p-4 space-y-4', className)}>
      {/* Layer Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={isImage ? 'primary' : isText ? 'secondary' : 'accent'} size="sm">
            {selectedLayer.type}
          </Badge>
          <span className="font-medium text-body text-[var(--ink)] truncate max-w-[200px]">
            {selectedLayer.type === 'text' ? selectedLayer.text?.substring(0, 30) : 'Layer'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(selectedLayer.id)}
            className={selectedLayer.visible ? '' : 'opacity-50'}
            aria-label={selectedLayer.visible ? 'Hide layer' : 'Show layer'}
          >
            {selectedLayer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLockLayer(selectedLayer.id)}
            className={selectedLayer.locked ? 'text-primary' : ''}
            aria-label={selectedLayer.locked ? 'Unlock layer' : 'Lock layer'}
          >
            {selectedLayer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicateLayer(selectedLayer.id)} aria-label="Duplicate layer">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteLayer(selectedLayer.id)} className="text-red-500 hover:bg-red-50" aria-label="Delete layer">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4 bg-[var(--light)] rounded-input p-1">
          <TabsTrigger value="transform" disabled={selectedLayer.locked}>
            <Maximize className="w-4 h-4 mr-1" />
            Transform
          </TabsTrigger>
          {isImage && (
            <TabsTrigger value="filters">
              <Sun className="w-4 h-4 mr-1" />
              Filters
            </TabsTrigger>
          )}
          {isText && (
            <TabsTrigger value="text">
              <Type className="w-4 h-4 mr-1" />
              Text
            </TabsTrigger>
          )}
          {isShape && (
            <TabsTrigger value="shape">
              <Square className="w-4 h-4 mr-1" />
              Shape
            </TabsTrigger>
          )}
        </TabsList>

        {/* Transform Tab */}
        <TabsContent value="transform" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Position X</label>
              <Slider
                value={selectedLayer.x}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { x: v as number })}
                min={-500}
                max={500}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Position Y</label>
              <Slider
                value={selectedLayer.y}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { y: v as number })}
                min={-500}
                max={500}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Scale X</label>
              <Slider
                value={selectedLayer.scaleX}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { scaleX: v as number })}
                min={0.1}
                max={5}
                step={0.05}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Scale Y</label>
              <Slider
                value={selectedLayer.scaleY}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { scaleY: v as number })}
                min={0.1}
                max={5}
                step={0.05}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Rotation</label>
              <Slider
                value={selectedLayer.rotation}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { rotation: v as number })}
                min={-180}
                max={180}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Opacity</label>
              <Slider
                value={selectedLayer.opacity ?? 1}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { opacity: v as number })}
                min={0}
                max={1}
                step={0.05}
                disabled={selectedLayer.locked}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Button variant="outline" onClick={() => onResetTransform(selectedLayer.id)} disabled={selectedLayer.locked}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset Transform
              </Button>
              {isImage && (
                <Button variant="outline" onClick={() => setCropMode(!cropMode)}>
                  <Crop className="w-4 h-4 mr-1" />
                  {cropMode ? 'Exit Crop' : 'Crop Image'}
                </Button>
              )}
            </div>
          </div>

          {/* Quick transform buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => onUpdateLayer(selectedLayer.id, { rotation: selectedLayer.rotation - 90 })} disabled={selectedLayer.locked} aria-label="Rotate left">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onUpdateLayer(selectedLayer.id, { rotation: selectedLayer.rotation + 90 })} disabled={selectedLayer.locked} aria-label="Rotate right">
              <RotateCcw className="w-4 h-4 rotate-180" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onUpdateLayer(selectedLayer.id, { scaleX: -selectedLayer.scaleX })} disabled={selectedLayer.locked} aria-label="Flip horizontal">
              <FlipHorizontal className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onUpdateLayer(selectedLayer.id, { scaleY: -selectedLayer.scaleY })} disabled={selectedLayer.locked} aria-label="Flip vertical">
              <FlipVertical className="w-4 h-4" />
            </Button>
          </div>
        </TabsContent>

        {/* Filters Tab */}
        {isImage && (
          <TabsContent value="filters" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Brightness</label>
              <Slider
                value={selectedLayer.imageFilter?.brightness ?? 100}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { imageFilter: { ...selectedLayer.imageFilter, brightness: v as number } })}
                min={0}
                max={200}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Contrast</label>
              <Slider
                value={selectedLayer.imageFilter?.contrast ?? 100}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { imageFilter: { ...selectedLayer.imageFilter, contrast: v as number } })}
                min={0}
                max={200}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Saturation</label>
              <Slider
                value={selectedLayer.imageFilter?.saturation ?? 100}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { imageFilter: { ...selectedLayer.imageFilter, saturation: v as number } })}
                min={0}
                max={200}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Hue</label>
              <Slider
                value={selectedLayer.imageFilter?.hue ?? 0}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { imageFilter: { ...selectedLayer.imageFilter, hue: v as number } })}
                min={-180}
                max={180}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Blur</label>
              <Slider
                value={selectedLayer.imageFilter?.blur ?? 0}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { imageFilter: { ...selectedLayer.imageFilter, blur: v as number } })}
                min={0}
                max={10}
                step={0.1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Grayscale</label>
              <Slider
                value={selectedLayer.imageFilter?.grayscale ?? 0}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { imageFilter: { ...selectedLayer.imageFilter, grayscale: v as number } })}
                min={0}
                max={100}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Sepia</label>
              <Slider
                value={selectedLayer.imageFilter?.sepia ?? 0}
                onChange={(v) => onUpdateLayer(selectedLayer.id, { imageFilter: { ...selectedLayer.imageFilter, sepia: v as number } })}
                min={0}
                max={100}
                step={1}
                disabled={selectedLayer.locked}
              />
            </div>
            <Button variant="outline" onClick={() => onUpdateLayer(selectedLayer.id, { imageFilter: {} })} disabled={selectedLayer.locked}>
              Reset All Filters
            </Button>
          </TabsContent>
        )}

        {/* Text Tab */}
        {isText && (
          <TabsContent value="text" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Text Content</label>
              <textarea
                value={selectedLayer.text || ''}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { text: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input text-body text-[var(--ink)] resize-y min-h-[80px]"
                disabled={selectedLayer.locked}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Font Family</label>
                <Dropdown
                  trigger={<Button variant="outline" className="w-full justify-between">{selectedLayer.fontFamily || 'Outfit'}</Button>}
                  items={[
                    { value: 'Outfit', label: 'Outfit' },
                    { value: 'Bangers', label: 'Bangers' },
                    { value: 'Arial', label: 'Arial' },
                    { value: 'Helvetica', label: 'Helvetica' },
                    { value: 'Georgia', label: 'Georgia' },
                    { value: 'Times New Roman', label: 'Times New Roman' },
                    { value: 'Courier New', label: 'Courier New' },
                    { value: 'Verdana', label: 'Verdana' },
                  ]}
                  value={selectedLayer.fontFamily}
                  onChange={(v) => onUpdateLayer(selectedLayer.id, { fontFamily: v })}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Font Size</label>
                <Slider
                  value={selectedLayer.fontSize || 40}
                  onChange={(v) => onUpdateLayer(selectedLayer.id, { fontSize: v as number })}
                  min={8}
                  max={200}
                  step={1}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Font Weight</label>
                <Dropdown
                  trigger={<Button variant="outline" className="w-full justify-between">{selectedLayer.fontWeight || 'normal'}</Button>}
                  items={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'bold', label: 'Bold' },
                    { value: '300', label: 'Light' },
                    { value: '500', label: 'Medium' },
                    { value: '600', label: 'Semi Bold' },
                    { value: '700', label: 'Bold' },
                    { value: '800', label: 'Extra Bold' },
                  ]}
                  value={selectedLayer.fontWeight || 'normal'}
                  onChange={(v) => onUpdateLayer(selectedLayer.id, { fontWeight: v })}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Font Style</label>
                <Dropdown
                  trigger={<Button variant="outline" className="w-full justify-between">{selectedLayer.fontStyle || 'normal'}</Button>}
                  items={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'italic', label: 'Italic' },
                  ]}
                  value={selectedLayer.fontStyle || 'normal'}
                  onChange={(v) => onUpdateLayer(selectedLayer.id, { fontStyle: v })}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Text Color</label>
                <ColorPicker
                  value={selectedLayer.textColor || '#000000'}
                  onChange={(color) => onUpdateLayer(selectedLayer.id, { textColor: color })}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Alignment</label>
                <Dropdown
                  trigger={<Button variant="outline" className="w-full justify-between">{selectedLayer.textAlign || 'left'}</Button>}
                  items={[
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' },
                  ]}
                  value={selectedLayer.textAlign || 'left'}
                  onChange={(v) => onUpdateLayer(selectedLayer.id, { textAlign: v as any })}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Line Height</label>
                <Slider
                  value={selectedLayer.lineHeight || 1.2}
                  onChange={(v) => onUpdateLayer(selectedLayer.id, { lineHeight: v as number })}
                  min={0.5}
                  max={3}
                  step={0.1}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Letter Spacing</label>
                <Slider
                  value={selectedLayer.letterSpacing || 0}
                  onChange={(v) => onUpdateLayer(selectedLayer.id, { letterSpacing: v as number })}
                  min={-5}
                  max={20}
                  step={0.5}
                  disabled={selectedLayer.locked}
                />
              </div>
            </div>
          </TabsContent>
        )}

        {/* Shape Tab */}
        {isShape && (
          <TabsContent value="shape" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Shape Type</label>
              <div className="flex flex-wrap gap-2">
                {['rect', 'circle', 'triangle', 'star'].map((shape) => (
                  <button
                    key={shape}
                    onClick={() => onUpdateLayer(selectedLayer.id, { shapeType: shape as any })}
                    className={cn(
                      'p-3 rounded-input border-3 transition-all',
                      selectedLayer.shapeType === shape
                        ? 'border-primary bg-primary/10'
                        : 'border-[var(--ink)]/30 hover:border-primary'
                    )}
                    disabled={selectedLayer.locked}
                  >
                    {shape === 'rect' && <Square className="w-6 h-6" />}
                    {shape === 'circle' && <Circle className="w-6 h-6" />}
                    {shape === 'triangle' && <Triangle className="w-6 h-6" />}
                    {shape === 'star' && <Star className="w-6 h-6" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Fill Color</label>
                <ColorPicker
                  value={selectedLayer.fill || 'var(--primary)'}
                  onChange={(color) => onUpdateLayer(selectedLayer.id, { fill: color })}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Stroke Color</label>
                <ColorPicker
                  value={selectedLayer.stroke || 'transparent'}
                  onChange={(color) => onUpdateLayer(selectedLayer.id, { stroke: color })}
                  disabled={selectedLayer.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Stroke Width</label>
                <Slider
                  value={selectedLayer.strokeWidth || 0}
                  onChange={(v) => onUpdateLayer(selectedLayer.id, { strokeWidth: v as number })}
                  min={0}
                  max={20}
                  step={0.5}
                  disabled={selectedLayer.locked}
                />
              </div>
              {selectedLayer.shapeType === 'polygon' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Sides</label>
                  <Slider
                    value={selectedLayer.sides || 5}
                    onChange={(v) => onUpdateLayer(selectedLayer.id, { sides: v as number })}
                    min={3}
                    max={12}
                    step={1}
                    disabled={selectedLayer.locked}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}