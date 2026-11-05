'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { DesignLayer } from '@/types'
import {
  Eye, EyeOff, Lock, Unlock, Copy, Trash2, ChevronUp, ChevronDown,
  GripVertical, Image as ImageIcon, Type, Square, Layers,
  Plus, Minus, MoreVertical,
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
  onSelectLayer,
  onReorderLayer,
  onToggleVisibility,
  onToggleLock,
  onDuplicateLayer,
  onDeleteLayer,
  onAddLayer,
  className,
}: LayerPanelProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={cn('bg-white rounded-card border-3 border-[var(--ink)] shadow-card flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--light)]">
        <h3 className="font-display text-lg text-primary">Layers</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onAddLayer('image')} aria-label="Add image layer">
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAddLayer('text')} aria-label="Add text layer">
            <Type className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAddLayer('shape')} aria-label="Add shape layer">
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Layer List */}
      <div className={cn('flex-1 overflow-y-auto', expanded ? '' : 'hidden')}>
        {layers.length === 0 ? (
          <div className="p-8 text-center text-[var(--ink)]/50">
            <Layers className="w-12 h-12 mx-auto mb-3 text-[var(--ink)]/20" />
            <p className="text-body">No layers yet</p>
            <p className="text-sm text-[var(--ink)]/40 mt-1">Click + to add your first layer</p>
          </div>
        ) : (
          <ul className="divide-y divide-light/50" role="list" aria-label="Layers">
            {layers.slice().reverse().map((layer, reverseIndex) => {
              const index = layers.length - 1 - reverseIndex
              const isSelected = selectedLayerId === layer.id

              return (
                <li
                  key={layer.id}
                  className={cn(
                    'flex items-center gap-2 p-3 transition-colors',
                    isSelected && 'bg-primary/5',
                    !layer.visible && 'opacity-50',
                    layer.locked && 'opacity-70'
                  )}
                >
                  {/* Drag Handle */}
                  <button
                    className="p-1 text-[var(--ink)]/30 hover:text-primary transition-colors"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  {/* Layer Type Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-input flex items-center justify-center flex-shrink-0',
                    layer.type === 'image' && 'bg-primary/10',
                    layer.type === 'text' && 'bg-secondary/10',
                    layer.type === 'shape' && 'bg-accent/10'
                  )}>
                    {layer.type === 'image' && <ImageIcon className="w-4 h-4 text-primary" />}
                    {layer.type === 'text' && <Type className="w-4 h-4 text-secondary" />}
                    {layer.type === 'shape' && <Square className="w-4 h-4 text-accent" />}
                  </div>

                  {/* Layer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium text-sm truncate',
                        isSelected ? 'text-[var(--ink)]' : 'text-[var(--ink)]/70'
                      )}>
                        {layer.type === 'text' ? (layer.text?.substring(0, 20) || 'Text') : layer.type}
                      </span>
                      {layer.locked && <Lock className="w-3 h-3 text-[var(--ink)]/40" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--ink)]/50">
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
                      layer.visible ? 'text-[var(--ink)]' : 'text-[var(--ink)]/30'
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
                      layer.locked ? 'text-primary' : 'text-[var(--ink)]/30'
                    )}
                    aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button className="p-1 text-[var(--ink)]/30 hover:text-primary transition-colors" aria-label="More options">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <LayerActionsMenu
                      layerId={layer.id}
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
        <div className="h-4 border-t-2 border-dashed border-primary/50 -mx-4 mt-2" />
      </div>

      {/* Collapsed View */}
      {!expanded && (
        <div className="p-4 border-t border-[var(--light)] text-center text-[var(--ink)]/50">
          <button
            onClick={() => setExpanded(true)}
            className="text-primary hover:underline text-sm"
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
  layerId,
  onDuplicate,
  onDelete,
}: { layerId: string; onDuplicate: () => void; onDelete: () => void }) {
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
        className="p-1 text-[var(--ink)]/30 hover:text-primary transition-colors"
        aria-label="Layer actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-40 bg-white border-3 border-[var(--ink)] rounded-input shadow-lg animate-scale-in z-50"
          role="menu"
        >
          <button
            onClick={() => { onDuplicate(); setOpen(false) }}
            className="w-full px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[var(--light)] flex items-center gap-2"
            role="menuitem"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
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