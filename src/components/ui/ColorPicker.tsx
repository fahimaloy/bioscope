'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  disabled?: boolean
  presetColors?: string[]
  showAlpha?: boolean
  className?: string
}

const DEFAULT_PRESETS = [
  'var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--purple)',
  '#E67E22', 'var(--success)', 'var(--info)', 'var(--error)',
  '#1ABC9C', 'var(--warning)', 'var(--purple)', 'var(--dark)',
  '#FFFFFF', '#000000',
]

export function ColorPicker({
  value,
  onChange,
  label,
  disabled = false,
  presetColors = DEFAULT_PRESETS,
  showAlpha = false,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentColor, setCurrentColor] = useState(value)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setCurrentColor(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePresetClick = (color: string) => {
    setCurrentColor(color)
    onChange(color)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCurrentColor(color)
    onChange(color)
  }

  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const alpha = Math.round(parseFloat(e.target.value) * 255).toString(16).padStart(2, '0')
    const hex = currentColor.startsWith('#') ? currentColor : `#${currentColor}`
    const newColor = `${hex}${alpha}`
    setCurrentColor(newColor)
    onChange(newColor)
  }

  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '')
    if (cleanHex.length === 3) {
      return cleanHex.split('').map((c) => parseInt(c + c, 16))
    }
    if (cleanHex.length === 6) {
      return cleanHex.match(/.{2}/g)!.map((c) => parseInt(c, 16))
    }
    return [0, 0, 0]
  }

  const rgb = hexToRgb(currentColor)

  return (
    <div ref={pickerRef} className={cn('relative inline-block', className)}>
      {label && <label className="block text-sm font-medium text-[var(--ink)] mb-1">{label}</label>}

      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="w-full justify-between min-w-[120px]"
        style={{ backgroundColor: currentColor, borderColor: currentColor }}
      >
        <span className="truncate flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full border-2 border-[var(--ink)]/20 flex-shrink-0"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-body font-mono">{currentColor.toUpperCase()}</span>
        </span>
      </Button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-64 bg-white border-3 border-[var(--ink)] rounded-card shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-4 animate-scale-in"
          role="dialog"
          aria-label="Color picker"
        >
          {/* Current color preview */}
          <div className="mb-4">
            <div
              className="h-8 rounded-input border-2 border-[var(--ink)]/20"
              style={{ backgroundColor: currentColor }}
            />
            <input
              type="text"
              value={currentColor.toUpperCase()}
              onChange={handleInputChange}
              className="mt-2 w-full px-3 py-2 text-sm font-mono text-[var(--ink)] border-2 border-[var(--ink)] rounded-input focus:border-primary focus:shadow-input"
              placeholder="#RRGGBB"
              disabled={disabled}
            />
          </div>

          {/* Preset colors */}
          <div className="mb-4">
            <p className="text-xs font-medium text-[var(--ink)]/60 uppercase tracking-wider mb-2">Presets</p>
            <div className="grid grid-cols-7 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => !disabled && handlePresetClick(color)}
                  disabled={disabled}
                  className={cn(
                    'w-8 h-8 rounded-full border-3 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'hover:scale-110',
                    color === currentColor && 'scale-110 ring-2 ring-primary ring-offset-2',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                  aria-pressed={color === currentColor}
                />
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink)]/60 mb-1">Hue</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rgbToHsl(rgb[0], rgb[1], rgb[2]).h}
                onChange={(e) => {
                  const h = parseInt(e.target.value)
                  const { r, g, b } = hslToRgb(h, rgbToHsl(rgb[0], rgb[1], rgb[2]).s, rgbToHsl(rgb[0], rgb[1], rgb[2]).l)
                  const newColor = rgbToHex(r, g, b)
                  setCurrentColor(newColor)
                  onChange(newColor)
                }}
                className="w-full h-2 appearance-none bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 rounded-full"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink)]/60 mb-1">Saturation</label>
              <input
                type="range"
                min="0"
                max="100"
                value={rgbToHsl(rgb[0], rgb[1], rgb[2]).s}
                onChange={(e) => {
                  const s = parseInt(e.target.value)
                  const { r, g, b } = hslToRgb(rgbToHsl(rgb[0], rgb[1], rgb[2]).h, s, rgbToHsl(rgb[0], rgb[1], rgb[2]).l)
                  const newColor = rgbToHex(r, g, b)
                  setCurrentColor(newColor)
                  onChange(newColor)
                }}
                className="w-full h-2 appearance-none bg-gradient-to-r from-gray-400 to-primary rounded-full"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink)]/60 mb-1">Lightness</label>
              <input
                type="range"
                min="0"
                max="100"
                value={rgbToHsl(rgb[0], rgb[1], rgb[2]).l}
                onChange={(e) => {
                  const l = parseInt(e.target.value)
                  const { r, g, b } = hslToRgb(rgbToHsl(rgb[0], rgb[1], rgb[2]).h, rgbToHsl(rgb[0], rgb[1], rgb[2]).s, l)
                  const newColor = rgbToHex(r, g, b)
                  setCurrentColor(newColor)
                  onChange(newColor)
                }}
                className="w-full h-2 appearance-none bg-gradient-to-r from-black to-white rounded-full"
                disabled={disabled}
              />
            </div>

            {showAlpha && (
              <div>
                <label className="block text-xs font-medium text-[var(--ink)]/60 mb-1">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentColor.length === 9 ? parseInt(currentColor.slice(7), 16) / 255 : 1}
                  onChange={handleAlphaChange}
                  className="w-full h-2 appearance-none bg-gradient-to-r from-transparent to-primary rounded-full"
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Color conversion helpers
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}