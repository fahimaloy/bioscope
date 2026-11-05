// Pure pricing engine — single source of truth for cart/order math.
// Used by server actions (order creation) and unit tests; safe to import anywhere.
import { calculateTax, getDeliveryCharge } from './utils'

export interface PriceableDimension {
  width: number
  height: number
  priceMultiplier: number
}

export interface PriceableQuantity {
  minQty: number
  maxQty: number | null
  pricePerUnit: number
}

export interface PriceableProduct {
  basePrice: number
  taxPercent: number
  additionalCharge?: number
  allowedDimensions: PriceableDimension[]
  allowedQuantities: PriceableQuantity[]
}

export interface CartLineInput {
  product: PriceableProduct
  width: number
  height: number
  quantity: number
}

export interface PricedLine {
  unitPrice: number
  lineTotal: number
  taxPercent: number
  taxAmount: number
  dimensionMatched: boolean
  quantityTierMatched: boolean
}

export interface PricingSettings {
  globalTaxPercent: number
  taxInclusivePricing: boolean
  insideDhakaCharge: number
  outsideDhakaCharge: number
  freeDeliveryThreshold: number
}

export interface OrderTotals {
  subtotal: number
  taxAmount: number
  deliveryCharge: number
  discountAmount: number
  total: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Resolve the unit price for a cart line: quantity tier price x dimension multiplier. */
export function priceLine({ product, width, height, quantity }: CartLineInput, globalTaxPercent: number): PricedLine {
  const qtyTier = product.allowedQuantities.find(
    (q) => quantity >= q.minQty && (q.maxQty === null || quantity <= q.maxQty)
  )
  const dim = product.allowedDimensions.find((d) => d.width === width && d.height === height)

  const base = qtyTier ? qtyTier.pricePerUnit : product.basePrice
  const multiplier = dim ? dim.priceMultiplier : 1
  const unitPrice = round2(base * multiplier)
  const lineTotal = round2(unitPrice * quantity + (product.additionalCharge ?? 0))
  // taxPercent 0 means "inherit the global rate"
  const taxPercent = product.taxPercent > 0 ? product.taxPercent : globalTaxPercent
  const taxAmount = calculateTax(lineTotal, taxPercent)

  return {
    unitPrice,
    lineTotal,
    taxPercent,
    taxAmount: round2(taxAmount),
    dimensionMatched: !!dim,
    quantityTierMatched: !!qtyTier,
  }
}

/** Compute full order totals from priced lines. */
export function computeOrderTotals(
  lines: PricedLine[],
  zone: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA',
  settings: PricingSettings,
  discountAmount = 0
): OrderTotals {
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0))
  const taxAmount = round2(lines.reduce((s, l) => s + l.taxAmount, 0))
  const deliveryCharge = getDeliveryCharge(zone, {
    insideDhakaCharge: settings.insideDhakaCharge,
    outsideDhakaCharge: settings.outsideDhakaCharge,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    subtotal,
  })
  const discount = round2(Math.min(discountAmount, subtotal + taxAmount + deliveryCharge))
  const total = round2(subtotal + taxAmount + deliveryCharge - discount)
  return { subtotal, taxAmount, deliveryCharge, discountAmount: discount, total }
}

/** Promo code stored as settings key `promo_<CODE>` = JSON { type: 'percent'|'fixed', value: number } */
export function computeDiscount(promo: { type: 'percent' | 'fixed'; value: number } | null, subtotal: number): number {
  if (!promo) return 0
  if (promo.type === 'percent') return round2((subtotal * Math.min(promo.value, 100)) / 100)
  return round2(Math.min(promo.value, subtotal))
}
