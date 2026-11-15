'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StickerPreview } from './StickerCanvas'
import { Checkbox } from '@/components/ui/Checkbox'
import { Slider } from '@/components/ui/Slider'
import type { StickerDesign, MaterialType, FinishType, CutType } from '@/types'
import { Download, Eye, CheckCircle, XCircle, Settings, FileImage, FileText, Share2, Copy, RotateCcw } from 'lucide-react'

interface ExportPreviewProps {
  design: StickerDesign
  onExport: (format: 'png' | 'jpg' | 'pdf' | 'svg', options: ExportOptions) => Promise<void>
  onClose: () => void
  className?: string
}

interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg'
  dpi: number
  quality: number
  background: 'transparent' | 'white' | 'checkerboard'
  includeCutLine: boolean
  includeBleed: boolean
  bleedAmount: number
  colorProfile: 'sRGB' | 'CMYK'
  scale: number
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: 'png',
  dpi: 300,
  quality: 90,
  background: 'transparent',
  includeCutLine: true,
  includeBleed: true,
  bleedAmount: 3, // mm
  colorProfile: 'sRGB',
  scale: 1,
}

export function ExportPreview({
  design,
  onExport,
  onClose,
  className,
}: ExportPreviewProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS)
  const [exporting, setExporting] = useState<'png' | 'jpg' | 'pdf' | 'svg' | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [exportResults, setExportResults] = useState<Record<string, { url: string; size: string }>>({})

  const fileSize = calculateEstimatedSize()
  const dimensions = `${design.canvas.width} × ${design.canvas.height} cm`
  const pixels = `${Math.round(design.canvas.width * options.dpi / 2.54)} × ${Math.round(design.canvas.height * options.dpi / 2.54)} px`

  const handleExport = async (format: 'png' | 'jpg' | 'pdf' | 'svg') => {
    setExporting(format)
    try {
      const exportOptions = { ...options, format }
      await onExport(format, exportOptions)
      // In real app, this would return the blob/url
      // setExportResults(prev => ({ ...prev, [format]: { url: blobUrl, size: formatFileSize(blob.size) } }))
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(null)
    }
  }

  function calculateEstimatedSize() {
    const pixels = design.canvas.width * options.dpi / 2.54 * design.canvas.height * options.dpi / 2.54
    const bytes = pixels * 4 * (options.quality / 100) * (options.scale * options.scale)
    return formatFileSize(bytes)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm', className)}>
      <div className="bg-white rounded-card border-3 border-[var(--ink)] shadow-[0_25px_50px_rgba(0,0,0,0.25)] w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--light)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-input bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] flex items-center justify-center">
              <FileImage className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl text-primary">Export Preview</h2>
              <p className="text-sm text-[var(--text-subtle)]">{dimensions} • {pixels} • ~{fileSize}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Preview Panel */}
          <div className="md:w-1/2 p-4 border-r border-[var(--light)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-body text-[var(--ink)]">Preview</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => generatePreview()}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="flex-1 relative bg-[var(--light)] rounded-input overflow-hidden flex items-center justify-center min-h-[300px]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Export preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <StickerPreview design={design} width={400} height={400} />
              )}
            </div>

            {/* Export Status */}
            <div className="mt-4 space-y-2">
              {Object.entries(exportResults).map(([format, result]) => (
                <div key={format} className="flex items-center justify-between p-3 bg-white rounded-input border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-body text-[var(--ink)]">{format.toUpperCase()}</span>
                    <Badge variant="secondary" size="sm">{result.size}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => downloadBlob(result.url, `custom-sticker.${format}`)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="md:w-1/2 p-4 space-y-6 overflow-y-auto">
            {/* Format Selection */}
            <fieldset>
              <legend className="font-medium text-body text-[var(--ink)] mb-3">Format</legend>
              <div className="grid grid-cols-2 gap-2">
                {['png', 'jpg', 'pdf', 'svg'].map((format) => (
                  <button
                    key={format}
                    onClick={() => setOptions((prev) => ({ ...prev, format: format as any }))}
                    className={cn(
                      'p-3 rounded-input border-3 text-center transition-all',
                      options.format === format
                        ? 'border-primary bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary'
                        : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] text-[var(--ink)] hover:border-primary'
                    )}
                  >
                    <div className="font-display text-lg mb-1">{format.toUpperCase()}</div>
                    <div className="text-xs text-[var(--text-subtle)]">
                      {format === 'png' && 'Transparent, lossless'}
                      {format === 'jpg' && 'Compressed, smaller'}
                      {format === 'pdf' && 'Print-ready, vector'}
                      {format === 'svg' && 'Scalable, editable'}
                    </div>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Quality & DPI */}
            <fieldset>
              <legend className="font-medium text-body text-[var(--ink)] mb-3">Quality & Resolution</legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">DPI <span className="text-primary">({options.dpi})</span></label>
                  <Slider
                    value={options.dpi}
                    onChange={(v: number | number[]) => setOptions((prev) => ({ ...prev, dpi: v as number }))}
                    min={72}
                    max={600}
                    step={1}
                  />
                </div>
                {options.format !== 'svg' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--ink)] mb-2">Quality <span className="text-primary">({options.quality}%)</span></label>
                    <Slider
                      value={options.quality}
                      onChange={(v: number | number[]) => setOptions((prev) => ({ ...prev, quality: v as number }))}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Scale <span className="text-primary">({options.scale}x)</span></label>
                  <Slider
                    value={options.scale}
                    onChange={(v: number | number[]) => setOptions((prev) => ({ ...prev, scale: v as number }))}
                    min={0.25}
                    max={4}
                    step={0.25}
                  />
                </div>
              </div>
            </fieldset>

            {/* Background */}
            <fieldset>
              <legend className="font-medium text-body text-[var(--ink)] mb-3">Background</legend>
              <div className="grid grid-cols-3 gap-2">
                {['transparent', 'white', 'checkerboard'].map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setOptions((prev) => ({ ...prev, background: bg as any }))}
                    className={cn(
                      'p-3 rounded-input border-3 text-center transition-all',
                      options.background === bg
                        ? 'border-primary bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary'
                        : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] text-[var(--ink)] hover:border-primary'
                    )}
                  >
                    <div className="w-12 h-12 mx-auto mb-2 rounded-input border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]">
                      {bg === 'transparent' && (
                        <div className="w-full h-full bg-[linear-gradient(45deg,_#ccc_25%,_transparent_25%),_linear-gradient(45deg,_transparent_75%,_#ccc_75%)] bg-[size:20px_20px]" />
                      )}
                      {bg === 'white' && <div className="w-full h-full bg-white" />}
                      {bg === 'checkerboard' && (
                        <div className="w-full h-full bg-[linear-gradient(45deg,_#ddd_25%,_transparent_25%),_linear-gradient(45deg,_transparent_75%,_#ddd_75%)] bg-[size:10px_10px]" />
                      )}
                    </div>
                    <span className="text-sm capitalize">{bg}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Advanced Options */}
            <Button variant="ghost" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full justify-start">
              {showAdvanced ? <Settings className="w-4 h-4 mr-1 rotate-180" /> : <Settings className="w-4 h-4 mr-1" />}
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </Button>

            {showAdvanced && (
              <div className="space-y-4 border-t border-[var(--light)] pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={options.includeCutLine}
                      onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, includeCutLine: checked === true }))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-[var(--ink)]">Include Cut Line</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={options.includeBleed}
                      onCheckedChange={(checked) => setOptions((prev) => ({ ...prev, includeBleed: checked === true }))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-[var(--ink)]">Include Bleed</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Bleed Amount <span className="text-primary">({options.bleedAmount}mm)</span></label>
                  <Slider
                    value={options.bleedAmount}
                    onChange={(v) => setOptions((prev) => ({ ...prev, bleedAmount: v as number }))}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--ink)] mb-2">Color Profile</label>
                    <select
                      value={options.colorProfile}
                      onChange={(e) => setOptions((prev) => ({ ...prev, colorProfile: e.target.value as any }))}
                      className="w-full px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input focus:border-primary focus:shadow-input"
                    >
                      <option value="sRGB">sRGB (Web)</option>
                      <option value="CMYK">CMYK (Print)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="border-t border-[var(--light)] p-4 flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="lg"
          className="flex-1 min-w-[150px]"
          onClick={() => handleExport('png')}
          loading={exporting === 'png'}
        >
          <Download className="w-5 h-5 mr-2" />
          Export PNG
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 min-w-[150px]"
          onClick={() => handleExport('jpg')}
          loading={exporting === 'jpg'}
        >
          <Download className="w-5 h-5 mr-2" />
          Export JPG
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 min-w-[150px]"
          onClick={() => handleExport('pdf')}
          loading={exporting === 'pdf'}
        >
          <Download className="w-5 h-5 mr-2" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 min-w-[150px]"
          onClick={() => handleExport('svg')}
          loading={exporting === 'svg'}
        >
          <Download className="w-5 h-5 mr-2" />
          Export SVG
        </Button>
        <Button variant="ghost" onClick={onClose} className="flex-1 min-w-[150px]">
          Cancel
        </Button>
      </div>
    </div>
  )
}

