'use client'

import { useSession } from 'next-auth/react'
import { useAuthStore, useAuthActions, useIsAdmin, useIsCustomer } from '@/lib/stores/authStore'
import { useEffect } from 'react'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const { user, isLoading, setLoading, logout } = useAuthStore()
  const { setUser: setAuthUser } = useAuthActions()

  // Sync NextAuth session with Zustand store
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (session?.user) {
      setAuthUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name ?? null,
        role: session.user.role,
        image: session.user.image ?? null,
      })
    } else {
      setAuthUser(null)
    }
    setLoading(false)
  }, [session, status, setAuthUser, setLoading])

  const updateProfile = async (data: { name?: string; image?: string }) => {
    await update(data)
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    status,
    updateProfile,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
  }
}

// Re-export role hooks for convenience
export { useIsAdmin, useIsCustomer }