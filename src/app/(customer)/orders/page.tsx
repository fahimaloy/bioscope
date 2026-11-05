'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, CUSTOMER_CANCELLABLE } from '@/lib/order-status'
import { Eye, Package, Truck } from 'lucide-react'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'

interface OrderListItem {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: {
    productName: string
    productImage: string | null
    quantity: number
    unitPrice: number
    width: number
    height: number
  }[]
}

const TABS = ['all', ...Object.keys(ORDER_STATUS_LABELS)] as const

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pager, setPager] = useState({ total: 0, totalPages: 1, hasNext: false, hasPrev: false })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (status !== 'all') params.set('status', status)
      const res = await fetch(`/api/orders?${params.toString()}`)
      if (res.status === 401) {
        router.push('/login?callbackUrl=/orders')
        return
      }
      const json = await res.json()
      if (res.ok) {
        setOrders(json.data.data)
        setPager(json.data.pagination)
      } else {
        toast.error(json.error || 'Failed to load orders')
      }
    } finally {
      setLoading(false)
    }
  }, [page, status, router])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async (id: string) => {
    const res = await fetch(`/api/orders/${id}/cancel`, { method: 'POST' })
    if (res.ok) {
      toast.success('Order cancelled')
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'This order cannot be cancelled')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <DoodleScatter count={3} />
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl text-primary mb-6">My Orders</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setStatus(t); setPage(1) }}
              className={
                'px-3 py-1.5 rounded-input text-sm font-medium transition-all border ' +
                (status === t
                  ? 'bg-primary text-white border-primary shadow-btn'
                  : 'bg-white text-[var(--ink)]/70 border-[var(--ink)]/20 hover:bg-[var(--light)]')
              }
            >
              {t === 'all' ? 'All' : ORDER_STATUS_LABELS[t as keyof typeof ORDER_STATUS_LABELS] ?? t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-card" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-10 text-center">
            <Package className="w-10 h-10 mx-auto text-[var(--ink)]/30 mb-3" />
            <p className="text-[var(--ink)]/60 mb-4">No orders yet.</p>
            <Link href="/shop">
              <Button variant="primary">Start Shopping</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <Link href={`/orders/${order.id}`} className="font-display text-lg text-[var(--ink)] hover:text-primary">
                        {order.orderNumber}
                      </Link>
                      <Badge variant="info" size="sm">
                        {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--ink)]/50 mt-1">{formatDate(order.createdAt)}</p>
                    <div className="mt-2 space-y-1">
                      {order.items.slice(0, 3).map((item, i) => (
                        <p key={i} className="text-sm text-[var(--ink)]/70">
                          {item.productName} — {item.width}×{item.height} cm × {item.quantity}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-[var(--ink)]/50">+{order.items.length - 3} more items</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-display text-xl text-primary">{formatCurrency(Number(order.total))}</p>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" aria-label="View order">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    </Link>
                    {CUSTOMER_CANCELLABLE.includes(order.status as any) && (
                      <Button variant="destructive" size="sm" onClick={() => cancel(order.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {pager.totalPages > 1 && (
          <div className="mt-8">
            <Pagination currentPage={page} totalPages={pager.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}