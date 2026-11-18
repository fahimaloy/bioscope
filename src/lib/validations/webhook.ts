import { z } from 'zod'

/** Events an endpoint can subscribe to. Mirrors WEBHOOK_EVENTS in src/lib/server/webhooks.ts. */
export const WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'order.status_changed',
  'payment.received',
  'custom_request.submitted',
  'custom_request.priced',
  'custom_request.updated',
] as const

export const webhookEventSchema = z.enum(WEBHOOK_EVENTS)

export const webhookEndpointSchema = z.object({
  url: z.string().url({ message: 'A valid https:// URL is required' }).max(500),
  description: z.string().max(200, { message: 'Description must be at most 200 characters' }).optional(),
  events: z.array(webhookEventSchema).min(1, { message: 'Select at least one event' }),
  secret: z.string().max(200, { message: 'Secret must be at most 200 characters' }).optional(),
  isActive: z.boolean().default(true),
})

export const webhookEndpointUpdateSchema = webhookEndpointSchema.partial()

export const webhookTestSchema = z.object({
  event: webhookEventSchema.default('order.updated'),
})

export type WebhookEndpointInput = z.infer<typeof webhookEndpointSchema>
export type WebhookEndpointUpdateInput = z.infer<typeof webhookEndpointUpdateSchema>
