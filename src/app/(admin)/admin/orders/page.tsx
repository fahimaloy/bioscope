'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Button,
  Badge,
  Card,
  DataTable,
  Dropdown,
  Tooltip,
} from '@/components/ui'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { ChevronDown, ChevronUp, Truck, Package, Clock, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/lib/order-status'
import { motion, AnimatePresence } from 'framer-motion'

const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PRINTING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4" />,
  CONFIRMED: <CheckCircle2 className="w-4 h-4" />,
  PROCESSING: <Package className="w-4 h-4" />,
  PRINTING: <Package className="w-4 h-4" />,
  READY_TO_SHIP: <Truck className="w-4 h-4" />,
  SHIPPED: <Truck className="w-4 h-4" />,
  DELIVERED: <CheckCircle2 className="w-4 h-4" />,
  CANCELLED: <XCircle className="w-4 h-4" />,
  REFUNDED: <AlertTriangle className="w-4 h-4" />,
}

interface OrderItem {
  id: string
  productName: string
  productSlug: string
  productImage: string
  width: number
  height: number
  quantity: number
  unitPrice: number
  totalPrice: number
  customization?: Record<string, unknown>
}

interface Order {
  id: string
  orderNumber: string
  user: { name: string | null; email: string } | null
  status: OrderStatus
  total: number | string
  paymentStatus: string
  paymentMethod: string
  deliveryZone: string
  createdAt: string
  items: OrderItem[]
  trackingNumber?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  adminNotes?: string | null
}

interface StatusHistoryEntry {
  status: OrderStatus
  timestamp: string
  note?: string
  updatedBy?: string
}

function StatusTransitionDropdown({
  currentStatus,
  orderId,
  onStatusChange,
  disabled = false,
}: {
  currentStatus: OrderStatus
  orderId: string
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  disabled?: boolean
}) {
  const validTransitions = useMemo(() => ORDER_STATUS_TRANSITIONS[currentStatus] || [], [currentStatus])

  const items = useMemo(() => {
    const allStatuses: OrderStatus[] = [...STATUSES]
    // Put valid transitions first, then others
    return allStatuses.sort((a, b) => {
      const aValid = validTransitions.includes(a)
      const bValid = validTransitions.includes(b)
      if (aValid && !bValid) return -1
      if (!aValid && bValid) return 1
      return 0
    }).map((status) => {
      const isValid = validTransitions.includes(status)
      const isCurrent = status === currentStatus
      return {
        value: status,
        label: `${ORDER_STATUS_LABELS[status]}${isCurrent ? ' (current)' : ''}${!isValid && !isCurrent ? ' — not allowed' : ''}`,
        disabled: !isValid && !isCurrent,
        icon: STATUS_ICONS[status],
      }
    })
  }, [currentStatus, validTransitions])

  return (
    <Dropdown
      trigger={
        <Button variant="outline" size="sm" disabled={disabled} className="min-w-[140px] justify-between">
          <span className="flex items-center gap-2">
            {STATUS_ICONS[currentStatus]}
            <span className="font-medium">{ORDER_STATUS_LABELS[currentStatus]}</span>
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      }
      items={items}
      value={currentStatus}
      onChange={(value) => {
        if (value !== currentStatus && validTransitions.includes(value as OrderStatus)) {
          onStatusChange(orderId, value as OrderStatus)
        }
      }}
      placeholder="Change status"
      disabled={disabled || validTransitions.length === 0}
      align="right"
    />
  )
}

