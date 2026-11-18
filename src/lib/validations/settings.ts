import { z } from 'zod'

export const taxSettingsSchema = z.object({
  globalTaxPercent: z.number().min(0, { message: 'Tax percent cannot be negative' }).max(100, { message: 'Tax percent must be between 0 and 100' }),
  taxInclusivePricing: z.boolean({ message: 'Please specify if pricing is tax inclusive' }),
})

export const deliverySettingsSchema = z.object({
  deliveryEnabled: z.boolean({ message: 'Please specify if delivery is enabled' }),
  insideDhakaCharge: z.number().min(0, { message: 'Delivery charge cannot be negative' }),
  outsideDhakaCharge: z.number().min(0, { message: 'Delivery charge cannot be negative' }),
  freeDeliveryThreshold: z.number().min(0, { message: 'Free delivery threshold cannot be negative' }),
  deliveryDaysInsideDhaka: z.string().min(1, { message: 'Delivery days is required' }),
  deliveryDaysOutsideDhaka: z.string().min(1, { message: 'Delivery days is required' }),
})

export const generalSettingsSchema = z.object({
  siteName: z.string().min(2, { message: 'Site name must be at least 2 characters' }).max(50, { message: 'Site name must be at most 50 characters' }),
  siteCurrency: z.string().length(3, { message: 'Currency must be a 3-letter code' }),
  contactEmail: z.string().email({ message: 'Please enter a valid email address' }),
  contactPhone: z.string().regex(/^\+?[0-9]{10,15}$/, { message: 'Please enter a valid phone number (10-15 digits, optional +)' }),
  customRequestEnabled: z.boolean({ message: 'Please specify if custom requests are enabled' }),
  customRequestMinQuantity: z.number().int().positive({ message: 'Minimum quantity must be positive' }),
  customRequestMaxDimensionCm: z.number().int().positive({ message: 'Maximum dimension must be positive' }).max(100, { message: 'Maximum dimension cannot exceed 100cm' }),
})

export const emailTemplateSchema = z.object({
  orderConfirmation: z.object({
    subject: z.string().min(1, { message: 'Subject is required' }),
    body: z.string().min(1, { message: 'Body is required' }),
  }).optional(),
  orderStatusUpdate: z.object({
    subject: z.string().min(1, { message: 'Subject is required' }),
    body: z.string().min(1, { message: 'Body is required' }),
  }).optional(),
  customRequestUpdate: z.object({
    subject: z.string().min(1, { message: 'Subject is required' }),
    body: z.string().min(1, { message: 'Body is required' }),
  }).optional(),
  welcome: z.object({
    subject: z.string().min(1, { message: 'Subject is required' }),
    body: z.string().min(1, { message: 'Body is required' }),
  }).optional(),
})

export const updateSettingSchema = z.object({
  key: z.string().min(1, { message: 'Key is required' }),
  value: z.string().min(1, { message: 'Value is required' }),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON'], { message: 'Invalid setting type' }),
  category: z.enum(['TAX', 'DELIVERY', 'GENERAL', 'EMAIL'], { message: 'Invalid category' }),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

export type TaxSettingsInput = z.infer<typeof taxSettingsSchema>
export type DeliverySettingsInput = z.infer<typeof deliverySettingsSchema>
export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>

/**
 * Envelope for a settings backup restore. Individual entries are validated
 * separately by the importer (a bad entry is skipped with a reason rather
 * than aborting the whole restore), so the record values stay `unknown` here.
 */
export const settingsBackupEnvelopeSchema = z.object({
  version: z.literal(1, { message: 'Unsupported backup version' }),
  exportedAt: z.string().optional(),
  settings: z.record(z.unknown()),
})

export type SettingsBackupEnvelope = z.infer<typeof settingsBackupEnvelopeSchema>