import { z } from 'zod'

export const submitCustomRequestSchema = z.object({
  imageUrl: z.string().url({ message: 'Invalid image URL' }),
  originalName: z.string().min(1, { message: 'Original file name is required' }),
  width: z.number().positive({ message: 'Width must be positive' }).max(100, { message: 'Width cannot exceed 100cm' }),
  height: z.number().positive({ message: 'Height must be positive' }).max(100, { message: 'Height cannot exceed 100cm' }),
  quantity: z.number().int().positive({ message: 'Quantity must be positive' }).min(1, { message: 'Minimum quantity is 1' }),
  material: z.enum(['vinyl', 'paper', 'holographic', 'clear', 'kraft'], {
    message: 'Please select a valid material',
  }),
  finish: z.enum(['matte', 'glossy', 'transparent'], {
    message: 'Please select a valid finish',
  }),
  cutType: z.enum(['kiss_cut', 'die_cut', 'custom'], {
    message: 'Please select a valid cut type',
  }),
  notes: z.string().max(2000, { message: 'Notes must be at most 2000 characters' }).optional(),
})

export const priceCustomRequestSchema = z.object({
  quotedPrice: z.number().positive({ message: 'Quoted price must be positive' }),
  adminNotes: z.string().max(2000, { message: 'Admin notes must be at most 2000 characters' }).optional(),
})

export const updateCustomRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PRICED', 'REVISION_REQUESTED', 'ORDERED'], {
    message: 'Please select a valid status',
  }),
  adminNotes: z.string().max(2000, { message: 'Admin notes must be at most 2000 characters' }).optional(),
  quotedPrice: z.number().positive({ message: 'Quoted price must be positive' }).optional(),
})

/** Query-string filters for the admin custom-request CSV export. */
export const customRequestExportFiltersSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PRICED', 'REVISION_REQUESTED', 'ORDERED']).optional(),
  search: z.string().trim().max(200, { message: 'Search is too long' }).optional(),
})

export type CustomRequestExportFilters = z.infer<typeof customRequestExportFiltersSchema>

export const createOrderFromRequestSchema = z.object({
  productId: z.string().min(1, { message: 'Please choose the product this request becomes' }),
  addressId: z.string().min(1, { message: 'Please choose a shipping address' }),
  width: z.number().positive({ message: 'Width must be positive' }).max(100, { message: 'Width cannot exceed 100cm' }),
  height: z.number().positive({ message: 'Height must be positive' }).max(100, { message: 'Height cannot exceed 100cm' }),
  quantity: z.number().int().positive({ message: 'Quantity must be positive' }),
  paymentMethod: z.enum(['COD', 'BANK_TRANSFER']).default('COD'),
  notes: z.string().max(1000, { message: 'Notes must be at most 1000 characters' }).optional(),
})

export type CreateOrderFromRequestInput = z.infer<typeof createOrderFromRequestSchema>

export const customRequestFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PRICED', 'REVISION_REQUESTED', 'ORDERED']).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime({ message: 'Invalid date format' }).optional(),
  endDate: z.string().datetime({ message: 'Invalid date format' }).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'quantity', 'width', 'height'], { message: 'Invalid sort field' }).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'], { message: 'Invalid sort order' }).default('desc'),
  page: z.number().int().positive({ message: 'Page must be positive' }).default(1),
  limit: z.number().int().positive({ message: 'Limit must be positive' }).max(100, { message: 'Limit cannot exceed 100' }).default(20),
})

export type SubmitCustomRequestInput = z.infer<typeof submitCustomRequestSchema>
export type PriceCustomRequestInput = z.infer<typeof priceCustomRequestSchema>
export type UpdateCustomRequestStatusInput = z.infer<typeof updateCustomRequestStatusSchema>
export type CustomRequestFilterInput = z.infer<typeof customRequestFilterSchema>