import { queryOptions } from '@tanstack/react-query'

export const settingsKeys = {
  all: ['settings'] as const,
  lists: () => [...settingsKeys.all, 'list'] as const,
  list: (category: string) => [...settingsKeys.lists(), category] as const,
  public: () => [...settingsKeys.all, 'public'] as const,
  byKey: (key: string) => [...settingsKeys.all, 'key', key] as const,
}

export const settingsListOptions = (category: string) =>
  queryOptions({
    queryKey: settingsKeys.list(category),
    queryFn: async () => {
      const res = await fetch(`/api/settings?category=${category}`)
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })

export const publicSettingsOptions = () =>
  queryOptions({
    queryKey: settingsKeys.public(),
    queryFn: async () => {
      const res = await fetch('/api/settings/public')
      if (!res.ok) throw new Error('Failed to fetch public settings')
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })

export const settingByKeyOptions = (key: string) =>
  queryOptions({
    queryKey: settingsKeys.byKey(key),
    queryFn: async () => {
      const res = await fetch(`/api/settings/${key}`)
      if (!res.ok) throw new Error('Failed to fetch setting')
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })