import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customRequestKeys } from '@/lib/queries/customRequests'
import type { UpdateCustomRequestStatusInput, PriceCustomRequestInput, SubmitCustomRequestInput } from '@/lib/validations/custom-request'

export function useSubmitCustomRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SubmitCustomRequestInput) => {
      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to submit custom request')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customRequestKeys.stats() })
    },
  })
}

export function useUpdateCustomRequestStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomRequestStatusInput }) => {
      const res = await fetch(`/api/custom-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update custom request status')
      return res.json()
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: customRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customRequestKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: customRequestKeys.stats() })
    },
  })
}

export function usePriceCustomRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PriceCustomRequestInput }) => {
      const res = await fetch(`/api/custom-requests/${id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to price custom request')
      return res.json()
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: customRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customRequestKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: customRequestKeys.stats() })
    },
  })
}

export function useDeleteCustomRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/custom-requests/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete custom request')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customRequestKeys.stats() })
    },
  })
}