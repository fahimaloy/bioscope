'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapsed: () => void

  // Modals
  modals: Record<string, boolean>
  openModal: (key: string) => void
  closeModal: (key: string) => void
  closeAllModals: () => void

  // Mobile menu
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void

  // Search
  searchOpen: boolean
  toggleSearch: () => void
  setSearchOpen: (open: boolean) => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Loading states
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void

  // Page transitions
  pageTransitioning: boolean
  setPageTransitioning: (transitioning: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Modals
      modals: {},
      openModal: (key) => set((state) => ({ modals: { ...state.modals, [key]: true } })),
      closeModal: (key) =>
        set((state) => {
          const modals = { ...state.modals }
          delete modals[key]
          return { modals }
        }),
      closeAllModals: () => set({ modals: {} }),

      // Mobile menu
      mobileMenuOpen: false,
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      // Search
      searchOpen: false,
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
      setSearchOpen: (open) => set({ searchOpen: open }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Loading
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // Page transitions
      pageTransitioning: false,
      setPageTransitioning: (transitioning) => set({ pageTransitioning: transitioning }),
    }),
    {
      name: 'sticker-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
)

// Selectors
export const useSidebar = () =>
  useUIStore((state) => ({
    open: state.sidebarOpen,
    collapsed: state.sidebarCollapsed,
    toggle: state.toggleSidebar,
    setOpen: state.setSidebarOpen,
    toggleCollapsed: state.toggleSidebarCollapsed,
  }))

export const useModals = () =>
  useUIStore((state) => ({
    modals: state.modals,
    openModal: state.openModal,
    closeModal: state.closeModal,
    closeAllModals: state.closeAllModals,
    isOpen: (key: string) => state.modals[key] === true,
  }))

export const useMobileMenu = () =>
  useUIStore((state) => ({
    open: state.mobileMenuOpen,
    toggle: state.toggleMobileMenu,
    setOpen: state.setMobileMenuOpen,
  }))

export const useSearch = () =>
  useUIStore((state) => ({
    open: state.searchOpen,
    toggle: state.toggleSearch,
    setOpen: state.setSearchOpen,
  }))

export const useTheme = () =>
  useUIStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }))

export const useGlobalLoading = () =>
  useUIStore((state) => ({
    loading: state.globalLoading,
    setLoading: state.setGlobalLoading,
  }))

export const usePageTransition = () =>
  useUIStore((state) => ({
    transitioning: state.pageTransitioning,
    setTransitioning: state.setPageTransitioning,
  }))