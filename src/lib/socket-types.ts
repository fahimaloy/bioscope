// Wire types for socket emits — keeps server code any-free while allowing
// both Prisma rows (Decimal/Date) and JSON-serialised payloads.

/** Numeric that accepts Prisma Decimal rows as well as plain numbers/strings. */
type NumericLike = number | string | { toString(): string }
type NullableNumericLike = NumericLike | null

export interface EmitOrder {
  id: string
  orderNumber: string
  userId: string
  total: NumericLike
  status: string
  itemCount?: number
  shippingName?: string
  shippingCity?: string
  createdAt?: Date | string
  items?: { productName: string; quantity: number; totalPrice: unknown }[]
  user?: { name?: string | null; email?: string | null }
}

export interface EmitCustomRequest {
  id: string
  userId: string
  status: string
  title?: string | null
  width?: number
  height?: number
  imageUrl?: string | null
  quantity?: number
  material?: string
  finish?: string
  cutType?: string
  createdAt?: Date | string
  quotedPrice?: NullableNumericLike
  adminNotes?: string | null
  quotedAt?: Date | string | null
  user?: { name?: string | null; email?: string | null }
}

export interface EmitProduct {
  id: string
  name: string
  stock: number
  lowStockThreshold?: number
}

export interface EmitNotification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  url?: string | null
}
