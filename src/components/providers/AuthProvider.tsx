'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { useAuthActions } from '@/lib/stores/authStore'
import { useAuth } from '@/lib/hooks/useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  // This wraps SessionProvider and provides auth state
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// Client-side auth state initializer
export function AuthInitializer({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()
  useAuthActions()

  // The useAuth hook already handles syncing
  // This component exists for any additional initialization

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="text-center">
          <div className="staggered-title text-4xl mb-4" style={{ fontSize: '4rem' }}>
            <span>Loading...</span>
          </div>
          <div className="floating-emojis">
            <span className="emoji e1">🎨</span>
            <span className="emoji e2">✨</span>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}