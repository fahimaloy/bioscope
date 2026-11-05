'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { StickerDesign, DesignLayer, MaterialType, FinishType, CutType, FabricImage, ImageFilter } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface StickerBuilderState {
  design: StickerDesign
  history: StickerDesign[]
  historyIndex: number
  selectedLayerId: string | null
  canvasRef: HTMLCanvasElement | null
  fabricCanvas: any | null // fabric.Canvas
  zoom: number

  // Actions
  setCanvasRef: (ref: HTMLCanvasElement | null) => void
  setZoom: (z: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setFabricCanvas: (canvas: any) => void

  // Background
  setBackground: (image: FabricImage | null) => void
  updateBackgroundFilter: (filter: Partial<ImageFilter>) => void

  // Layers
  addLayer: (layer: Omit<DesignLayer, 'id' | 'zIndex'>) => string
  updateLayer: (id: string, updates: Partial<DesignLayer>) => void
  removeLayer: (id: string) => void
  duplicateLayer: (id: string) => void
  reorderLayer: (id: string, newIndex: number) => void
  selectLayer: (id: string | null) => void
  toggleLayerVisibility: (id: string) => void
  toggleLayerLock: (id: string) => void

  // Canvas settings
  setCanvasSize: (width: number, height: number, dpi?: number) => void

  // Material/Finish/Cut
  setMaterial: (material: MaterialType) => void
  setFinish: (finish: FinishType) => void
  setCutType: (cutType: CutType) => void

  // History
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  saveToHistory: () => void

  // Export
  exportDesign: () => StickerDesign
  importDesign: (design: StickerDesign) => void
  reset: () => void
}

const initialDesign: StickerDesign = {
  background: null,
  layers: [],
  canvas: { width: 10, height: 10, dpi: 300 },
  material: 'vinyl',
  finish: 'matte',
  cutType: 'kiss_cut',
}

export const useStickerBuilderStore = create<StickerBuilderState>()(
  immer((set, get) => ({
    design: initialDesign,
    history: [initialDesign],
    historyIndex: 0,
    selectedLayerId: null,
    canvasRef: null,
    fabricCanvas: null,
    zoom: 1,

    setCanvasRef: (ref) => set({ canvasRef: ref }),
    setZoom: (z) => set({ zoom: Math.min(4, Math.max(0.25, z)) }),
    zoomIn: () => {
      const z = Math.min(4, get().zoom * 1.25)
      const c = get().fabricCanvas
      if (c) { c.setZoom(z); c.renderAll() }
      set({ zoom: z })
    },
    zoomOut: () => {
      const z = Math.max(0.25, get().zoom / 1.25)
      const c = get().fabricCanvas
      if (c) { c.setZoom(z); c.renderAll() }
      set({ zoom: z })
    },
    resetZoom: () => {
      const c = get().fabricCanvas
      if (c) { c.setZoom(1); c.renderAll() }
      set({ zoom: 1 })
    },
    setFabricCanvas: (canvas) => set({ fabricCanvas: canvas }),

    setBackground: (image) =>
      set((state) => {
        state.design.background = image
        state.saveToHistory()
      }),

    updateBackgroundFilter: (filter) =>
      set((state) => {
        if (state.design.background) {
          state.design.background = {
            ...state.design.background,
            // Filter would be applied to the fabric object
          }
        }
        state.saveToHistory()
      }),

    addLayer: (layer) => {
      const id = uuidv4()
      const zIndex = get().design.layers.length
      const newLayer: DesignLayer = { ...layer, id, zIndex, visible: true, locked: false }

      set((state) => {
        state.design.layers.push(newLayer)
        state.selectedLayerId = id
        state.saveToHistory()
      })

      return id
    },

    updateLayer: (id, updates) =>
      set((state) => {
        const layerIndex = state.design.layers.findIndex((l) => l.id === id)
        if (layerIndex >= 0) {
          state.design.layers[layerIndex] = { ...state.design.layers[layerIndex], ...updates }
          state.saveToHistory()
        }
      }),

    removeLayer: (id) =>
      set((state) => {
        state.design.layers = state.design.layers.filter((l) => l.id !== id)
        // Re-index zIndex
        state.design.layers.forEach((l, i) => { l.zIndex = i })
        if (state.selectedLayerId === id) {
          state.selectedLayerId = null
        }
        state.saveToHistory()
      }),

    duplicateLayer: (id) =>
      set((state) => {
        const layer = state.design.layers.find((l) => l.id === id)
        if (layer) {
          const newLayer: DesignLayer = {
            ...layer,
            id: uuidv4(),
            zIndex: state.design.layers.length,
            x: layer.x + 10,
            y: layer.y + 10,
          }
          state.design.layers.push(newLayer)
          state.selectedLayerId = newLayer.id
          state.saveToHistory()
        }
      }),

    reorderLayer: (id, newIndex) =>
      set((state) => {
        const currentIndex = state.design.layers.findIndex((l) => l.id === id)
        if (currentIndex >= 0 && currentIndex !== newIndex) {
          const [layer] = state.design.layers.splice(currentIndex, 1)
          state.design.layers.splice(newIndex, 0, layer)
          // Re-index zIndex
          state.design.layers.forEach((l, i) => { l.zIndex = i })
          state.saveToHistory()
        }
      }),

    selectLayer: (id) => set((state) => { state.selectedLayerId = id }),

    toggleLayerVisibility: (id) =>
      set((state) => {
        const layer = state.design.layers.find((l) => l.id === id)
        if (layer) {
          layer.visible = !layer.visible
          state.saveToHistory()
        }
      }),

    toggleLayerLock: (id) =>
      set((state) => {
        const layer = state.design.layers.find((l) => l.id === id)
        if (layer) {
          layer.locked = !layer.locked
          state.saveToHistory()
        }
      }),

    setCanvasSize: (width, height, dpi = 300) =>
      set((state) => {
        state.design.canvas = { width, height, dpi }
        state.saveToHistory()
      }),

    setMaterial: (material) =>
      set((state) => {
        state.design.material = material
        state.saveToHistory()
      }),

    setFinish: (finish) =>
      set((state) => {
        state.design.finish = finish
        state.saveToHistory()
      }),

    setCutType: (cutType) =>
      set((state) => {
        state.design.cutType = cutType
        state.saveToHistory()
      }),

    get canUndo() {
      return get().historyIndex > 0
    },

    get canRedo() {
      return get().historyIndex < get().history.length - 1
    },

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--
          state.design = JSON.parse(JSON.stringify(state.history[state.historyIndex]))
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++
          state.design = JSON.parse(JSON.stringify(state.history[state.historyIndex]))
        }
      }),

    saveToHistory: () =>
      set((state) => {
        // Remove future history if we're not at the end
        state.history = state.history.slice(0, state.historyIndex + 1)
        // Add current state
        state.history.push(JSON.parse(JSON.stringify(state.design)))
        state.historyIndex = state.history.length - 1
        // Limit history size
        if (state.history.length > 50) {
          state.history.shift()
          state.historyIndex--
        }
      }),

    exportDesign: () => get().design,

    importDesign: (design) =>
      set((state) => {
        state.design = design
        state.history = [design]
        state.historyIndex = 0
        state.selectedLayerId = null
      }),

    reset: () =>
      set((state) => {
        state.design = initialDesign
        state.history = [initialDesign]
        state.historyIndex = 0
        state.selectedLayerId = null
      }),
  }))
)

