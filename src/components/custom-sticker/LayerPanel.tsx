'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { DesignLayer } from '@/types'
import {
  Eye, EyeOff, Lock, Unlock, Copy, Trash2,
  GripVertical, Image as ImageIcon, Type, Square, Layers,
  MoreVertical,
} from 'lucide-react'

interface LayerPanelProps {
  layers: DesignLayer[]
  selectedLayerId: string | null
  onSelectLayer: (id: string | null) => void
  onReorderLayer: (id: string, newIndex: number) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onDuplicateLayer: (id: string) => void
  onDeleteLayer: (id: string) => void
  onAddLayer: (type: 'image' | 'text' | 'shape') => void
  className?: string
}

export function LayerPanel({
  layers,
  selectedLayerId,
  onSelectLayer: _onSelectLayer,
  onReorderLayer: _onReorderLayer,
  onToggleVisibility,
  onToggleLock,
  onDuplicateLayer,
  onDeleteLayer,
  onAddLayer,
  className,
}: LayerPanelProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={cn('bg-[var(--surface-raised)] rounded-[var(--radius-lg)] border-[3px] border-[var(--ink)] shadow-[var(--shadow-ink-3)] flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
        <h3 className="font-display text-lg text-[var(--brand)]">Layers</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onAddLayer('image')} aria-label="Add image layer" data-testid="add-image-layer">
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAddLayer('text')} aria-label="Add text layer" data-testid="add-text-layer">
            <Type className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAddLayer('shape')} aria-label="Add shape layer" data-testid="add-shape-layer">
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Layer List */}
      <div className={cn('flex-1 overflow-y-auto', expanded ? '' : 'hidden')}>
        {layers.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-subtle)]">
            <Layers className="w-12 h-12 mx-auto mb-3 text-[var(--text-subtle)]" />
            <p className="text-[var(--text)]">No layers yet</p>
            <p className="text-sm text-[var(--text-subtle)] mt-1">Click + to add your first layer</p>
          </div>
        ) : (
          <ul className="divide-y divide-[color-mix(in_srgb,var(--ink)_15%,transparent)]" role="list" aria-label="Layers">
            {layers.slice().reverse().map((layer, _reverseIndex) => {
              const isSelected = selectedLayerId === layer.id

              return (
                <li
                  key={layer.id}
                  className={cn(
                    'flex items-center gap-2 p-3 transition-colors',
                    isSelected && 'bg-[color-mix(in_srgb,var(--brand)_5%,transparent)]',
                    !layer.visible && 'opacity-50',
                    layer.locked && 'opacity-70'
                  )}
                >
                  {/* Drag Handle */}
                  <button
                    className="p-1 text-[var(--text-subtle)] hover:text-[var(--brand)] transition-colors"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  {/* Layer Type Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0',
                    layer.type === 'image' && 'bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]',
                    layer.type === 'text' && 'bg-[color-mix(in_srgb,var(--teal)_10%,transparent)]',
                    layer.type === 'shape' && 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]'
                  )}>
                    {layer.type === 'image' && <ImageIcon className="w-4 h-4 text-[var(--brand)]" />}
                    {layer.type === 'text' && <Type className="w-4 h-4 text-[var(--text-muted)]" />}
                    {layer.type === 'shape' && <Square className="w-4 h-4 text-[var(--brand)]" />}
                  </div>

                  {/* Layer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium text-sm truncate',
                        isSelected ? 'text-[var(--ink)]' : 'text-[color-mix(in_srgb,var(--ink)_70%,transparent)]'
                      )}>
                        {layer.type === 'text' ? (layer.text?.substring(0, 20) || 'Text') : layer.type}
                      </span>
                      {layer.locked && <Lock className="w-3 h-3 text-[var(--text-subtle)]" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
                      <span>z: {layer.zIndex}</span>
                      <span>•</span>
                      <span>Opacity: {Math.round((layer.opacity ?? 1) * 100)}%</span>
                    </div>
                  </div>

                  {/* Visibility Toggle */}
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      layer.visible ? 'text-[var(--ink)]' : 'text-[var(--text-subtle)]'
                    )}
                    aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={() => onToggleLock(layer.id)}
                    className={cn(
                      'p-1 rounded transition-colors',
                      layer.locked ? 'text-[var(--brand)]' : 'text-[var(--text-subtle)]'
                    )}
                    aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button className="p-1 text-[var(--text-subtle)] hover:text-[var(--brand)] transition-colors" aria-label="More options">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <LayerActionsMenu
                      _layerId={layer.id}
                      onDuplicate={() => onDuplicateLayer(layer.id)}
                      onDelete={() => onDeleteLayer(layer.id)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Drop Zone for Reordering */}
        <div className="h-4 border-t-2 border-dashed border-[color-mix(in_srgb,var(--brand)_50%,transparent)] -mx-4 mt-2" />
      </div>

      {/* Collapsed View */}
      {!expanded && (
        <div className="p-4 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)] text-center text-[var(--text-subtle)]">
          <button
            onClick={() => setExpanded(true)}
            className="text-[var(--brand)] hover:underline text-sm"
          >
            Show {layers.length} layer{layers.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}

// Layer Actions Menu
function LayerActionsMenu({
  _layerId,
  onDuplicate,
  onDelete,
}: { _layerId: string; onDuplicate: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1 text-[var(--text-subtle)] hover:text-[var(--brand)] transition-colors"
        aria-label="Layer actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-40 bg-[var(--surface-raised)] border-[3px] border-[var(--ink)] rounded-[var(--radius-md)] shadow-[var(--shadow-ink-2)] animate-scale-in z-50"
          role="menu"
        >
          <button
            onClick={() => { onDuplicate(); setOpen(false) }}
            className="w-full px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[var(--paper-deep)] flex items-center gap-2"
            role="menuitem"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="w-full px-3 py-2 text-left text-sm text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)] flex items-center gap-2"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </>
  )
}

// Need to import useState, useRef
import { useState, useRef } from 'react'