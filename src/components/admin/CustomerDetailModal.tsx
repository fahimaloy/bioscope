'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { MapPin, Package, User, ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomerStats {
  orderCount: number
  totalSpent: number
  averageOrderValue: number
}

interface AddressItem {
  id: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  district: string
  division: string
  postalCode?: string | null
  country: string
  isDefault: boolean
  deliveryZone: string
}

interface OrderItem {
  id: string
  orderNumber: string
  status: string
  total: string | number
  createdAt: string
  items: { id: string }[]
}

interface CustomerDetail {
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
    avatar: string | null
    spendTier: string | null
    createdAt: string
  }
  addresses: AddressItem[]
  stats: CustomerStats
  orders: OrderItem[]
  ordersPagination: { page: number; limit: number; total: number; totalPages: number }
}

const SPEND_TIER_OPTIONS = ['New', 'Bronze', 'Silver', 'Gold', 'VIP']

export function CustomerDetailModal({
  customerId,
  onClose,
  onChanged,
}: {
  customerId: string | null
  onClose: () => void
  onChanged?: () => void
}) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [ordersPage, setOrdersPage] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [spendTier, setSpendTier] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(
    async (page = 1) => {
      if (!customerId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/customers/${customerId}?page=${page}&limit=5`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load customer')
        setDetail(json.data)
        setOrdersPage(page)
        setName(json.data.user.name ?? '')
        setPhone(json.data.user.phone ?? '')
        setSpendTier(json.data.user.spendTier ?? '')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load customer')
      } finally {
        setLoading(false)
      }
    },
    [customerId]
  )

  useEffect(() => {
    if (customerId) load(1)
    else setDetail(null)
  }, [customerId, load])

  const save = async () => {
    if (!customerId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() === '' ? null : phone.trim(),
          spendTier: spendTier === '' ? null : spendTier,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save customer')
      toast.success('Customer updated')
      onChanged?.()
      load(ordersPage)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  const profile = detail?.user

  return (
    <Modal isOpen={!!customerId} onClose={onClose} title={profile?.name ?? 'Customer details'} description={profile?.email} size="xl">
      {loading && !detail && <div className="py-12 text-center text-[var(--text-subtle)]">Loading customer…</div>}
      {detail && profile && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Orders', value: String(detail.stats.orderCount) },
              { label: 'Total spent', value: formatCurrency(detail.stats.totalSpent) },
              { label: 'Avg. order', value: formatCurrency(detail.stats.averageOrderValue) },
            ].map((s) => (
              <Card key={s.label} variant="doodle" padding="md" className="text-center">
                <p className="text-2xl font-display text-primary">{s.value}</p>
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">{s.label}</p>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="profile" variant="underline">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="addresses">Addresses ({detail.addresses.length})</TabsTrigger>
              <TabsTrigger value="orders">Orders ({detail.stats.orderCount})</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center font-display text-xl">
                    {profile.name?.charAt(0)?.toUpperCase() ?? profile.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--ink)] flex items-center gap-2">
                      <User className="w-4 h-4" /> Customer since {formatDate(profile.createdAt)}
                    </p>
                    <p className="text-sm text-[var(--text-subtle)]">{profile.email}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
                  <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXX-XXXXXX" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--ink)]" htmlFor="spend-tier">Spend tier</label>
                  <select
                    id="spend-tier"
                    value={spendTier}
                    onChange={(e) => setSpendTier(e.target.value)}
                    className="mt-1 w-full rounded-input border-2 border-[var(--light)] bg-[var(--surface-raised)] px-3 py-2 text-body text-[var(--ink)]"
                  >
                    <option value="">Auto (derived from spend)</option>
                    {SPEND_TIER_OPTIONS.map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[var(--text-subtle)]">Manual override wins over the derived tier everywhere tiers are shown.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>Close</Button>
                  <Button onClick={save} loading={saving}>Save changes</Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="addresses">
              <div className="space-y-3 pt-2">
                {detail.addresses.length === 0 && <p className="text-[var(--text-subtle)]">No saved addresses.</p>}
                {detail.addresses.map((a) => (
                  <Card key={a.id} variant="default" padding="md">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-0.5 text-primary" />
                      <div className="text-sm">
                        <p className="font-medium text-[var(--ink)] flex items-center gap-2">
                          {a.name} · {a.phone}
                          {a.isDefault && <Badge variant="success" size="sm">Default</Badge>}
                        </p>
                        <p className="text-[var(--text-subtle)]">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                        <p className="text-[var(--text-subtle)]">{a.city}, {a.district}, {a.division}{a.postalCode ? ` ${a.postalCode}` : ''} · {a.country}</p>
                        <p className="text-xs uppercase text-[var(--text-subtle)]">Delivery zone: {a.deliveryZone}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="orders">
              <div className="space-y-3 pt-2">
                {detail.orders.length === 0 && <p className="text-[var(--text-subtle)]">No orders yet.</p>}
                {detail.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 border-2 border-[var(--light)] rounded-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-[var(--ink)]">{o.orderNumber}</p>
                        <p className="text-xs text-[var(--text-subtle)]">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={o.status} size="sm" />
                      <span className="font-display text-primary">{formatCurrency(Number(o.total))}</span>
                    </div>
                  </div>
                ))}
                {detail.ordersPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <Button size="sm" variant="outline" disabled={ordersPage <= 1} onClick={() => load(ordersPage - 1)}>
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <span className="text-sm text-[var(--text-subtle)]">
                      Page {detail.ordersPagination.page} of {detail.ordersPagination.totalPages}
                    </span>
                    <Button size="sm" variant="outline" disabled={ordersPage >= detail.ordersPagination.totalPages} onClick={() => load(ordersPage + 1)}>
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Modal>
  )
}
