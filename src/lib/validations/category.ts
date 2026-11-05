import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  description: z.string().max(500).optional(),
  image: z.string().url().nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export const createCategorySchema = categorySchema
export const updateCategorySchema = categorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
