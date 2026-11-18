'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, User, DollarSign, ShoppingBag, Filter, Download } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { CustomerDetailModal } from '@/components/admin/CustomerDetailModal'
import { motion } from 'framer-motion'
import { SketchUnderline, DoodleShape, StickerPeel } from '@/components/decorative/DoodleElements'
import { CounterAnimation } from '@/components/animations/CounterAnimation'
import { cn, formatNumber } from '@/lib/utils'

/** Shape of a customer row as returned by /api/customers (includes computed fields). */
interface CustomerRow {
  id: string
  name: string | null
  email: string
  phone: string | null
  orderCount: number
  totalSpent: number | string
  spendTier: string | null
  latestOrderStatus: string | null
  createdAt: string
}

const spendTiers = [
  { min: 0, max: 1000, label: 'New', variant: 'default' as const, icon: '🌱' },
  { min: 1000, max: 5000, label: 'Bronze', variant: 'secondary' as const, icon: '🥉' },
  { min: 5000, max: 20000, label: 'Silver', variant: 'accent' as const, icon: '🥈' },
  { min: 20000, max: 50000, label: 'Gold', variant: 'warning' as const, icon: '🥇' },
  { min: 50000, max: Infinity, label: 'VIP', variant: 'primary' as const, icon: '💎' },
]

function SpendBadge({ totalSpent, overrideTier }: { totalSpent: number; overrideTier?: string | null }) {
  const override = overrideTier ? spendTiers.find(t => t.label === overrideTier) : undefined
  const tier = override ?? (spendTiers.find(t => totalSpent >= t.min && totalSpent < t.max) || spendTiers[0])
  return (
    <Badge variant={tier.variant} size="sm" className="gap-1.5">
      <span>{tier.icon}</span>
      <span>{tier.label}</span>
    </Badge>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} size="sm" />
}

