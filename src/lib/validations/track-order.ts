import { z } from 'zod'

// Shared by the public track-order page (client) and the trackOrder action
// (server). Lives here — not in the action — because the action imports
// prisma and must never reach a client bundle.

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

export const trackOrderSchema = z
  .object({
    orderNumber: z
      .string()
      .trim()
      .min(3, 'Order number looks too short')
      .max(40, 'Order number looks too long'),
    email: z.preprocess(
      emptyToUndefined,
      z.string().trim().toLowerCase().email('Enter a valid email address').optional()
    ),
    phone: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(6, 'Enter a valid phone number').max(20).optional()
    ),
  })
  .refine((d) => Boolean(d.email || d.phone), {
    message: 'Enter the email or phone number used on the order',
    path: ['email'],
  })

export type TrackOrderInput = z.infer<typeof trackOrderSchema>

/** Narrow, PII-free public shape — no name/address/contact leaves the server. */
export interface TrackedOrder {
  orderNumber: string
  status: string
  placedAt: string
  shippedAt: string | null
  deliveredAt: string | null
  trackingNumber: string | null
  total: number
  currency: string
  items: {
    name: string
    quantity: number
    width: number
    height: number
    totalPrice: number
  }[]
}
