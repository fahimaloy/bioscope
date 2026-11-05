'use client'

import { QueryProvider } from './QueryProvider'
import { SocketProvider } from './SocketProvider'
import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <SocketProvider>{children}</SocketProvider>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}