// Selectors
export const useStickerDesign = () => useStickerBuilderStore((state) => state.design)
export const useStickerLayers = () => useStickerBuilderStore((state) => state.design.layers)
export const useSelectedLayer = () => useStickerBuilderStore((state) => {
  const layer = state.design.layers.find((l) => l.id === state.selectedLayerId)
  return layer || null
})
export const useStickerBackground = () => useStickerBuilderStore((state) => state.design.background)
export const useStickerCanvas = () => useStickerBuilderStore((state) => state.design.canvas)
export const useStickerMaterial = () => useStickerBuilderStore((state) => state.design.material)
export const useStickerFinish = () => useStickerBuilderStore((state) => state.design.finish)
export const useStickerCutType = () => useStickerBuilderStore((state) => state.design.cutType)

export const useStickerBuilderActions = () =>
  useStickerBuilderStore((state) => ({
    setCanvasRef: state.setCanvasRef,
    setFabricCanvas: state.setFabricCanvas,
    setBackground: state.setBackground,
    updateBackgroundFilter: state.updateBackgroundFilter,
    addLayer: state.addLayer,
    updateLayer: state.updateLayer,
    removeLayer: state.removeLayer,
    duplicateLayer: state.duplicateLayer,
    reorderLayer: state.reorderLayer,
    selectLayer: state.selectLayer,
    toggleLayerVisibility: state.toggleLayerVisibility,
    toggleLayerLock: state.toggleLayerLock,
    setCanvasSize: state.setCanvasSize,
    setMaterial: state.setMaterial,
    setFinish: state.setFinish,
    setCutType: state.setCutType,
    undo: state.undo,
    redo: state.redo,
    exportDesign: state.exportDesign,
    importDesign: state.importDesign,
    reset: state.reset,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
      zoom: state.zoom,
    setZoom: state.setZoom,
    zoomIn: state.zoomIn,
    zoomOut: state.zoomOut,
    resetZoom: state.resetZoom,
  }))