'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Select } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Eye, DollarSign, CheckCircle, XCircle } from 'lucide-react'

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'accent' | 'primary' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  PRICED: 'accent',
  ORDERED: 'primary',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusColors[status] || 'default'} size="sm">
      {status}
    </Badge>
  )
}

export default function CustomRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
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
      const res = await fetch(`/api/custom-requests?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setRequests(json.data.data)
        setPager({ total: json.data.pagination.total, pageSize: json.data.pagination.limit })
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login?callbackUrl=/admin/custom-requests')
      } else {
        toast.error(json.error || 'Failed to load requests')
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, router])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/custom-requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(`Marked ${status}`)
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'Failed to update status')
    }
  }

  const price = async (row: any) => {
    const input = window.prompt('Quoted price (BDT):', row.quotedPrice ? String(row.quotedPrice) : '')
    if (!input) return
    const quotedPrice = Number(input)
    if (!quotedPrice || quotedPrice <= 0) return toast.error('Enter a valid price')
    const res = await fetch(`/api/custom-requests/${row.id}/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotedPrice }),
    })
    if (res.ok) {
      toast.success('Price quoted')
      load()
    } else {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'Failed to quote price')
    }
  }

  const columns: Column<any>[] = [
    {
      key: 'image',
      header: 'Design',
      cell: ({ row }: { row: any }) => (
        <img src={row.imageUrl} alt={row.originalName} className="w-16 h-16 rounded-input object-cover border border-[var(--ink)]/20" />
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: ({ row }: { row: any }) => (
        <div>
          <span className="font-medium">{row.user?.name ?? '—'}</span>
          <br />
          <span className="text-sm text-[var(--ink)]/50">{row.user?.email}</span>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm">
          <span className="font-medium">{row.originalName}</span>
          <br />
          {row.width}×{row.height}cm • {row.quantity} pcs
          <br />
          {row.material} / {row.finish} / {String(row.cutType).replace('_', ' ')}
          {row.quotedPrice ? <><br /><span className="font-display text-primary">{formatCurrency(Number(row.quotedPrice))}</span></> : null}
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: ({ row }: { row: any }) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Submitted', accessor: (row: any) => formatDate(row.createdAt), sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => window.open(row.imageUrl, '_blank')} aria-label="View design"><Eye className="w-4 h-4" /></Button>
          {row.status === 'PENDING' && (
            <>
              <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => setStatus(row.id, 'APPROVED')} aria-label="Approve"><CheckCircle className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setStatus(row.id, 'REJECTED')} aria-label="Reject"><XCircle className="w-4 h-4" /></Button>
            </>
          )}
          {(row.status === 'APPROVED' || row.status === 'PENDING') && (
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => price(row)} aria-label="Quote price"><DollarSign className="w-4 h-4" /></Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Custom Requests</h1>
            <p className="text-[var(--ink)]/60">Review and manage custom sticker requests</p>
          </div>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/40" />
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              options={[{ value: '', label: 'All Status' }, ...['PENDING', 'APPROVED', 'REJECTED', 'PRICED', 'ORDERED'].map((s) => ({ value: s, label: s }))]}
              placeholder="Filter by status"
              className="w-48"
            />
          </div>
        </Card>

        <Card>
          <DataTable
            columns={columns}
            data={requests}
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
