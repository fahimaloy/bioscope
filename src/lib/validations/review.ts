import { z } from 'zod'

export const createReviewSchema = z.object({
  productId: z.string().min(1, { message: 'Product is required' }),
  rating: z.number().int().min(1, { message: 'Rating must be at least 1' }).max(5, { message: 'Rating must be at most 5' }),
  title: z.string().max(100, { message: 'Title must be at most 100 characters' }).optional(),
  comment: z.string().max(2000, { message: 'Comment must be at most 2000 characters' }).optional(),
  images: z.array(z.string().url({ message: 'Invalid image URL' })).max(5, { message: 'Maximum 5 images allowed' }).default([]),
})

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1, { message: 'Rating must be at least 1' }).max(5, { message: 'Rating must be at most 5' }).optional(),
  title: z.string().max(100, { message: 'Title must be at most 100 characters' }).nullish(),
  comment: z.string().max(2000, { message: 'Comment must be at most 2000 characters' }).nullish(),
  images: z.array(z.string().url({ message: 'Invalid image URL' })).max(5, { message: 'Maximum 5 images allowed' }).optional(),
  isApproved: z.boolean().optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
