'use client'

import { useCartSync } from '@/lib/hooks/useCartSync'

/** E7 — renders nothing; reconciles guest cart items into the server cart on sign-in. */
export function CartSync() {
  useCartSync()
  return null
}
