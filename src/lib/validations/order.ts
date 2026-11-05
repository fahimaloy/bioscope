import { z } from 'zod'

export const addressSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(50),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, { message: 'Please enter a valid phone number' }),
  addressLine1: z.string().min(5, { message: 'Address line 1 is required' }).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2, { message: 'City is required' }).max(100),
  district: z.string().min(2, { message: 'District is required' }).max(100),
  division: z.string().min(2, { message: 'Division is required' }).max(100),
  postalCode: z.string().regex(/^[0-9]{4}$/, { message: 'Please enter a valid 4-digit postal code' }).optional(),
  country: z.string().default('Bangladesh'),
  deliveryZone: z.enum(['INSIDE_DHAKA', 'OUTSIDE_DHAKA']),
  isDefault: z.boolean().default(false),
})

export const cartItemSchema = z.object({
  productId: z.string().min(1, { message: 'Product is required' }),
  width: z.number().positive({ message: 'Width must be positive' }),
  height: z.number().positive({ message: 'Height must be positive' }),
  quantity: z.number().int().positive({ message: 'Quantity must be positive' }),
  customization: z.record(z.any()).optional(),
})

export const addToCartSchema = cartItemSchema

export const updateCartItemSchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.number().int().positive({ message: 'Quantity must be positive' }),
})

export const checkoutSchema = z.object({
  addressId: z.string().min(1, { message: 'Please select a shipping address' }),
  paymentMethod: z.enum(['COD', 'BANK_TRANSFER']),
  notes: z.string().max(1000).optional(),
  promoCode: z.string().optional(),
})

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PRINTING',
    'READY_TO_SHIP',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
  notes: z.string().max(1000).optional(),
  trackingNumber: z.string().optional(),
})

export const orderFilterSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PRINTING',
    'READY_TO_SHIP',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'total', 'status', 'orderNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export type AddressInput = z.infer<typeof addressSchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>
export type OrderFilterInput = z.infer<typeof orderFilterSchema>