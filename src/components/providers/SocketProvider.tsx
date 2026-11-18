'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotificationStore } from '@/lib/stores/notificationStore'

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  useNotificationStore()

  useEffect(() => {
    if (!isLoading && user) {
      // Socket will be initialized by useSocket hook when needed
      // This provider just ensures session is available
    }
  }, [user, isLoading])

  return <>{children}</>
}

// Separate provider for socket event handling
export function SocketEventProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  useNotificationStore()

  useEffect(() => {
    if (isLoading || !user) return

    // Socket connection will be managed by useSocket hook

    return () => {
      // Cleanup handled by useSocket
    }
  }, [user, isLoading])

  return <>{children}</>
}