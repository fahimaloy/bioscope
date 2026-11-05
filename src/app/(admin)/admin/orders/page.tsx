'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { OrderStatusBadge, OrderStatusSelector } from '@/components/admin/OrderStatusBadge'
import { Select } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search } from 'lucide-react'

const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PRINTING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const columns = [
  { key: 'orderNumber', header: 'Order #', accessor: (row: any) => <span className="font-mono font-medium">{row.orderNumber}</span>, sortable: true },
  { key: 'customer', header: 'Customer', accessor: (row: any) => <div><span className="font-medium">{row.user?.name ?? '—'}</span><br /><span className="text-sm text-[var(--ink)]/50">{row.user?.email}</span></div> },
  { key: 'status', header: 'Status', accessor: (row: any) => <OrderStatusBadge status={row.status as any} size="sm" />, sortable: true },
  { key: 'total', header: 'Total', accessor: (row: any) => <span className="font-display text-primary">{formatCurrency(Number(row.total))}</span>, sortable: true },
  { key: 'payment', header: 'Payment', accessor: (row: any) => <Badge variant={row.paymentStatus === 'PAID' ? 'success' : 'warning'} size="sm">{row.paymentMethod} - {row.paymentStatus}</Badge> },
  { key: 'delivery', header: 'Delivery', accessor: (row: any) => <Badge variant="outline" size="sm">{row.deliveryZone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}</Badge> },
  { key: 'createdAt', header: 'Date', accessor: (row: any) => <span className="text-sm text-[var(--ink)]/60">{formatDate(row.createdAt)}</span>, sortable: true },
]

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pager, setPager] = useState({ total: 0, pageSize: 10 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', sortBy: 'createdAt', sortOrder: 'desc' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/orders?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setOrders(json.data.data)
        setPager({ total: json.data.pagination.total, pageSize: json.data.pagination.limit })
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login?callbackUrl=/admin/orders')
      } else {
        toast.error(json.error || 'Failed to load orders')
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, router])

  useEffect(() => {
    load()
  }, [load])

  const changeStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success('Status updated')
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'Invalid status transition')
    }
  }

  const tableColumns = [
    ...columns,
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/orders/${row.id}`)}>View</Button>
          <OrderStatusSelector currentStatus={row.status} onChange={(s) => changeStatus(row.id, s)} />
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Orders</h1>
            <p className="text-[var(--ink)]/60">Manage and track all orders</p>
          </div>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/40" />
              <input
                type="text"
                placeholder="Search order #, customer..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              options={[{ value: '', label: 'All Status' }, ...statuses.map((s) => ({ value: s, label: s }))]}
              placeholder="Filter by status"
              className="w-48"
            />
          </div>
        </Card>

        <Card>
          <DataTable
            columns={tableColumns}
            data={orders}
            keyExtractor={(row) => row.id}
            loading={loading}
            pagination={{
              page,
              pageSize: pager.pageSize,
              total: pager.total,
              onPageChange: setPage,
              onPageSizeChange: () => {},
            }}
          />
        </Card>
      </div>
    </div>
  )
}
