import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, handleRouteError, AppError, requireUser } from '@/lib/api-utils'
import { enforceRateLimit } from '@/lib/rate-limit'
import { computeDiscount } from '@/lib/pricing'

const schema = z.object({
  code: z.string().trim().min(1, 'Enter a promo code').max(40),
  subtotal: z.number().nonnegative(),
})

/**
 * E4 — server-side promo validation + discount PREVIEW for checkout. The
 * discount is computed here (never client math) using the frozen pricing
 * helper; `createOrder` re-computes it authoritatively at order time. Reads
 * the `promo_<CODE>` setting directly (like createOrder) — getSetting would
 * admin-gate a non-public setting, but a customer must be able to validate a
 * code at checkout. Returns only the discount/type/value, not raw settings.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'promo')
    if (limited) return limited
    await requireUser()

    const { code, subtotal } = schema.parse(await request.json())
    const setting = await prisma.setting.findUnique({ where: { key: `promo_${code.toUpperCase()}` } })
    if (!setting) throw new AppError(400, 'Invalid promo code', 'INVALID_PROMO')

    let promo: { type?: string; value?: number }
    try {
      promo = JSON.parse(setting.value)
    } catch {
      throw new AppError(400, 'Invalid promo code', 'INVALID_PROMO')
    }
    if (!promo || (promo.type !== 'percent' && promo.type !== 'fixed') || typeof promo.value !== 'number') {
      throw new AppError(400, 'Invalid promo code', 'INVALID_PROMO')
    }

    const discount = computeDiscount({ type: promo.type, value: promo.value }, subtotal)
    return ok({ code: code.toUpperCase(), discount, type: promo.type, value: promo.value })
  } catch (error) {
    return handleRouteError(error)
  }
}
