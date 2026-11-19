'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAdminRealtime, type AdminLiveEvent } from '@/lib/hooks'
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
import { Eye, DollarSign, CheckCircle, XCircle, Edit2, Download } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'accent' | 'primary' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  PRICED: 'accent',
  REVISION_REQUESTED: 'warning',
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
  userId: string
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

  // Create-order-from-request modal
  const [orderModalRequest, setOrderModalRequest] = useState<CustomRequest | null>(null)
  const [orderProducts, setOrderProducts] = useState<Array<{ id: string; name: string; allowedDimensions: { width: number; height: number }[] }>>([])
  const [orderAddresses, setOrderAddresses] = useState<Array<{ id: string; name: string; city: string; district: string }>>([])
  const [orderForm, setOrderForm] = useState({
    productId: '',
    addressId: '',
    width: '',
    height: '',
    quantity: '',
    paymentMethod: 'COD',
    notes: '',
  })
  const [orderLoading, setOrderLoading] = useState(false)

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

  // Realtime: a customer submitting or an admin pricing a request refreshes
  // the list so the queue never shows stale numbers.
  const handleLiveEvent = useCallback(
    (event: AdminLiveEvent) => {
      if (event.kind === 'custom_request.submitted') {
        toast.info(`New custom request from ${event.data.customerName}`)
        load()
      } else if (event.kind === 'custom_request.priced') {
        load()
      }
    },
    [load]
  )

  useAdminRealtime(handleLiveEvent)

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

  const openOrderModal = async (request: CustomRequest) => {
    setOrderModalRequest(request)
    setOrderForm({
      productId: '',
      addressId: '',
      width: String(request.width),
      height: String(request.height),
      quantity: String(request.quantity),
      paymentMethod: 'COD',
      notes: '',
    })
    try {
      const [productsRes, customerRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch(`/api/customers/${request.userId}`),
      ])
      const productsJson = await productsRes.json().catch(() => null)
      const customerJson = await customerRes.json().catch(() => null)
      const products = productsJson?.success ? (productsJson.data?.data ?? []) : []
      setOrderProducts(
        products.map((p: { id: string; name: string; allowedDimensions?: { width: number; height: number }[] }) => ({
          id: p.id,
          name: p.name,
          allowedDimensions: p.allowedDimensions ?? [],
        }))
      )
      setOrderAddresses(customerJson?.success ? (customerJson.data?.addresses ?? []) : [])
    } catch {
      toast.error('Could not load the products and addresses for this request')
    }
  }

  const handleOrderSubmit = async () => {
    if (!orderModalRequest) return
    const payload = {
      productId: orderForm.productId,
      addressId: orderForm.addressId,
      width: Number(orderForm.width),
      height: Number(orderForm.height),
      quantity: Number(orderForm.quantity),
      paymentMethod: orderForm.paymentMethod,
      notes: orderForm.notes || undefined,
    }
    if (!payload.productId) return toast.error('Choose a product')
    if (!payload.addressId) return toast.error('Choose a shipping address')

    setOrderLoading(true)
    try {
      const res = await fetch(`/api/custom-requests/${orderModalRequest.id}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not create the order')
      toast.success(`Order ${json.data.order.orderNumber} created`)
      setOrderModalRequest(null)
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create the order')
    } finally {
      setOrderLoading(false)
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <span className="font-display text-[var(--brand)] block">{formatCurrency(Number(row.quotedPrice))}</span>
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
            className="text-[var(--text-subtle)] hover:text-[var(--brand)]"
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
                className="text-xs text-[var(--error)] border-[var(--error)] hover:bg-[var(--error)] hover:text-[var(--on-brand)]"
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

          {(row.status === 'PENDING' || row.status === 'APPROVED' || row.status === 'PRICED') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdminNotes('')
                setStatus(row.id, 'REVISION_REQUESTED')
              }}
              aria-label="Request revision"
              className="text-xs text-[var(--text-subtle)] hover:text-[var(--brand)]"
            >
              Request Revision
            </Button>
          )}

          {row.status === 'PRICED' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePriceClick(row)}
                aria-label="Edit price"
                className="text-xs text-[var(--text-subtle)] hover:text-[var(--brand)]"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="doodle"
                size="sm"
                onClick={() => openOrderModal(row)}
                aria-label="Create order from this request"
                className="text-xs"
              >
                Create Order
              </Button>
            </>
          )}
        </div>
      ),
    },
  ], [setStatus])

  return (
  <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-[var(--brand)]">Custom Requests</h1>
            <p className="text-[var(--text-subtle)]">Review and manage custom sticker requests</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams()
              if (search) params.set('search', search)
              if (statusFilter) params.set('status', statusFilter)
              const query = params.toString()
              window.location.href = `/api/custom-requests/export${query ? `?${query}` : ''}`
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
                placeholder="Search requests..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                aria-label="Search custom requests"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="w-48 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-[var(--surface-raised)] py-2 px-4 text-body focus:border-[var(--brand)] focus:shadow-input focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="PRICED">PRICED</option>
              <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* Create Order from Request Modal */}
      <Modal
        isOpen={orderModalRequest !== null}
        onClose={() => setOrderModalRequest(null)}
        title="Create Order from Request"
        description={
          orderModalRequest
            ? `Design ${orderModalRequest.width}×${orderModalRequest.height} cm · qty ${orderModalRequest.quantity} · ${orderModalRequest.material}/${orderModalRequest.finish}/${orderModalRequest.cutType}. Prices are recomputed from the product, never taken from this form.`
            : undefined
        }
        size="lg"
      >
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-[var(--ink)]">Product this request is produced as</span>
            <select
              value={orderForm.productId}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, productId: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-[var(--surface-raised)] text-body focus:border-[var(--brand)] focus:outline-none"
            >
              <option value="">Select a product…</option>
              {orderProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--ink)]">Shipping address</span>
            <select
              value={orderForm.addressId}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, addressId: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-[var(--surface-raised)] text-body focus:border-[var(--brand)] focus:outline-none"
            >
              <option value="">Select an address…</option>
              {orderAddresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.name} — {address.city}, {address.district}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Width (cm)"
              type="number"
              value={orderForm.width}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, width: e.target.value }))}
            />
            <Input
              label="Height (cm)"
              type="number"
              value={orderForm.height}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, height: e.target.value }))}
            />
            <Input
              label="Quantity"
              type="number"
              value={orderForm.quantity}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, quantity: e.target.value }))}
            />
          </div>

          {(() => {
            const product = orderProducts.find((p) => p.id === orderForm.productId)
            const allowed = product?.allowedDimensions ?? []
            const width = Number(orderForm.width)
            const height = Number(orderForm.height)
            const match = allowed.find((d) => d.width === width && d.height === height)
            return product ? (
              <p className={match ? 'text-sm text-[var(--success)]' : 'text-sm text-[var(--warning)]'}>
                {match
                  ? 'Size is available for this product.'
                  : `Not an offered size. Available: ${allowed.map((d) => `${d.width}×${d.height}`).join(', ') || 'none'}`}
              </p>
            ) : null
          })()}

          <label className="block">
            <span className="text-sm font-medium text-[var(--ink)]">Payment method</span>
            <select
              value={orderForm.paymentMethod}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-[var(--surface-raised)] text-body focus:border-[var(--brand)] focus:outline-none"
            >
              <option value="COD">Cash on delivery</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
            </select>
          </label>

          <Textarea
            label="Order notes (optional)"
            value={orderForm.notes}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--light)]">
            <Button variant="secondary" onClick={() => setOrderModalRequest(null)} disabled={orderLoading}>
              Cancel
            </Button>
            <Button variant="doodle" onClick={handleOrderSubmit} loading={orderLoading} disabled={orderLoading}>
              Create Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}