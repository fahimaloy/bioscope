import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(50, { message: 'Name must be at most 50 characters' }),
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters' }).max(60, { message: 'Slug must be at most 60 characters' }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug must be lowercase kebab-case (e.g., my-category)' }),
  description: z.string().max(500, { message: 'Description must be at most 500 characters' }).optional(),
  image: z.string().url({ message: 'Please enter a valid image URL' }).nullish(),
  icon: z.string().max(50, { message: 'Icon name must be at most 50 characters' }).nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0, { message: 'Sort order must be 0 or greater' }).default(0),
})

export const createCategorySchema = categorySchema
export const updateCategorySchema = categorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