function generatePreview() {
  // This would generate a preview based on current settings
  // For now, just trigger a re-render
}

function downloadBlob(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

// Export Settings Summary Component
export function ExportSettingsSummary({ options }: { options: ExportOptions }) {
  return (
    <div className="bg-[var(--light)] rounded-input p-4 border-2 border-[var(--ink)] space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-body text-[var(--ink)]">Estimated Output</span>
        <Badge variant="primary" size="sm">{options.format.toUpperCase()}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xl font-display text-primary">{options.dpi}</div>
          <div className="text-xs text-[var(--text-subtle)]">DPI</div>
        </div>
        <div>
          <div className="text-xl font-display text-primary">{options.quality}%</div>
          <div className="text-xs text-[var(--text-subtle)]">Quality</div>
        </div>
        <div>
          <div className="text-xl font-display text-primary">{options.scale}x</div>
          <div className="text-xs text-[var(--text-subtle)]">Scale</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {options.includeCutLine && <Badge variant="outline" size="sm">Cut Line</Badge>}
        {options.includeBleed && <Badge variant="outline" size="sm">Bleed ({options.bleedAmount}mm)</Badge>}
        <Badge variant="outline" size="sm">{options.colorProfile}</Badge>
        <Badge variant="outline" size="sm">{options.background}</Badge>
      </div>
    </div>
  )
}