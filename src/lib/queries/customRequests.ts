import { queryOptions } from '@tanstack/react-query'
import type { CustomRequestFilterInput } from '@/lib/validations/custom-request'

export const customRequestKeys = {
  all: ['customRequests'] as const,
  lists: () => [...customRequestKeys.all, 'list'] as const,
  list: (filters: CustomRequestFilterInput) => [...customRequestKeys.lists(), filters] as const,
  details: () => [...customRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...customRequestKeys.details(), id] as const,
  userRequests: (userId: string) => [...customRequestKeys.all, 'user', userId] as const,
  stats: () => [...customRequestKeys.all, 'stats'] as const,
}

export const customRequestListOptions = (filters: CustomRequestFilterInput) =>
  queryOptions({
    queryKey: customRequestKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const res = await fetch(`/api/custom-requests?${params}`)
      if (!res.ok) throw new Error('Failed to fetch custom requests')
      return res.json()
    },
    staleTime: 1000 * 60 * 2,
  })

export const customRequestDetailOptions = (id: string) =>
  queryOptions({
    queryKey: customRequestKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/custom-requests/${id}`)
      if (!res.ok) throw new Error('Failed to fetch custom request')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

export const userCustomRequestsOptions = (userId: string, filters: Partial<CustomRequestFilterInput> = {}) =>
  queryOptions({
    queryKey: [...customRequestKeys.userRequests(userId), filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('userId', userId)
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const res = await fetch(`/api/custom-requests?${params}`)
      if (!res.ok) throw new Error('Failed to fetch user custom requests')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

export const customRequestStatsOptions = () =>
  queryOptions({
    queryKey: customRequestKeys.stats(),
    queryFn: async () => {
      const res = await fetch('/api/custom-requests/stats')
      if (!res.ok) throw new Error('Failed to fetch custom request stats')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })