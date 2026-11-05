import { z } from 'zod'

export const dimensionConfigSchema = z.object({
  id: z.string().optional(),
  width: z.number().positive({ message: 'Width must be positive' }),
  height: z.number().positive({ message: 'Height must be positive' }),
  label: z.string().min(1, { message: 'Label is required' }),
  priceMultiplier: z.number().positive({ message: 'Price multiplier must be positive' }).default(1),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
})

export const quantityConfigSchema = z.object({
  id: z.string().optional(),
  minQty: z.number().int().positive({ message: 'Minimum quantity must be positive' }),
  maxQty: z.number().int().positive({ message: 'Maximum quantity must be positive' }).optional(),
  pricePerUnit: z.number().positive({ message: 'Price per unit must be positive' }),
  label: z.string().min(1, { message: 'Label is required' }),
  sortOrder: z.number().int().min(0).default(0),
})

export const customizationOptionsSchema = z.object({
  materials: z.array(z.string()).optional(),
  finishes: z.array(z.string()).optional(),
  cutTypes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  customFields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['text', 'select', 'color', 'boolean']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(2, { message: 'Product name must be at least 2 characters' }).max(100),
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters' }).max(100).regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }),
  description: z.string().max(5000).optional(),
  basePrice: z.number().positive({ message: 'Base price must be positive' }),
  compareAtPrice: z.number().positive({ message: 'Compare at price must be positive' }).optional(),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  images: z.array(z.string().url({ message: 'Invalid image URL' })).min(1, { message: 'At least one image is required' }),
  allowedDimensions: z.array(dimensionConfigSchema).min(1, { message: 'At least one dimension configuration is required' }),
  allowedQuantities: z.array(quantityConfigSchema).min(1, { message: 'At least one quantity configuration is required' }),
  customizationOptions: customizationOptionsSchema.optional(),
  taxPercent: z.number().min(0).max(100).default(0),
  additionalCharge: z.number().min(0).default(0),
  isTaxInclusive: z.boolean().default(false),
  trackInventory: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const productFilterSchema = z.object({
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  search: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'sortOrder', 'popularity']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
})

export type DimensionConfigInput = z.infer<typeof dimensionConfigSchema>
export type QuantityConfigInput = z.infer<typeof quantityConfigSchema>
export type CustomizationOptionsInput = z.infer<typeof customizationOptionsSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductFilterInput = z.infer<typeof productFilterSchema>