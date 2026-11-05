'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { OrderTimeline } from '@/components/admin/OrderTimeline'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS, CUSTOMER_CANCELLABLE } from '@/lib/order-status'
import { ArrowLeft, Truck, MapPin, CreditCard } from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
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
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-[var(--ink)]/60 hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-primary">{order.orderNumber}</h1>
            <Badge variant="info">
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
            </Badge>
          </div>
          {CUSTOMER_CANCELLABLE.includes(order.status) && (
            <Button variant="destructive" size="sm" onClick={cancel}>
              Cancel Order
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-lg text-primary mb-4">Items</h2>
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.productImage || '/images/sticker-placeholder.svg'}
                      alt={item.productName}
                      className="w-14 h-14 rounded-input object-cover border border-[var(--ink)]/20"
                    />
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${item.productSlug}`} className="font-medium text-[var(--ink)] hover:text-primary">
                        {item.productName}
                      </Link>
                      <p className="text-sm text-[var(--ink)]/60">
                        {item.width} × {item.height} cm · Qty {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                      </p>
                    </div>
                    <p className="font-display text-primary">{formatCurrency(Number(item.totalPrice))}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg text-primary mb-4">Timeline</h2>
              <OrderTimeline order={order} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-lg text-primary mb-4">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--ink)]/60">Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
                <div className="flex justify-between"><span className="text-[var(--ink)]/60">Tax</span><span>{formatCurrency(Number(order.taxAmount))}</span></div>
                <div className="flex justify-between"><span className="text-[var(--ink)]/60">Delivery</span><span>{formatCurrency(Number(order.deliveryCharge))}</span></div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(Number(order.discountAmount))}</span></div>
                )}
                <div className="flex justify-between font-display text-lg text-primary border-t border-[var(--light)] pt-2">
                  <span>Total</span><span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
              <p className="text-xs text-[var(--ink)]/50 mt-3">Placed {formatDateTime(order.createdAt)}</p>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg text-primary mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Shipping</h2>
              <p className="text-sm text-[var(--ink)]">{order.shippingName} · {order.shippingPhone}</p>
              <p className="text-sm text-[var(--ink)]/60">
                {order.shippingAddress}, {order.shippingCity}, {order.shippingDivision} {order.shippingPostalCode}
              </p>
              {order.trackingNumber && (
                <p className="text-sm text-[var(--ink)]/60 mt-2 flex items-center gap-1"><Truck className="w-4 h-4" /> {order.trackingNumber}</p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg text-primary mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment</h2>
              <p className="text-sm text-[var(--ink)]">{order.paymentMethod} · {order.paymentStatus}</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
