import { z } from 'zod'

export const taxSettingsSchema = z.object({
  globalTaxPercent: z.number().min(0).max(100, { message: 'Tax percent must be between 0 and 100' }),
  taxInclusivePricing: z.boolean(),
})

export const deliverySettingsSchema = z.object({
  deliveryEnabled: z.boolean(),
  insideDhakaCharge: z.number().min(0, { message: 'Delivery charge cannot be negative' }),
  outsideDhakaCharge: z.number().min(0, { message: 'Delivery charge cannot be negative' }),
  freeDeliveryThreshold: z.number().min(0, { message: 'Free delivery threshold cannot be negative' }),
  deliveryDaysInsideDhaka: z.string().min(1, { message: 'Delivery days is required' }),
  deliveryDaysOutsideDhaka: z.string().min(1, { message: 'Delivery days is required' }),
})

export const generalSettingsSchema = z.object({
  siteName: z.string().min(2, { message: 'Site name must be at least 2 characters' }).max(50),
  siteCurrency: z.string().length(3, { message: 'Currency must be a 3-letter code' }),
  contactEmail: z.string().email({ message: 'Please enter a valid email address' }),
  contactPhone: z.string().regex(/^\+?[0-9]{10,15}$/, { message: 'Please enter a valid phone number' }),
  customRequestEnabled: z.boolean(),
  customRequestMinQuantity: z.number().int().positive({ message: 'Minimum quantity must be positive' }),
  customRequestMaxDimensionCm: z.number().int().positive({ message: 'Maximum dimension must be positive' }).max(100),
})

export const emailTemplateSchema = z.object({
  orderConfirmation: z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
  }).optional(),
  orderStatusUpdate: z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
  }).optional(),
  customRequestUpdate: z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
  }).optional(),
  welcome: z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
  }).optional(),
})

export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']),
  category: z.enum(['TAX', 'DELIVERY', 'GENERAL', 'EMAIL']),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

export type TaxSettingsInput = z.infer<typeof taxSettingsSchema>
export type DeliverySettingsInput = z.infer<typeof deliverySettingsSchema>
export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>