const columns = [
  { 
    key: 'customer', 
    header: 'Customer', 
    width: '280px',
    cell: (row: CustomerRow) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center font-display text-sm">
          {row.name?.charAt(0)?.toUpperCase() || row.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium text-body text-[var(--ink)]">{row.name ?? '—'}</p>
          <p className="text-sm text-[var(--text-subtle)] truncate max-w-xs">{row.email}</p>
        </div>
      </div>
    ), 
    sortable: true 
  },
  { 
    key: 'phone', 
    header: 'Phone', 
    accessor: (row: CustomerRow) => (
      <span className="text-sm text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">{row.phone ?? '—'}</span>
    ),
    sortable: true,
    width: '160px',
  },
  { 
    key: 'orders', 
    header: 'Orders', 
    width: '100px',
    accessor: (row: CustomerRow) => (
      <span className="font-medium text-[var(--ink)]">{row.orderCount}</span>
    ), 
    sortable: true 
  },
  { 
    key: 'spent', 
    header: 'Total Spent', 
    width: '160px',
    accessor: (row: CustomerRow) => (
      <span className="font-display text-primary">{formatCurrency(row.totalSpent)}</span>
    ), 
    sortable: true 
  },
  { 
    key: 'tier', 
    header: 'Tier', 
    width: '120px',
    accessor: (row: CustomerRow) => <SpendBadge totalSpent={Number(row.totalSpent)} overrideTier={row.spendTier} />,
  },
  { 
    key: 'status', 
    header: 'Latest Order', 
    width: '140px',
    accessor: (row: CustomerRow) => row.latestOrderStatus ? <OrderStatusBadge status={row.latestOrderStatus} /> : <span className="text-[var(--text-subtle)]">—</span>,
  },
  { 
    key: 'joined', 
    header: 'Joined', 
    width: '140px',
    accessor: (row: CustomerRow) => (
      <span className="text-sm text-[var(--text-subtle)]">{formatDate(row.createdAt)}</span>
    ), 
    sortable: true 
  },
]

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Array<{ id: string; name: string | null; email: string; phone: string | null; orderCount: number; totalSpent: number; spendTier: string | null; latestOrderStatus: string | null; createdAt: string }>>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pager, setPager] = useState({ total: 0, pageSize: 20 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  const viewColumns = useMemo(
    () => [
      ...columns,
      {
        key: 'view',
        header: '',
        cell: (row: CustomerRow) => (
          <Button size="sm" variant="outline" onClick={() => setSelectedCustomerId(row.id)}>
            View
          </Button>
        ),
      },
    ],
    []
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/customers?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setCustomers(json.data.data)
        setPager({ total: json.data.pagination.total, pageSize: json.data.pagination.limit })
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login?callbackUrl=/admin/customers')
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, router])

  useEffect(() => {
    load()
  }, [load])

  const totalRevenue = customers.reduce((s, c) => s + Number(c.totalSpent), 0)
  const totalOrders = customers.reduce((s, c) => s + c.orderCount, 0)

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl text-primary">Customers</h1>
            <p className="text-[var(--text-subtle)]">Manage and analyze your customer base</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const qs = search ? `?search=${encodeURIComponent(search)}` : ''
                window.location.href = `/api/customers/export${qs}`
              }}
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Badge variant="doodle" size="sm" className="animate-pulse-soft">{pager.total} Total</Badge>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard 
            label="Total Customers" 
            value={pager.total} 
            icon={<Users className="w-5 h-5" />} 
            color="var(--primary)" 
            iconBg="bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]"
            index={0}
          />
          <StatCard 
            label="On This Page" 
            value={customers.length} 
            icon={<User className="w-5 h-5" />} 
            color="var(--secondary)" 
            iconBg="bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)] text-[var(--secondary)]"
            index={1}
          />
          <StatCard 
            label="Revenue (page)" 
            value={formatCurrency(totalRevenue)} 
            icon={<DollarSign className="w-5 h-5" />} 
            color="var(--success)" 
            iconBg="bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]"
            index={2}
          />
          <StatCard 
            label="Avg. Order Value" 
            value={customers.length ? formatCurrency(totalRevenue / Math.max(1, totalOrders)) : '—'} 
            icon={<ShoppingBag className="w-5 h-5" />} 
            color="var(--accent)" 
            iconBg="bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]"
            index={3}
          />
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
        >
          <Card variant="doodle" padding="md" className="relative overflow-visible">
            <StickerPeel />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 min-w-[250px] max-w-md">
                <SearchInput
                  placeholder="Search name, email, phone..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  aria-label="Search customers"
                />
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
            
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                style={{ transformOrigin: 'top' }}
                className="mt-4 pt-4 border-t border-[var(--light)]"
              >
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">Spend Tier:</span>
                    <select className="px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-white text-body focus:border-primary focus:shadow-input focus:outline-none">
                      <option value="">All Tiers</option>
                      {spendTiers.map(t => (
                        <option key={t.label} value={t.label}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">Min Orders:</span>
                    <input type="number" min="0" className="w-24 px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-white text-body focus:border-primary focus:shadow-input focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">Date From:</span>
                    <input type="date" className="px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-white text-body focus:border-primary focus:shadow-input focus:outline-none" />
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Customers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 15 }}
        >
          <Card variant="doodle" padding="none" className="relative overflow-visible">
            <StickerPeel />
            <DataTable
              columns={viewColumns}
              data={customers}
              keyExtractor={(row) => row.id}
              loading={loading}
              emptyMessage="No customers found. Start selling to see customers here!"
              pagination={{
                page,
                pageSize: pager.pageSize,
                total: pager.total,
                onPageChange: setPage,
                onPageSizeChange: () => {},
              }}
              rowClassName={(row) => {
                const tier = spendTiers.find(t => Number(row.totalSpent) >= t.min && Number(row.totalSpent) < t.max) || spendTiers[0]
                return tier.min >= 20000 ? 'border-l-4 border-l-[var(--warning)]' : ''
              }}
            />
          </Card>
        </motion.div>

        <CustomerDetailModal customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} onChanged={load} />

        {/* Decorative elements */}
        <DoodleShape size="xl" color="primary" animation="float" className="absolute bottom-10 right-10 opacity-5 pointer-events-none" style={{ zIndex: -1 }} />
        <DoodleShape size="lg" color="accent" animation="wobble" className="absolute top-20 left-10 opacity-5 pointer-events-none" style={{ zIndex: -1 }} />
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  iconBg: string
  index: number
}

function StatCard({ label, value, icon, color: _color, iconBg, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 100, damping: 15 }}
    >
      <Card variant="doodle" hover={true} padding="md" className="relative overflow-visible group">
        <StickerPeel />
        <div className="flex items-center justify-between mb-2">
          <div className={cn('w-10 h-10 rounded-input flex items-center justify-center animate-float-gentle transition-all duration-300 group-hover:scale-110', iconBg)}>
            {icon}
          </div>
        </div>
        <CounterAnimation
          target={typeof value === 'number' ? value : 0}
          duration={1200}
          className="text-2xl font-display text-[var(--ink)] mb-1"
          format={(v) => typeof value === 'string' ? value : formatNumber(v)}
        />
        <SketchUnderline className="inline-block">
          <p className="font-medium text-body text-[color-mix(in_srgb,var(--ink)_70%,transparent)] text-sm">{label}</p>
        </SketchUnderline>
      </Card>
    </motion.div>
  )
}