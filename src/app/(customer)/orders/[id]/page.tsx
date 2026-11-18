'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS, CUSTOMER_CANCELLABLE, type OrderStatus } from '@/lib/order-status'
import { ArrowLeft, Truck, MapPin, CreditCard, RotateCcw, Download, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  taxAmount: number
  deliveryCharge: number
  discountAmount: number
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
  trackingNumber: string | null
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingDivision: string
  shippingPostalCode: string
  paymentMethod: string
  paymentStatus: string
  notes: string | null
  items: Array<{
    id: string
    productId: string
    productName: string
    productSlug: string
    productImage: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
    width: number
    height: number
  }>
}

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed', description: 'Your order has been received' },
  { key: 'CONFIRMED', label: 'Confirmed', description: 'Order confirmed by our team' },
  { key: 'PROCESSING', label: 'Processing', description: 'Preparing your stickers for production' },
  { key: 'PRINTING', label: 'Printing', description: 'Stickers are being printed' },
  { key: 'READY_TO_SHIP', label: 'Ready to Ship', description: 'Printing complete, ready for dispatch' },
  { key: 'SHIPPED', label: 'Shipped', description: 'Order dispatched for delivery' },
  { key: 'DELIVERED', label: 'Delivered', description: 'Order delivered to you' },
] as const

