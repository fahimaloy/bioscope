import { z } from 'zod'

/** Scopes a headless API key can hold. */
export const API_KEY_SCOPES = [
  'orders:read',
  'orders:write',
  'products:read',
  'products:write',
  'customers:read',
  'custom_requests:read',
  'settings:read',
] as const

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]

export const apiKeyCreateSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(80),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1, { message: 'Select at least one scope' }),
  expiresAt: z.coerce.date().optional(),
})

export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>
