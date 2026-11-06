'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS, CUSTOMER_CANCELLABLE, type OrderStatus } from '@/lib/order-status'
import { ArrowLeft, Truck, MapPin, CreditCard, RotateCcw, Download, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { motionVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'

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
  { key: 'PENDING', label: 'Order Placed', icon: 'Clock', description: 'Your order has been received' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: 'CheckCircle', description: 'Order confirmed by our team' },
  { key: 'PROCESSING', label: 'Processing', icon: 'Loader2', description: 'Preparing your stickers for production' },
  { key: 'PRINTING', label: 'Printing', icon: 'Package', description: 'Stickers are being printed' },
  { key: 'READY_TO_SHIP', label: 'Ready to Ship', icon: 'Package', description: 'Printing complete, ready for dispatch' },
  { key: 'SHIPPED', label: 'Shipped', icon: 'Truck', description: 'Order dispatched for delivery' },
  { key: 'DELIVERED', label: 'Delivered', icon: 'CheckCircle', description: 'Order delivered to you' },
] as const

const CANCELLED_STEPS = ['CANCELLED', 'REFUNDED']

const STATUS_ICONS: Record<string, any> = {
  PENDING: 'Clock',
  CONFIRMED: 'CheckCircle',
  PROCESSING: 'Loader2',
  PRINTING: 'Package',
  READY_TO_SHIP: 'Package',
  SHIPPED: 'Truck',
  DELIVERED: 'CheckCircle',
  CANCELLED: 'AlertCircle',
  REFUNDED: 'AlertCircle',
}

const ICON_COMPONENTS: Record<string, any> = {
  Clock: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CheckCircle: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Loader2: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  Package: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Truck: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="5" cy="18" r="2"/></svg>,
  AlertCircle: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
}

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
      if (res.ok) setOrder(json.data)
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
      <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
        <DoodleScatter count={3} />
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
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
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status)
  const isCancelled = CANCELLED_STEPS.includes(order.status)

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <DoodleScatter count={3} />
      <div className="max-w-5xl mx-auto">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-[var(--ink)]/60 hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-primary">{order.orderNumber}</h1>
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
                <h2 className="font-display text-lg text-primary">Items</h2>
                <span className="text-sm text-[var(--ink)]/50">{order.items.length} item(s)</span>
              </div>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/shop/${item.productSlug}`}
                    className="flex items-center gap-4 p-3 bg-[var(--light)]/50 rounded-input border border-[var(--ink)]/10 hover:border-primary/30 hover:bg-[var(--light)] transition-all group"
                  >
                    <div className="w-14 h-14 rounded-input overflow-hidden flex-shrink-0 bg-white">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--ink)]/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--ink)] truncate group-hover:text-primary transition-colors">{item.productName}</p>
                      <p className="text-sm text-[var(--ink)]/60">
                        {item.width} × {item.height} cm · Qty {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                      </p>
                    </div>
                    <p className="font-display text-primary">{formatCurrency(Number(item.totalPrice))}</p>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Timeline Card */}
            <Card variant="doodle" padding="lg" className="relative">
              <h2 className="font-display text-lg text-primary mb-6">Timeline</h2>
              
              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--border-primary)]" />
                
                <div className="space-y-6">
                  {history.map((entry, index) => {
                    const isLast = index === history.length - 1
                    const isCurrent = entry.status === order.status
                    const IconComponent = ICON_COMPONENTS[STATUS_ICONS[entry.status]] || ICON_COMPONENTS.Clock
                    const stepConfig = STATUS_STEPS.find(s => s.key === entry.status)
                    
                    return (
                      <motion.div
                        key={entry.status}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="relative flex gap-4 pl-12">
                          {/* Timeline dot and connector */}
                          <div className="relative flex-shrink-0">
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium z-10 border-3 border-[var(--surface-card)]',
                              isCurrent
                                ? 'bg-primary text-white shadow-[0_0_0_4px_var(--primary)]'
                                : entry.status === 'DELIVERED'
                                ? 'bg-success text-white'
                                : CANCELLED_STEPS.includes(entry.status)
                                ? 'bg-error text-white'
                                : 'bg-primary text-white'
                            )}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                          </div>
                          
                          {/* Timeline content */}
                          <div className="flex-1 pt-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-body text-[var(--ink)]">
                                {stepConfig?.label || ORDER_STATUS_LABELS[entry.status as keyof typeof ORDER_STATUS_LABELS] || entry.status}
                              </span>
                              <time className="text-sm text-[var(--ink)]/50 whitespace-nowrap">
                                {new Date(entry.timestamp).toLocaleString()}
                              </time>
                              {isCurrent && !isCancelled && (
                                <motion.span
                                  className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full"
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  Current
                                </motion.span>
                              )}
                            </div>
                            {entry.note && (
                              <p className="text-sm text-[var(--ink)]/60">{entry.note}</p>
                            )}
                            {entry.updatedBy && (
                              <p className="text-xs text-[var(--ink)]/40 mt-1">Updated by {entry.updatedBy}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Summary Card */}
            <Card variant="doodle" padding="lg">
              <h2 className="font-display text-lg text-primary mb-4">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--ink)]/60">Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink)]/60">Tax</span>
                  <span>{formatCurrency(Number(order.taxAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink)]/60">Delivery</span>
                  <span>{formatCurrency(Number(order.deliveryCharge))}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(order.discountAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between font-display text-lg text-primary border-t border-[var(--border-primary)] pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
              <p className="text-xs text-[var(--ink)]/50 mt-3">Placed {formatDateTime(order.createdAt)}</p>
            </Card>

            {/* Shipping Card */}
            <Card variant="doodle" padding="lg">
              <h2 className="font-display text-lg text-primary mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping
              </h2>
              <p className="text-sm text-[var(--ink)]">{order.shippingName} · {order.shippingPhone}</p>
              <p className="text-sm text-[var(--ink)]/60">
                {order.shippingAddress}, {order.shippingCity}, {order.shippingDivision} {order.shippingPostalCode}
              </p>
              {order.trackingNumber && (
                <p className="text-sm text-[var(--ink)]/60 mt-2 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> {order.trackingNumber}
                </p>
              )}
            </Card>

            {/* Payment Card */}
            <Card variant="doodle" padding="lg">
              <h2 className="font-display text-lg text-primary mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment
              </h2>
              <p className="text-sm text-[var(--ink)]">{order.paymentMethod} · {order.paymentStatus}</p>
            </Card>

            {/* Actions Card */}
            <Card variant="doodle" padding="lg">
              <h2 className="font-display text-lg text-primary mb-4">Actions</h2>
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