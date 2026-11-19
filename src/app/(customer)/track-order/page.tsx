'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Package, Search, Mail, Phone, ArrowLeft, Truck, CheckCircle2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { WashiTape, SketchUnderline } from '@/components/decorative'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { useMotionVariants } from '@/lib/motion'
import { formatCurrency, formatDate } from '@/lib/utils'
import { trackOrderSchema, type TrackOrderInput, type TrackedOrder } from '@/lib/validations/track-order'
import type { OrderStatus } from '@/lib/order-status'

// Canonical fulfilment path — the strip highlights reached steps only.
// No timestamps are invented for intermediate steps (B2 ruling: no fake data);
// only placed/shipped/delivered carry real dates from the server.
const STATUS_PATH: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PRINTING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
]

const STEP_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Order placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'In production',
  PRINTING: 'Printing',
  READY_TO_SHIP: 'Ready to ship',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export default function TrackOrderPage() {
  const variants = useMotionVariants()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<TrackedOrder | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackOrderInput>({ resolver: zodResolver(trackOrderSchema) })

  const onSubmit = async (data: TrackOrderInput) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many lookups. Please wait a minute and try again.')
        } else {
          setError(json?.error || 'Something went wrong. Please try again.')
        }
        return
      }
      setResult(json.data as TrackedOrder)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentIndex = result ? STATUS_PATH.indexOf(result.status as OrderStatus) : -1
  const isTerminalBad = result?.status === 'CANCELLED' || result?.status === 'REFUNDED'

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12 relative overflow-hidden">
      <Card variant="doodle-elevated" padding="xl" className="w-full max-w-lg relative">
        <WashiTape rotation={-3} width={160} height={32} className="absolute -top-4 left-1/2 -translate-x-1/2 z-10" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="font-display text-3xl md:text-4xl text-[var(--text)]">Track Your Order</h1>
          <p className="text-[var(--text-subtle)] mt-2">
            Enter your order number and the email or phone used at checkout
          </p>
        </div>

        {/* Entrance-only motion (no AnimatePresence exit): a form→result swap
            mounts the new panel immediately. A coordinated mode="wait" exit
            stalled on the spring in a real browser and never mounted the
            result — jsdom completes exits instantly so it could not catch it. */}
        {result ? (
          <motion.div
            key="result"
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            data-testid="track-result"
            aria-live="polite"
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-xl text-[var(--text)] break-all">{result.orderNumber}</p>
                <p className="text-sm text-[var(--text-subtle)]">Placed {formatDate(result.placedAt)}</p>
              </div>
              <OrderStatusBadge status={result.status as OrderStatus} size="lg" />
            </div>

            {isTerminalBad ? (
              <p className="rounded-input border-2 border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] p-4 text-sm text-[var(--text)]">
                This order was {result.status === 'CANCELLED' ? 'cancelled' : 'refunded'}. Questions?{' '}
                <Link href="/contact" className="font-medium underline">Contact us</Link>.
              </p>
            ) : (
              <ol className="space-y-0" aria-label="Order progress">
                {STATUS_PATH.map((status, i) => {
                  const reached = i <= currentIndex
                  const realDate =
                    status === 'PENDING' ? result.placedAt
                    : status === 'SHIPPED' ? result.shippedAt
                    : status === 'DELIVERED' ? result.deliveredAt
                    : null
                  return (
                    <li key={status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          aria-hidden="true"
                          className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)] ${
                            reached ? 'bg-[var(--pink-strong)]' : 'bg-[var(--surface-sunken)]'
                          }`}
                        >
                          {reached && <CheckCircle2 className="h-3 w-3 text-[var(--on-pink-strong)]" />}
                        </span>
                        {i < STATUS_PATH.length - 1 && (
                          <span aria-hidden="true" className={`w-0.5 flex-1 min-h-4 ${reached && i < currentIndex ? 'bg-[var(--ink)]' : 'bg-[color-mix(in_srgb,var(--ink)_20%,transparent)]'}`} />
                        )}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className={`text-sm font-medium ${reached ? 'text-[var(--text)]' : 'text-[var(--text-subtle)]'}`}>
                          {STEP_LABELS[status]}
                        </p>
                        {realDate && (
                          <p className="text-xs text-[var(--text-subtle)]">{formatDate(realDate)}</p>
                        )}
                        {status === 'SHIPPED' && result.trackingNumber && (
                          <p className="text-xs text-[var(--text-muted)] break-all">
                            <Truck className="inline h-3 w-3 mr-1" aria-hidden="true" />
                            Tracking: {result.trackingNumber}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}

            <div className="rounded-input border-2 border-[var(--ink)] bg-[var(--surface-raised)] p-4">
              <h2 className="font-display text-lg text-[var(--text)] mb-3">Items</h2>
              <ul className="space-y-2">
                {result.items.map((item, i) => (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="text-[var(--text)] min-w-0">
                      {item.name}
                      <span className="text-[var(--text-subtle)]"> · {item.width}×{item.height} cm · ×{item.quantity}</span>
                    </span>
                    <span className="font-medium text-[var(--text)] ml-auto">{formatCurrency(item.totalPrice, result.currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] flex items-baseline justify-between">
                <span className="font-display text-[var(--text)]">Total</span>
                <span className="font-display text-xl text-[var(--text)]">{formatCurrency(result.total, result.currency)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="doodle" size="md" onClick={() => setResult(null)}>
                Track another order
              </Button>
              <Link href="/orders" className="inline-flex items-center gap-2 text-[var(--text)] font-medium">
                <SketchUnderline>All my orders</SketchUnderline>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
          >
            {error && (
              <div
                role="alert"
                data-testid="track-error"
                className="mb-6 rounded-input border-2 border-[var(--error)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] p-4 text-sm text-[var(--text)]"
              >
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="track-form">
              <Input
                label="Order number"
                placeholder="ORD-20261119-0001"
                autoComplete="off"
                {...register('orderNumber')}
                error={errors.orderNumber?.message}
                disabled={isLoading}
                icon={<Package className="w-5 h-5" />}
                iconPosition="left"
              />
              <Input
                label="Email (optional if phone given)"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
                icon={<Mail className="w-5 h-5" />}
                iconPosition="left"
              />
              <Input
                label="Phone (optional if email given)"
                type="tel"
                placeholder="01XXXXXXXXX"
                autoComplete="tel"
                {...register('phone')}
                error={errors.phone?.message}
                disabled={isLoading}
                icon={<Phone className="w-5 h-5" />}
                iconPosition="left"
              />
              <Button type="submit" variant="doodle" size="xl" fullWidth loading={isLoading}>
                <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                Track Order
              </Button>
            </form>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link href="/orders" className="inline-flex items-center gap-2 text-[var(--text)] font-medium">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <SketchUnderline>My orders</SketchUnderline>
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 text-[var(--text)] font-medium">
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                <SketchUnderline>Need help?</SketchUnderline>
              </Link>
            </div>
          </motion.div>
        )}
      </Card>
    </div>
  )
}
