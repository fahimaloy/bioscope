import { useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsKeys } from '@/lib/queries/settings'

export function useUpdateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { key: string; value: string; type: string; category: string; description?: string }) => {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update setting')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.public() })
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const res = await fetch('/api/settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to update settings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.public() })
    },
  })
}