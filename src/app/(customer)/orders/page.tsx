'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { FetchErrorState } from '@/components/ui/FetchErrorState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, CUSTOMER_CANCELLABLE } from '@/lib/order-status'
import type { OrderStatus } from '@/lib/order-status'
import { Eye, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OrderListItem {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: {
    productName: string
    productSlug: string
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
  const [error, setError] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
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
        setError(true)
        toast.error(json.error || 'Failed to load orders')
      }
    } catch {
      setError(true)
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

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId)
  }

  return (
  <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl text-[var(--brand)] mb-6">My Orders</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setStatus(t); setPage(1) }}
              className={
                'rounded-[var(--radius-md)] border px-3 py-1.5 text-sm font-medium transition-all ' +
                (status === t
                  ? 'bg-[var(--brand)] text-[var(--text)] border-[var(--brand)] shadow-ink-2'
                  : 'bg-[var(--surface-raised)] text-[var(--text-muted)] border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:bg-[var(--paper-deep)]')
              }
            >
              {t === 'all' ? 'All' : ORDER_STATUS_LABELS[t as keyof typeof ORDER_STATUS_LABELS] ?? t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
            ))}
          </div>
        ) : error ? (
          <FetchErrorState message="We couldn't load your orders. Please try again." onRetry={load} />
        ) : orders.length === 0 ? (
          <Card className="p-10 text-center">
            <Package className="w-10 h-10 mx-auto text-[var(--text-subtle)] mb-3" />
            <p className="text-[var(--text-subtle)] mb-4">No orders yet.</p>
            <Link href="/shop">
              <Button variant="primary">Start Shopping</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    variant="doodle"
                    hover={true}
                    padding="md"
                    className="cursor-pointer group relative overflow-visible"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="relative">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-display text-lg text-[var(--ink)]">
                              {order.orderNumber}
                            </span>
                            <StatusBadge status={order.status} size="sm" />
                          </div>
                          <p className="text-sm text-[var(--text-subtle)] mt-1">{formatDate(order.createdAt)}</p>
                          <div className="mt-2 space-y-1">
                            {order.items.slice(0, 3).map((item, i) => (
                              <p key={i} className="text-sm text-[var(--text-muted)]">
                                {item.productName} — {item.width}×{item.height} cm × {item.quantity}
                              </p>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-sm text-[var(--text-subtle)]">+{order.items.length - 3} more items</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-display text-xl text-[var(--brand)] whitespace-nowrap">
                            {formatCurrency(Number(order.total))}
                          </p>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/orders/${order.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1"
                            >
                              <Button variant="outline" size="sm" aria-label="View order">
                                <Eye className="w-4 h-4 mr-1" /> View
                              </Button>
                            </Link>
                            {CUSTOMER_CANCELLABLE.includes(order.status as OrderStatus) && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); cancel(order.id) }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable items preview */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, scaleY: 0, y: -10 }}
                            animate={{ opacity: 1, scaleY: 1, y: 0 }}
                            exit={{ opacity: 0, scaleY: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
                            style={{ transformOrigin: 'top' }}
                            className="border-t border-[var(--border)] pt-4 mt-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-[var(--ink)]">Items ({order.items.length})</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpand(order.id) }}
                                className="text-sm text-[var(--text-subtle)] hover:text-[var(--brand)] flex items-center gap-1"
                              >
                                <ChevronUp className="w-4 h-4" /> Collapse
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {order.items.map((item, index) => (
                                <Link
                                  key={index}
                                  href={`/shop/${item.productSlug}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)] rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--ink)_10%,transparent)] hover:border-[color-mix(in_srgb,var(--brand)_30%,transparent)] hover:bg-[var(--paper-deep)] transition-all"
                                >
                                  <div className="w-12 h-12 rounded-[var(--radius-md)] overflow-hidden flex-shrink-0 bg-[var(--surface-raised)]">
                                    {item.productImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={item.productImage}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">
                                        <Package className="w-6 h-6" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-[var(--ink)] truncate">{item.productName}</p>
                                    <p className="text-xs text-[var(--text-subtle)]">
                                      {item.width}×{item.height} cm × {item.quantity}
                                    </p>
                                  </div>
                                  <span className="font-display text-[var(--brand)] text-sm">
                                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Expand/Collapse trigger at bottom */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(order.id) }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-8 flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--brand)] transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        aria-expanded={isExpanded}
                        aria-controls={`order-items-${order.id}`}
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                        <span className="ml-2 text-xs font-medium hidden sm:inline">
                          {isExpanded ? 'Hide items' : 'Show items'}
                        </span>
                      </button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
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
