import { z } from 'zod'
import { isSpendTierLabel } from '@/lib/spend-tiers'

/**
 * Optional filters for the admin customer list and CSV export.
 *
 * `spendTier` matches the tier the customer displays (stored override or spend
 * band), `minOrders` their order count, and `dateFrom` their join date
 * (inclusive). Empty query params are normalised to `undefined` by the caller.
 */
export const customerFiltersSchema = z.object({
  spendTier: z
    .string()
    .trim()
    .refine((value) => isSpendTierLabel(value), { message: 'Unknown spend tier' })
    .optional(),
  minOrders: z.coerce.number().int().min(0).max(100000).optional(),
  dateFrom: z.coerce.date().optional(),
})

export type CustomerFilters = z.infer<typeof customerFiltersSchema>
