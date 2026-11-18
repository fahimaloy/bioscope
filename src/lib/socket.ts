'use client'

import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState, useCallback } from 'react'

let socket: Socket | null = null

export const getSocket = (): Socket<SocketEvents> | null => socket

export const initializeSocket = (token: string): Socket<SocketEvents> => {
  if (socket?.connected) {
    socket.auth = { token }
    return socket
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
  }) as Socket<SocketEvents>

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error.message)
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔌 Socket reconnected after', attemptNumber, 'attempts')
  })

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔌 Socket reconnection attempt:', attemptNumber)
  })

  socket.on('reconnect_error', (error) => {
    console.error('🔌 Socket reconnection error:', error.message)
  })

  socket.on('reconnect_failed', () => {
    console.error('🔌 Socket reconnection failed')
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export interface SocketEvents {
  'order:created': (data: { orderId: string; orderNumber: string; customerName: string; total: number; itemCount: number; createdAt: string }) => void
  'order:status_changed': (data: { orderId: string; orderNumber: string; oldStatus: string; newStatus: string; statusLabel: string; customerName?: string; updatedAt: string }) => void
  'custom_request:submitted': (data: { requestId: string; customerName: string; imageUrl: string; dimensions: string; quantity: number; material: string; finish: string; cutType: string; createdAt: string }) => void
  'custom_request:priced': (data: { requestId: string; quotedPrice: number; adminNotes?: string; quotedAt: string }) => void
  'notification:new': (data: { id: string; type: string; title: string; message: string; data?: Record<string, unknown>; createdAt: string }) => void
  'product:low_stock': (data: { productId: string; productName: string; currentStock: number; threshold: number }) => void
}

export function useSocket() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (session?.user) {
      let cancelled = false
      // The socket server verifies its own short-lived JWT (see /api/socket/token);
      // the NextAuth session never carries an access token.
      fetch('/api/socket/token', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('token fetch failed'))))
        .then(({ token }: { token: string }) => {
          if (cancelled || !token) return
          const s = initializeSocket(token)
          socketRef.current = s
          s.on('connect', () => setIsConnected(true))
          s.on('disconnect', () => setIsConnected(false))
        })
        .catch(() => setIsConnected(false))

      return () => {
        cancelled = true
        socketRef.current?.off('connect')
        socketRef.current?.off('disconnect')
      }
    } else {
      disconnectSocket()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [session?.user])

  // With the socket bound to SocketEvents, user-event listeners are exactly
  // SocketEvents[K]; generic K cannot flow through Emitter's own generics
  // (TS#33014), so the correlation is erased at this one boundary.
  type TypedEmitter = {
    on: <Ev extends keyof SocketEvents>(ev: Ev, fn: SocketEvents[Ev]) => unknown
    off: <Ev extends keyof SocketEvents>(ev?: Ev, fn?: SocketEvents[Ev]) => unknown
  }
  const on = useCallback(<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) => {
    const socket = socketRef.current as TypedEmitter | null
    if (!socket) return () => undefined
    socket.on(event, handler)
    return () => {
      socket.off(event, handler)
    }
  }, [])

  const off = useCallback(<K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]) => {
    if (!handler) return
    ;(socketRef.current as TypedEmitter | null)?.off(event, handler)
  }, [])

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  const subscribeToOrder = useCallback((orderId: string) => {
    socketRef.current?.emit('order:subscribe', orderId)
  }, [])

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    socketRef.current?.emit('order:unsubscribe', orderId)
  }, [])

  const markNotificationRead = useCallback((notificationId: string) => {
    socketRef.current?.emit('notification:mark_read', notificationId)
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    socketRef.current?.emit('notification:mark_all_read')
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    on,
    off,
    emit,
    subscribeToOrder,
    unsubscribeFromOrder,
    markNotificationRead,
    markAllNotificationsRead,
  }
}

export function useOrderSocket(orderId: string | null) {
  const { subscribeToOrder, unsubscribeFromOrder, on } = useSocket()

  useEffect(() => {
    if (orderId) {
      subscribeToOrder(orderId)
      return () => unsubscribeFromOrder(orderId)
    }
  }, [orderId, subscribeToOrder, unsubscribeFromOrder])

  const onStatusChange = useCallback(
    (handler: SocketEvents['order:status_changed']) => on('order:status_changed', handler),
    [on]
  )

  return { onStatusChange }
}