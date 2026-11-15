// Shared helpers for server-side analytics endpoints (admin only).
import type { OrderStatus } from '@prisma/client'

export const PAID_NOT_IN: OrderStatus[] = ['CANCELLED', 'REFUNDED']
export type RangeKey = '7d' | '30d' | '90d' | '12mo'

const RANGE_MS: Record<RangeKey, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '12mo': 365 * 24 * 60 * 60 * 1000,
}

export function parseRange(url: string): { range: RangeKey; since: Date } {
  const raw = new URL(url).searchParams.get('range') ?? '30d'
  const range: RangeKey = raw in RANGE_MS ? (raw as RangeKey) : '30d'
  return { range, since: new Date(Date.now() - RANGE_MS[range]) }
}

export function parseLimit(url: string, fallback = 10): number {
  const n = Number(new URL(url).searchParams.get('limit'))
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 100) : fallback
}

export const EXCLUDE_PAID: { status: { notIn: OrderStatus[] } } = { status: { notIn: PAID_NOT_IN } }
