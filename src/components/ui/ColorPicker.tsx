'use client';

import { forwardRef, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { FOCUS_VISIBLE, setRefs } from './shared';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
  presetColors?: string[];
  showAlpha?: boolean;
  className?: string;
}

/**
 * Presets are CSS custom properties, not hex literals (contract §1). The HSL
 * sliders need a real colour to work from, so `resolveHex` reads the computed
 * value of the token in the browser. Presets are resolved to hex at the output
 * boundary (`handlePresetClick`) because fabric.js cannot parse CSS custom
 * properties; a value that cannot be resolved falls back to black, matching
 * fabric's own `_tryParsingColor` fallback.
 */
const DEFAULT_PRESETS = [
  'var(--pink)',
  'var(--pink-strong)',
  'var(--violet)',
  'var(--orange)',
  'var(--gold)',
  'var(--green-strong)',
  'var(--blue)',
  'var(--red)',
  'var(--teal)',
  'var(--lime)',
  'var(--ink)',
  'var(--paper-raised)',
];

/** Resolves a hex literal or a single `var(--…)` token to a hex string. */
function resolveHex(color: string): string | null {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return color;
  const match = color.match(/^var\((--[a-z0-9-]+)\)$/);
  if (!match || typeof window === 'undefined') return null;
  const declared = window
    .getComputedStyle(window.document.documentElement)
    .getPropertyValue(match[1])
    .trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(declared) ? declared : null;
}

export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(function ColorPicker(
  {
    value,
    onChange,
    label,
    disabled = false,
    presetColors = DEFAULT_PRESETS,
    showAlpha = false,
    className,
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentColor(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (color: string) => {
    // fabric's `_tryParsingColor` cannot parse CSS custom properties: a
    // `var(--…)` value would render as opaque black. Resolve the token to a
    // hex string at the primitive's output boundary; the preset list itself
    // stays token-only (contract §1).
    const resolved = resolveHex(color) ?? color;
    setCurrentColor(resolved);
    onChange(resolved);
    setIsOpen(false);
  };

  /** True when a preset is the current colour, comparing resolved values. */
  const isPresetActive = (preset: string) =>
    preset === currentColor || resolveHex(preset) === currentColor;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCurrentColor(color);
    onChange(color);
  };

  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const alpha = Math.round(parseFloat(e.target.value) * 255)
      .toString(16)
      .padStart(2, '0');
    const hex = currentColor.startsWith('#') ? currentColor : `#${currentColor}`;
    const newColor = `${hex}${alpha}`;
    setCurrentColor(newColor);
    onChange(newColor);
  };

  const hex = resolveHex(currentColor);
  const rgb = hex ? hexToRgb(hex) : [0, 0, 0];
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  return (
    <div ref={setRefs(pickerRef, ref)} className={cn('relative inline-block', className)}>
      {label && <label className="mb-1 block text-sm font-medium text-[var(--ink)]">{label}</label>}

      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="w-full min-w-[120px] justify-between"
        style={{ backgroundColor: currentColor, borderColor: currentColor }}
      >
        <span className="flex items-center gap-2 truncate">
          <span
            className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-[var(--ink)]"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-body font-mono">{currentColor.toUpperCase()}</span>
        </span>
      </Button>

      {isOpen && (
        <div
          className="absolute z-popover mt-1 w-64 animate-scale-in rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] bg-[var(--surface-raised)] p-4 shadow-ink-3"
          role="dialog"
          aria-label="Color picker"
        >
          {/* Current color preview */}
          <div className="mb-4">
            <div
              className="h-8 rounded-[var(--radius-md)] border-2 border-[var(--ink)]"
              style={{ backgroundColor: currentColor }}
            />
            <input
              type="text"
              value={currentColor.toUpperCase()}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-[var(--radius-md)] border-2 border-[var(--ink)] bg-[var(--surface-raised)] px-3 py-2 font-mono text-sm text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="#RRGGBB"
              disabled={disabled}
              aria-label="Custom colour value"
            />
          </div>

          {/* Preset colors */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Presets
            </p>
            <div className="grid grid-cols-7 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => !disabled && handlePresetClick(color)}
                  disabled={disabled}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 border-[var(--ink)] transition-transform duration-fast ease-spring',
                    'hover:scale-110',
                    isPresetActive(color) &&
                      'scale-110 ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface-raised)]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    FOCUS_VISIBLE
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                  aria-pressed={isPresetActive(color)}
                />
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Hue</label>
              <input
                type="range"
                min="0"
                max="360"
                value={hsl.h}
                onChange={(e) => {
                  const h = parseInt(e.target.value);
                  const { r, g, b } = hslToRgb(h, hsl.s, hsl.l);
                  const newColor = rgbToHex(r, g, b);
                  setCurrentColor(newColor);
                  onChange(newColor);
                }}
                className="h-2 w-full appearance-none rounded-full bg-gradient-to-r from-[var(--red)] via-[var(--gold)] to-[var(--violet)]"
                disabled={disabled}
                aria-label="Hue"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                Saturation
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.s}
                onChange={(e) => {
                  const s = parseInt(e.target.value);
                  const { r, g, b } = hslToRgb(hsl.h, s, hsl.l);
                  const newColor = rgbToHex(r, g, b);
                  setCurrentColor(newColor);
                  onChange(newColor);
                }}
                className="h-2 w-full appearance-none rounded-full bg-gradient-to-r from-[var(--ink-muted)] to-[var(--pink)]"
                disabled={disabled}
                aria-label="Saturation"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                Lightness
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={hsl.l}
                onChange={(e) => {
                  const l = parseInt(e.target.value);
                  const { r, g, b } = hslToRgb(hsl.h, hsl.s, l);
                  const newColor = rgbToHex(r, g, b);
                  setCurrentColor(newColor);
                  onChange(newColor);
                }}
                className="h-2 w-full appearance-none rounded-full bg-gradient-to-r from-[var(--ink)] to-[var(--paper-raised)]"
                disabled={disabled}
                aria-label="Lightness"
              />
            </div>

            {showAlpha && (
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                  Opacity
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentColor.length === 9 ? parseInt(currentColor.slice(7), 16) / 255 : 1}
                  onChange={handleAlphaChange}
                  className="h-2 w-full appearance-none rounded-full bg-gradient-to-r from-transparent to-[var(--pink)]"
                  disabled={disabled}
                  aria-label="Opacity"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

// Color conversion helpers
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    return cleanHex.split('').map((c) => parseInt(c + c, 16)) as [number, number, number];
  }
  if (cleanHex.length === 6) {
    return cleanHex.match(/.{2}/g)!.map((c) => parseInt(c, 16)) as [number, number, number];
  }
  return [0, 0, 0];
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
