import { queryOptions } from '@tanstack/react-query'
import type { OrderFilterInput } from '@/lib/validations/order'

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilterInput) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  byNumber: (orderNumber: string) => [...orderKeys.all, 'number', orderNumber] as const,
  userOrders: (userId: string) => [...orderKeys.all, 'user', userId] as const,
  stats: () => [...orderKeys.all, 'stats'] as const,
}

export const orderListOptions = (filters: OrderFilterInput) =>
  queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json()
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

export const orderDetailOptions = (id: string) =>
  queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`)
      if (!res.ok) throw new Error('Failed to fetch order')
      return res.json()
    },
    staleTime: 1000 * 60 * 2,
  })

export const orderByNumberOptions = (orderNumber: string) =>
  queryOptions({
    queryKey: orderKeys.byNumber(orderNumber),
    queryFn: async () => {
      const res = await fetch(`/api/orders/number/${orderNumber}`)
      if (!res.ok) throw new Error('Failed to fetch order')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

export const userOrdersOptions = (userId: string, filters: Partial<OrderFilterInput> = {}) =>
  queryOptions({
    queryKey: [...orderKeys.userOrders(userId), filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('userId', userId)
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch user orders')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

export const orderStatsOptions = () =>
  queryOptions({
    queryKey: orderKeys.stats(),
    queryFn: async () => {
      const res = await fetch('/api/orders/stats')
      if (!res.ok) throw new Error('Failed to fetch order stats')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })