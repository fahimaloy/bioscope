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
  notes: z.string().max(2000).optional(),
})

export const priceCustomRequestSchema = z.object({
  quotedPrice: z.number().positive({ message: 'Quoted price must be positive' }),
  adminNotes: z.string().max(2000).optional(),
})

export const updateCustomRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PRICED', 'ORDERED']),
  adminNotes: z.string().max(2000).optional(),
  quotedPrice: z.number().positive().optional(),
})

export const customRequestFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PRICED', 'ORDERED']).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'quantity', 'width', 'height']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export type SubmitCustomRequestInput = z.infer<typeof submitCustomRequestSchema>
export type PriceCustomRequestInput = z.infer<typeof priceCustomRequestSchema>
export type UpdateCustomRequestStatusInput = z.infer<typeof updateCustomRequestStatusSchema>
export type CustomRequestFilterInput = z.infer<typeof customRequestFilterSchema>