const CANCELLED_STEPS = ['CANCELLED', 'REFUNDED']

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (res.status === 401) return router.push('/login?callbackUrl=/orders')
      if (res.status === 404) return router.push('/orders')
      const json = await res.json()
      // `GET /api/orders/[id]` answers `ok({ order })`, so the order is one
      // level down. Reading `json.data` here set the wrapper object as the
      // order and the page crashed on `order.items`.
      if (res.ok) setOrder(json.data.order)
      else toast.error(json.error || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async () => {
    const res = await fetch(`/api/orders/${params.id}/cancel`, { method: 'POST' })
    if (res.ok) {
      toast.success('Order cancelled')
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'This order cannot be cancelled')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    )
  }

  if (!order) return null

  // Build timeline history from order timestamps
  const buildHistory = () => {
    const history = [
      {
        status: 'PENDING',
        timestamp: order.createdAt,
        note: 'Order placed',
        updatedBy: 'Customer',
      },
    ]

    if (order.status !== 'PENDING') {
      history.push({
        status: 'CONFIRMED',
        timestamp: order.createdAt,
        note: 'Order confirmed by admin',
        updatedBy: 'Admin',
      })
    }

    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      history.push({
        status: 'PROCESSING',
        timestamp: order.createdAt,
        note: 'Order sent to production',
        updatedBy: 'System',
      })
    }

    if (['PRINTING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      history.push({
        status: 'PRINTING',
        timestamp: order.createdAt,
        note: 'Stickers sent to print',
        updatedBy: 'Production',
      })
    }

    if (['READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      history.push({
        status: 'READY_TO_SHIP',
        timestamp: order.createdAt,
        note: 'Printing complete, ready for dispatch',
        updatedBy: 'Warehouse',
      })
    }

    if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
      history.push({
        status: 'SHIPPED',
        timestamp: order.shippedAt || order.createdAt,
        note: order.trackingNumber ? `Shipped with tracking: ${order.trackingNumber}` : 'Dispatched for delivery',
        updatedBy: 'Logistics',
      })
    }

    if (order.status === 'DELIVERED') {
      history.push({
        status: 'DELIVERED',
        timestamp: order.deliveredAt || order.createdAt,
        note: 'Delivered to customer',
        updatedBy: 'Delivery Agent',
      })
    }

    if (order.status === 'CANCELLED') {
      history.push({
        status: 'CANCELLED',
        timestamp: order.createdAt,
        note: order.notes || 'Order cancelled',
        updatedBy: 'Admin',
      })
    }

    if (order.status === 'REFUNDED') {
      history.push({
        status: 'REFUNDED',
        timestamp: order.createdAt,
        note: 'Refund processed',
        updatedBy: 'Admin',
      })
    }

    return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  const history = buildHistory()
  const isCancelled = CANCELLED_STEPS.includes(order.status)

  return (
    <div className="min-h-screen bg-[var(--paper)] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-[var(--text-subtle)] hover:text-[var(--brand)] mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-[var(--brand)]">{order.orderNumber}</h1>
            <StatusBadge status={order.status as OrderStatus} size="md" />
          </div>
          {CUSTOMER_CANCELLABLE.includes(order.status as OrderStatus) && (
            <Button variant="destructive" size="sm" onClick={cancel}>
              Cancel Order
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Items Card */}
            <Card variant="doodle" padding="lg" className="relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg text-[var(--brand)]">Items</h2>
                <span className="text-sm text-[var(--text-subtle)]">{order.items.length} item(s)</span>
              </div>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/shop/${item.productSlug}`}
                    className="flex items-center gap-4 p-3 bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)] rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--ink)_10%,transparent)] hover:border-[color-mix(in_srgb,var(--brand)_30%,transparent)] hover:bg-[var(--paper-deep)] transition-all group"
                  >
                    <div className="w-14 h-14 rounded-[var(--radius-md)] overflow-hidden flex-shrink-0 bg-[var(--surface-raised)]">
                      {item.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--ink)] truncate group-hover:text-[var(--brand)] transition-colors">{item.productName}</p>
                      <p className="text-sm text-[var(--text-subtle)]">
                        {item.width} × {item.height} cm · Qty {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                      </p>
                    </div>
                    <p className="font-display text-[var(--brand)]">{formatCurrency(Number(item.totalPrice))}</p>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Timeline Card — Ruling 6: a vertical dashed connector with ink dots.
                The history array above is unchanged; only its presentation is. */}
            <Card variant="doodle" padding="lg" className="relative">
              <h2 className="font-display text-lg text-[var(--brand)] mb-6">Timeline</h2>

              <ol className="relative">
                {history.map((entry, index) => {
                  const isLast = index === history.length - 1
                  const isCurrent = entry.status === order.status
                  const stepConfig = STATUS_STEPS.find(s => s.key === entry.status)

                  return (
                    <motion.li
                      key={entry.status}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex gap-4 pb-6 last:pb-0"
                    >
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className="absolute left-3 top-4 bottom-0 w-0 -translate-x-1/2 border-l-2 border-dashed border-[color-mix(in_srgb,var(--ink)_30%,transparent)]"
                        />
                      )}
                      <div className="relative w-6 flex-shrink-0">
                        <span className="absolute left-1/2 top-1 block h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--ink)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[var(--text)]">
                            {stepConfig?.label || ORDER_STATUS_LABELS[entry.status as keyof typeof ORDER_STATUS_LABELS] || entry.status}
                          </span>
                          <time className="text-sm text-[var(--text-subtle)] whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString()}
                          </time>
                          {isCurrent && !isCancelled && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        {entry.note && (
                          <p className="text-sm text-[var(--text-subtle)]">{entry.note}</p>
                        )}
                        {entry.updatedBy && (
                          <p className="text-xs text-[var(--text-subtle)] mt-1">Updated by {entry.updatedBy}</p>
                        )}
                      </div>
                    </motion.li>
                  )
                })}
              </ol>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Summary Card */}
            <Card variant="doodle" padding="lg">
              <h2 className="font-display text-lg text-[var(--brand)] mb-4">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-subtle)]">Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-subtle)]">Tax</span>
                  <span>{formatCurrency(Number(order.taxAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-subtle)]">Delivery</span>
                  <span>{formatCurrency(Number(order.deliveryCharge))}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-[var(--success)]">
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(order.discountAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between font-display text-lg text-[var(--brand)] border-t border-[var(--border)] pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-subtle)] mt-3">Placed {formatDateTime(order.createdAt)}</p>
            </Card>

            {/* Shipping Card */}
            <Card variant="doodle" padding="lg">
              <h2 className="font-display text-lg text-[var(--brand)] mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping
              </h2>
              <p className="text-sm text-[var(--ink)]">{order.shippingName} · {order.shippingPhone}</p>
              <p className="text-sm text-[var(--text-subtle)]">
                {order.shippingAddress}, {order.shippingCity}, {order.shippingDivision} {order.shippingPostalCode}
              </p>
              {order.trackingNumber && (
                <p className="text-sm text-[var(--text-subtle)] mt-2 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> {order.trackingNumber}
                </p>
              )}
            </Card>

            {/* Payment Card */}
            <Card variant="doodle" padding="lg">
              <h2 className="font-display text-lg text-[var(--brand)] mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment
              </h2>
              <p className="text-sm text-[var(--ink)]">{order.paymentMethod} · {order.paymentStatus}</p>
            </Card>

            {/* Actions Card */}
            <Card variant="doodle" padding="lg">
              <h2 className="font-display text-lg text-[var(--brand)] mb-4">Actions</h2>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Reorder
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  icon={<Download className="w-4 h-4" />}
                >
                  Download Invoice
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  icon={<MessageCircle className="w-4 h-4" />}
                >
                  Contact Support
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
