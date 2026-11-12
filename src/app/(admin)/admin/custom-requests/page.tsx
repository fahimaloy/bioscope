'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Button,
  Badge,
  Card,
  DataTable,
  Modal,
  Input,
  Textarea,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Eye, DollarSign, CheckCircle, XCircle, Edit2 } from 'lucide-react'

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

interface CustomRequest {
  id: string
  user: { name: string | null; email: string } | null
  imageUrl: string
  originalName: string
  width: number
  height: number
  quantity: number
  material: string
  finish: string
  cutType: string
  status: string
  quotedPrice: number | null
  adminNotes: string | null
  createdAt: string
}

export default function CustomRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<CustomRequest[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pager, setPager] = useState({ total: 0, pageSize: 10 })
  const [loading, setLoading] = useState(true)

  // Modal states
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageModalSrc, setImageModalSrc] = useState('')
  const [imageModalAlt, setImageModalAlt] = useState('')

  // Pricing modal states
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [priceModalRequest, setPriceModalRequest] = useState<CustomRequest | null>(null)
  const [quotedPrice, setQuotedPrice] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [priceLoading, setPriceLoading] = useState(false)

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

  const handleImageClick = (src: string, alt: string) => {
    setImageModalSrc(src)
    setImageModalAlt(alt)
    setImageModalOpen(true)
  }

  const handlePriceClick = (request: CustomRequest) => {
    setPriceModalRequest(request)
    setQuotedPrice(request.quotedPrice ? String(request.quotedPrice) : '')
    setAdminNotes(request.adminNotes || '')
    setPriceModalOpen(true)
  }

  const handlePriceSubmit = async () => {
    if (!priceModalRequest) return
    const price = Number(quotedPrice)
    if (!price || price <= 0) return toast.error('Enter a valid price')

    setPriceLoading(true)
    try {
      const res = await fetch(`/api/custom-requests/${priceModalRequest.id}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotedPrice: price, adminNotes }),
      })
      if (res.ok) {
        toast.success('Price quoted')
        setPriceModalOpen(false)
        load()
      } else {
        const j = await res.json().catch(() => null)
        toast.error(j?.error || 'Failed to quote price')
      }
    } finally {
      setPriceLoading(false)
    }
  }

  const setStatus = useCallback(async (id: string, status: string) => {
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
  }, [load])

  const columns = useMemo((): import('@/components/ui/DataTable').Column<CustomRequest>[] => [
    {
      key: 'image',
      header: 'Design',
      width: '100px',
      cell: (row: CustomRequest) => (
        <div className="relative">
          <img
            src={row.imageUrl}
            alt={row.originalName}
            className="w-20 h-20 rounded-input object-cover border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] cursor-zoom-in hover:opacity-80 transition-opacity"
            onClick={() => handleImageClick(row.imageUrl, row.originalName)}
            loading="lazy"
          />
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      width: '200px',
      cell: (row: CustomRequest) => (
        <div>
          <span className="font-medium text-[var(--ink)]">{row.user?.name ?? '—'}</span>
          <br />
          <span className="text-sm text-[var(--text-subtle)]">{row.user?.email}</span>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      cell: (row: CustomRequest) => (
        <div className="text-sm space-y-2">
          <span className="font-medium text-[var(--ink)]">{row.originalName}</span>
          <div className="flex flex-wrap gap-3 text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
            <span>{row.width}×{row.height}cm</span>
            <span>{row.quantity} pcs</span>
            <span>{row.material}</span>
            <span>{row.finish}</span>
            <span>{String(row.cutType).replace('_', ' ')}</span>
          </div>
          {row.quotedPrice && (
            <span className="font-display text-primary block">{formatCurrency(Number(row.quotedPrice))}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      cell: (row: CustomRequest) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      accessor: (row: CustomRequest) => formatDate(row.createdAt),
      sortable: true,
      width: '140px',
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '280px',
      cell: (row: CustomRequest) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleImageClick(row.imageUrl, row.originalName)}
            aria-label="View design"
            className="text-[var(--text-subtle)] hover:text-primary"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {row.status === 'PENDING' && (
            <>
              <Button
                variant="doodle"
                size="sm"
                onClick={() => setStatus(row.id, 'APPROVED')}
                aria-label="Approve request"
                className="text-xs"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="doodle-outline"
                size="sm"
                onClick={() => setStatus(row.id, 'REJECTED')}
                aria-label="Reject request"
                className="text-xs text-[var(--error)] border-[var(--error)] hover:bg-[var(--error)] hover:text-white"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}

          {(row.status === 'APPROVED' || row.status === 'PENDING') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePriceClick(row)}
              aria-label="Quote price"
              className="text-xs"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              {row.quotedPrice ? 'Update Price' : 'Quote Price'}
            </Button>
          )}

          {row.status === 'PRICED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePriceClick(row)}
              aria-label="Edit price"
              className="text-xs text-[var(--text-subtle)] hover:text-primary"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ], [setStatus])

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Custom Requests</h1>
            <p className="text-[var(--text-subtle)]">Review and manage custom sticker requests</p>
          </div>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input focus:border-primary focus:shadow-input text-body"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="w-48 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-white py-2 px-4 text-body focus:border-primary focus:shadow-input focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="PRICED">PRICED</option>
              <option value="ORDERED">ORDERED</option>
            </select>
          </div>
        </Card>

        <Card>
          <DataTable<CustomRequest>
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
            emptyMessage="No custom requests found"
          />
        </Card>
      </div>

      {/* Image Preview Modal */}
      <Modal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        size="lg"
        showCloseButton={true}
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        <div className="text-center">
          <img
            src={imageModalSrc}
            alt={imageModalAlt}
            className="max-w-full max-h-[70vh] mx-auto rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)]"
          />
          <p className="mt-4 text-body text-[var(--text-subtle)]">{imageModalAlt}</p>
        </div>
      </Modal>

      {/* Price Quote Modal */}
      <Modal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        title="Quote Price"
        description="Set the quoted price and add admin notes for this custom request"
        size="md"
      >
        <div className="space-y-6">
          <Input
            label="Quoted Price (BDT)"
            type="number"
            placeholder="Enter price"
            value={quotedPrice}
            onChange={(e) => setQuotedPrice(e.target.value)}
            className="font-display text-xl"
            required
            min="1"
            step="1"
          />
          <Textarea
            label="Admin Notes (optional)"
            placeholder="Add notes for the customer..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--light)]">
            <Button variant="secondary" onClick={() => setPriceModalOpen(false)} disabled={priceLoading}>
              Cancel
            </Button>
            <Button variant="doodle" onClick={handlePriceSubmit} loading={priceLoading} disabled={priceLoading}>
              Save Quote
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}