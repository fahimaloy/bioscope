'use client'

import { useEffect, useRef } from 'react'
import { useSocket, type SocketEvents } from '@/lib/socket'

/** SocketEvents maps an event name to its handler signature, so the payload is the first parameter. */
type Payload<K extends keyof SocketEvents> = Parameters<SocketEvents[K]>[0]

/** The events an admin panel can react to, tagged with a discriminated kind. */
export type AdminLiveEvent =
  | { kind: 'order.created'; data: Payload<'order:created'> }
  | { kind: 'order.status_changed'; data: Payload<'order:status_changed'> }
  | { kind: 'custom_request.submitted'; data: Payload<'custom_request:submitted'> }
  | { kind: 'custom_request.priced'; data: Payload<'custom_request:priced'> }
  | { kind: 'product:low_stock'; data: Payload<'product:low_stock'> }

/** Short labels for the live feed. */
export const ADMIN_EVENT_LABELS: Record<AdminLiveEvent['kind'], string> = {
  'order.created': 'New order',
  'order.status_changed': 'Order status',
  'custom_request.submitted': 'Custom request',
  'custom_request.priced': 'Request priced',
  'product:low_stock': 'Low stock',
}

/**
 * Subscribe to the events an admin panel cares about.
 *
 * The socket is a module-level singleton (src/lib/socket.ts), so every caller
 * shares one connection. The handler is read through a ref so a new callback
 * identity does not tear down and rebuild the subscription on each render.
 */
export function useAdminRealtime(handler: (event: AdminLiveEvent) => void) {
  const { on, isConnected } = useSocket()
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const unsubscribe = [
      on<'order:created'>('order:created', (data) => handlerRef.current({ kind: 'order.created', data })),
      on<'order:status_changed'>('order:status_changed', (data) => handlerRef.current({ kind: 'order.status_changed', data })),
      on<'custom_request:submitted'>('custom_request:submitted', (data) => handlerRef.current({ kind: 'custom_request.submitted', data })),
      on<'custom_request:priced'>('custom_request:priced', (data) => handlerRef.current({ kind: 'custom_request.priced', data })),
      on<'product:low_stock'>('product:low_stock', (data) => handlerRef.current({ kind: 'product:low_stock', data })),
    ]
    return () => unsubscribe.forEach((off) => off())
  }, [on])

  return { isConnected }
}
