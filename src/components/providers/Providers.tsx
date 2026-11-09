'use client'

import { QueryProvider } from './QueryProvider'
import { SocketProvider } from './SocketProvider'
import { AuthProvider } from './AuthProvider'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <SocketProvider>{children}</SocketProvider>
      </QueryProvider>
    </AuthProvider>
  )
}