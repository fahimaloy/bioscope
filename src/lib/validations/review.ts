import { z } from 'zod'

export const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  title: z.string().max(100).optional(),
  comment: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
})

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(100).nullish(),
  comment: z.string().max(2000).nullish(),
  images: z.array(z.string().url()).max(5).optional(),
  isApproved: z.boolean().optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
