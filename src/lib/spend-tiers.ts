/**
 * Spend tiers shared by the admin customer list API, the CSV export, and the
 * customers page.
 *
 * A customer's displayed tier is their stored override when one is set,
 * otherwise the band their lifetime order total falls into. Keeping the bands
 * here stops the list filter, the CSV export, and the badge from drifting.
 *
 * Server- and client-safe: no Prisma, no Node APIs.
 */

export const SPEND_TIERS = [
  { min: 0, max: 1000, label: 'New' },
  { min: 1000, max: 5000, label: 'Bronze' },
  { min: 5000, max: 20000, label: 'Silver' },
  { min: 20000, max: 50000, label: 'Gold' },
  { min: 50000, max: Number.POSITIVE_INFINITY, label: 'VIP' },
] as const

export type SpendTierLabel = (typeof SPEND_TIERS)[number]['label']

const SPEND_TIER_LABELS = SPEND_TIERS.map((tier) => tier.label)

/** Type guard for a tier label coming from a query string or the UI. */
export function isSpendTierLabel(value: string): value is SpendTierLabel {
  return (SPEND_TIER_LABELS as readonly string[]).includes(value)
}

/**
 * Resolve the tier a customer displays: an explicit override wins when it is a
 * known label, otherwise the band their lifetime spend falls into.
 */
export function resolveSpendTier(totalSpent: number, override?: string | null): SpendTierLabel {
  if (override && isSpendTierLabel(override)) return override
  const tier = SPEND_TIERS.find((t) => totalSpent >= t.min && totalSpent < t.max)
  return tier ? tier.label : SPEND_TIERS[0].label
}