function ExpandedRowContent({
  order,
}: {
  order: Order
}) {
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([
    { status: 'PENDING', timestamp: order.createdAt, note: 'Order placed' },
  ])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)

  const sendEmail = async () => {
    setSendingEmail(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/send-email`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to send email')
      toast.success(`Order email sent to ${json?.data?.to ?? 'customer'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setHistoryLoading(true)
    fetch(`/api/orders/${order.id}/history`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled) return
        const entries: StatusHistoryEntry[] = [
          { status: 'PENDING', timestamp: order.createdAt, note: 'Order placed' },
        ]
        const raw: Array<{ toStatus: OrderStatus; createdAt: string; note: string | null }> = Array.isArray(body?.data?.history)
          ? body.data.history
          : []
        for (const entry of raw) {
          entries.push({
            status: entry.toStatus,
            timestamp: entry.createdAt,
            note: entry.note ?? `Status changed to ${ORDER_STATUS_LABELS[entry.toStatus] ?? entry.toStatus}`,
          })
        }
        setStatusHistory(entries)
      })
      .catch(() => {
        // Keep the baseline "Order placed" entry on fetch failure
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [order.id, order.status, order.createdAt])

  return (
    <div className="p-6 bg-[var(--surface-raised)] border-t-2 border-[var(--light)] animate-slide-down">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={sendEmail} disabled={sendingEmail}>
          {sendingEmail ? 'Sending…' : 'Send Email'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.open(`/admin/orders/${order.id}/invoice`, '_blank')}>
          Print Invoice
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Items */}
        <div>
          <h4 className="font-display text-lg text-[var(--ink)] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order Items ({order.items.length})
          </h4>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-white border-2 border-[var(--light)] rounded-card">
                <div className="w-20 h-20 flex-shrink-0 relative">
                  {item.productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover rounded-input"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--light)] rounded-input flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/stickers/skull_sticker.png"
                        alt="Placeholder"
                        className="w-12 h-12 opacity-50"
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--ink)] truncate">{item.productName}</p>
                  <p className="text-sm text-[var(--text-subtle)]">
                    {item.width}″ × {item.height}″ • Qty: {item.quantity}
                  </p>
                  {item.customization && (
                    <p className="text-xs text-[var(--text-subtle)] mt-1">Custom: {JSON.stringify(item.customization).slice(0, 50)}...</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-primary">{formatCurrency(Number(item.unitPrice))}</p>
                  <p className="text-sm text-[var(--text-subtle)]">{formatCurrency(Number(item.totalPrice))} total</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Timeline */}
        <div>
          <h4 className="font-display text-lg text-[var(--ink)] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Status Timeline
            {historyLoading && <span className="text-xs font-normal text-[var(--text-subtle)]">Loading latest…</span>}
          </h4>
          <div className="space-y-4">
            {statusHistory.slice().reverse().map((entry, index) => {
              const isLast = index === statusHistory.length - 1
              const isCurrent = entry.status === order.status
              return (
                <div key={entry.timestamp} className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCurrent ? 'bg-primary text-white' : 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary border-2 border-primary'}
                    `}>
                      {isCurrent ? (
                        <Clock className="w-5 h-5 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    {!isLast && (
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-[var(--light)]" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          entry.status === 'DELIVERED' ? 'success' :
                          entry.status === 'CANCELLED' || entry.status === 'REFUNDED' ? 'error' :
                          entry.status === 'PENDING' ? 'warning' :
                          entry.status === 'SHIPPED' || entry.status === 'READY_TO_SHIP' ? 'secondary' :
                          'primary'
                        }
                        size="sm"
                        dot
                      >
                        {ORDER_STATUS_LABELS[entry.status]}
                      </Badge>
                      <time className="text-sm text-[var(--text-subtle)]">
                        {formatDateTime(entry.timestamp)}
                      </time>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-[var(--text-subtle)]">{entry.note}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tracking Info */}
          {(order.trackingNumber || order.shippedAt || order.deliveredAt) && (
            <div className="mt-6 p-4 bg-white border-2 border-[var(--light)] rounded-card">
              <h5 className="font-medium text-[var(--ink)] mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                Shipping Details
              </h5>
              <div className="space-y-2 text-sm">
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-subtle)]">Tracking Number</span>
                    <span className="font-mono font-medium text-[var(--ink)]">{order.trackingNumber}</span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-subtle)]">Shipped</span>
                    <span className="text-[var(--ink)]">{formatDateTime(order.shippedAt)}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-subtle)]">Delivered</span>
                    <span className="text-[var(--ink)]">{formatDateTime(order.deliveredAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BulkActionBar({
  selectedCount,
  onBulkUpdateStatus,
  onBulkCancel,
  onClearSelection,
}: {
  selectedCount: number
  onBulkUpdateStatus: (status: OrderStatus) => void
  onBulkCancel: () => void
  onClearSelection: () => void
}) {
  const validBulkStatuses: OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'PRINTING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4"
    >
      <div className="bg-[var(--surface-raised)] border-3 border-[var(--ink)] rounded-card shadow-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-medium text-[var(--ink)]">
              {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Clear selection
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Dropdown
              trigger={
                <Button variant="outline" size="sm" className="min-w-[160px] justify-between">
                  <span>Set status...</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              }
              items={validBulkStatuses.map((status) => ({
                value: status,
                label: ORDER_STATUS_LABELS[status],
                icon: STATUS_ICONS[status],
              }))}
              onChange={(value) => onBulkUpdateStatus(value as OrderStatus)}
              placeholder="Bulk update status"
              align="right"
            />
            <Button variant="destructive" size="sm" onClick={onBulkCancel}>
              Cancel Orders
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/orders?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setOrders(json.data.data)
        setTotal(json.data.pagination.total)
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login?callbackUrl=/admin/orders')
      } else {
        toast.error(json.error || 'Failed to load orders')
      }
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter, router])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Status updated to ${ORDER_STATUS_LABELS[newStatus]}`)
        load()
        if (expandedRow === orderId) setExpandedRow(null)
      } else {
        const j = await res.json().catch(() => null)
        toast.error(j?.error || 'Invalid status transition')
      }
    } finally {
      setUpdatingStatus(null)
    }
  }, [load, expandedRow])

  const handleBulkUpdateStatus = useCallback(async (status: OrderStatus) => {
    const ids = Array.from(selectedKeys)
    if (ids.length === 0) return

    try {
      const res = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(`${json.data.updated} order(s) updated to ${ORDER_STATUS_LABELS[status]}`)
        if (json.data.skipped?.length) {
          toast.warning(`${json.data.skipped.length} order(s) skipped (invalid transition)`)
        }
        load()
        setSelectedKeys(new Set())
      } else {
        toast.error(json.error || 'Bulk update failed')
      }
    } catch {
      toast.error('Bulk update failed')
    }
  }, [selectedKeys, load])

  const handleBulkCancel = useCallback(async () => {
    const ids = Array.from(selectedKeys)
    if (ids.length === 0) return

    if (!confirm(`Cancel ${ids.length} order(s)? This will restock items.`)) return

    try {
      // Call cancel for each order (could be optimized with bulk cancel endpoint)
      let success = 0
      for (const id of ids) {
        const res = await fetch(`/api/orders/${id}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Bulk cancelled by admin' }),
        })
        if (res.ok) success++
      }
      toast.success(`${success} order(s) cancelled`)
      load()
      setSelectedKeys(new Set())
    } catch {
      toast.error('Bulk cancel failed')
    }
  }, [selectedKeys, load])

  const handleRowClick = (orderId: string) => {
    setExpandedRow((prev) => (prev === orderId ? null : orderId))
  }

  const handleSelectionChange = (keys: Set<string>) => {
    setSelectedKeys(keys)
    if (keys.size === 0) setExpandedRow(null)
  }

  const columns = useMemo(() => [
    {
      key: 'checkbox',
      header: '',
      width: '50px',
      cell: () => null, // Handled by DataTable's selectable prop
    },
    {
      key: 'orderNumber',
      header: 'Order #',
      accessor: (row: Order) => (
        <span className="font-mono font-medium text-[var(--ink)] cursor-pointer hover:text-primary" onClick={() => handleRowClick(row.id)}>
          {row.orderNumber}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row: Order) => (
        <div onClick={() => handleRowClick(row.id)} className="cursor-pointer">
          <span className="font-medium text-[var(--ink)]">{row.user?.name ?? 'Guest'}</span>
          <br />
          <span className="text-sm text-[var(--text-subtle)]">{row.user?.email}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: Order) => (
        <StatusTransitionDropdown
          currentStatus={row.status}
          orderId={row.id}
          onStatusChange={handleStatusChange}
          disabled={updatingStatus === row.id}
        />
      ),
      sortable: true,
      width: '180px',
    },
    {
      key: 'total',
      header: 'Total',
      accessor: (row: Order) => (
        <span className="font-display text-primary">{formatCurrency(Number(row.total))}</span>
      ),
      sortable: true,
      align: 'right' as const,
      width: '120px',
    },
    {
      key: 'payment',
      header: 'Payment',
      accessor: (row: Order) => (
        <Badge variant={row.paymentStatus === 'PAID' ? 'success' : row.paymentStatus === 'FAILED' ? 'error' : 'warning'} size="sm" dot>
          {row.paymentMethod} - {row.paymentStatus}
        </Badge>
      ),
      width: '140px',
    },
    {
      key: 'delivery',
      header: 'Delivery',
      accessor: (row: Order) => (
        <Badge variant="outline" size="sm">
          {row.deliveryZone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}
        </Badge>
      ),
      width: '140px',
    },
    {
      key: 'createdAt',
      header: 'Date',
      accessor: (row: Order) => (
        <span className="text-sm text-[var(--text-subtle)] whitespace-nowrap">{formatDate(row.createdAt)}</span>
      ),
      sortable: true,
      width: '140px',
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row: Order) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${row.id}`) }}>
            View
          </Button>
          <Tooltip content="Expand for details" position="top">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRowClick(row.id) }}
              className="p-2 rounded-input text-[var(--text-subtle)] hover:text-primary hover:bg-[var(--light)] transition-colors"
              aria-label="Expand row"
            >
              {expandedRow === row.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </Tooltip>
        </div>
      ),
      width: '100px',
    },
  ], [expandedRow, handleStatusChange, updatingStatus, router])

  return (
  <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Orders</h1>
            <p className="text-[var(--text-subtle)]">Manage and track all orders</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams()
              if (search) params.set('search', search)
              if (statusFilter) params.set('status', statusFilter)
              const query = params.toString()
              window.location.href = `/api/orders/export${query ? `?${query}` : ''}`
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <SearchInput
                id="order-search"
                placeholder="Search order #, customer..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                aria-label="Search orders"
              />
            </div>
            <Dropdown
              trigger={
                <Button variant="outline" className="w-48 justify-between">
                  <span>{statusFilter ? ORDER_STATUS_LABELS[statusFilter as OrderStatus] : 'All Status'}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              }
              items={[
                { value: '', label: 'All Status' },
                ...STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] })),
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e); setPage(1) }}
              placeholder="Filter by status"
              align="right"
            />
          </div>
        </Card>

        <Card className="relative">
          <DataTable<Order>
            columns={columns}
            data={orders}
            keyExtractor={(row) => row.id}
            selectable={true}
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
            loading={loading}
            emptyMessage="No orders found"
            rowClassName={(row) => expandedRow === row.id ? 'bg-[var(--surface-raised)]' : ''
            }
          />

          {/* Expanded Row Rendering */}
          <AnimatePresence>
            {expandedRow && orders.find((o) => o.id === expandedRow) && (
              <motion.div
                key={expandedRow}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: 'top' }}
                className="absolute left-0 right-0 top-full z-10"
              >
                <ExpandedRowContent order={orders.find((o) => o.id === expandedRow)!} />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Bulk Action Bar */}
        {selectedKeys.size > 0 && (
          <BulkActionBar
            selectedCount={selectedKeys.size}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onBulkCancel={handleBulkCancel}
            onClearSelection={() => setSelectedKeys(new Set())}
          />
        )}
      </div>
    </div>
  )
}