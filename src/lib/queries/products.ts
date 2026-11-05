import { queryOptions } from '@tanstack/react-query'
import type { ProductFilterInput } from '@/lib/validations/product'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilterInput) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  related: (productId: string) => [...productKeys.all, 'related', productId] as const,
}

export const productListOptions = (filters: ProductFilterInput) =>
  queryOptions({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

export const productDetailOptions = (slug: string) =>
  queryOptions({
    queryKey: productKeys.detail(slug),
    queryFn: async () => {
      const res = await fetch(`/api/products/${slug}`)
      if (!res.ok) throw new Error('Failed to fetch product')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

export const featuredProductsOptions = () =>
  queryOptions({
    queryKey: productKeys.featured(),
    queryFn: async () => {
      const res = await fetch('/api/products?featured=true&limit=8')
      if (!res.ok) throw new Error('Failed to fetch featured products')
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })

export const relatedProductsOptions = (productId: string) =>
  queryOptions({
    queryKey: productKeys.related(productId),
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/related`)
      if (!res.ok) throw new Error('Failed to fetch related products')
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })