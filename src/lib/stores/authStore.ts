'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionUser } from '@/types'

interface AuthState {
  user: SessionUser | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: SessionUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  updateUser: (data: Partial<SessionUser>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'sticker-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Selectors
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthActions = () =>
  useAuthStore((state) => ({
    setUser: state.setUser,
    setLoading: state.setLoading,
    logout: state.logout,
    updateUser: state.updateUser,
  }))

// Role checks
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN')
export const useIsCustomer = () => useAuthStore((state) => state.user?.role === 'CUSTOMER')