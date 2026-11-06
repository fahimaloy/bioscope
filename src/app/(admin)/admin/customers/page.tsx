'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Users, User, DollarSign, ShoppingBag, TrendingUp, Filter, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { SketchUnderline, DoodleShape, DoodleStar, StickerPeel } from '@/components/decorative/DoodleElements'
import { CounterAnimation } from '@/components/animations/CounterAnimation'
import { cn, formatNumber } from '@/lib/utils'

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'outline' | 'info' | 'doodle'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'primary',
  PRINTING: 'primary',
  READY_TO_SHIP: 'secondary',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'error',
  REFUNDED: 'error',
}

const spendTiers = [
  { min: 0, max: 1000, label: 'New', variant: 'default' as const, icon: '🌱' },
  { min: 1000, max: 5000, label: 'Bronze', variant: 'secondary' as const, icon: '🥉' },
  { min: 5000, max: 20000, label: 'Silver', variant: 'accent' as const, icon: '🥈' },
  { min: 20000, max: 50000, label: 'Gold', variant: 'warning' as const, icon: '🥇' },
  { min: 50000, max: Infinity, label: 'VIP', variant: 'primary' as const, icon: '💎' },
]

function SpendBadge({ totalSpent }: { totalSpent: number }) {
  const tier = spendTiers.find(t => totalSpent >= t.min && totalSpent < t.max) || spendTiers[0]
  return (
    <Badge variant={tier.variant} size="sm" className="gap-1.5">
      <span>{tier.icon}</span>
      <span>{tier.label}</span>
    </Badge>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const config = statusColors[status] || 'default'
  return <StatusBadge status={status} size="sm" />
}

const columns = [
  { 
    key: 'customer', 
    header: 'Customer', 
    width: '280px',
    cell: (row: any) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white flex items-center justify-center font-display text-sm">
          {row.name?.charAt(0)?.toUpperCase() || row.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium text-body text-[var(--ink)]">{row.name ?? '—'}</p>
          <p className="text-sm text-[var(--ink)]/50 truncate max-w-xs">{row.email}</p>
        </div>
      </div>
    ), 
    sortable: true 
  },
  { 
    key: 'phone', 
    header: 'Phone', 
    accessor: (row: any) => (
      <span className="text-sm text-[var(--ink)]/70">{row.phone ?? '—'}</span>
    ),
    sortable: true,
    width: '160px',
  },
  { 
    key: 'orders', 
    header: 'Orders', 
    width: '100px',
    accessor: (row: any) => (
      <span className="font-medium text-[var(--ink)]">{row.orderCount}</span>
    ), 
    sortable: true 
  },
  { 
    key: 'spent', 
    header: 'Total Spent', 
    width: '160px',
    accessor: (row: any) => (
      <span className="font-display text-primary">{formatCurrency(row.totalSpent)}</span>
    ), 
    sortable: true 
  },
  { 
    key: 'tier', 
    header: 'Tier', 
    width: '120px',
    accessor: (row: any) => <SpendBadge totalSpent={Number(row.totalSpent)} />,
  },
  { 
    key: 'status', 
    header: 'Latest Order', 
    width: '140px',
    accessor: (row: any) => row.latestOrderStatus ? <OrderStatusBadge status={row.latestOrderStatus} /> : <span className="text-[var(--ink)]/40">—</span>,
  },
  { 
    key: 'joined', 
    header: 'Joined', 
    width: '140px',
    accessor: (row: any) => (
      <span className="text-sm text-[var(--ink)]/60">{formatDate(row.createdAt)}</span>
    ), 
    sortable: true 
  },
]

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pager, setPager] = useState({ total: 0, pageSize: 20 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

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
            <p className="text-[var(--ink)]/60">Manage and analyze your customer base</p>
          </div>
          <div className="flex items-center gap-3">
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
            iconBg="bg-[var(--primary)]/10 text-[var(--primary)]"
            index={0}
          />
          <StatCard 
            label="On This Page" 
            value={customers.length} 
            icon={<User className="w-5 h-5" />} 
            color="var(--secondary)" 
            iconBg="bg-[var(--secondary)]/10 text-[var(--secondary)]"
            index={1}
          />
          <StatCard 
            label="Revenue (page)" 
            value={formatCurrency(totalRevenue)} 
            icon={<DollarSign className="w-5 h-5" />} 
            color="var(--success)" 
            iconBg="bg-[var(--success)]/10 text-[var(--success)]"
            index={2}
          />
          <StatCard 
            label="Avg. Order Value" 
            value={customers.length ? formatCurrency(totalRevenue / Math.max(1, totalOrders)) : '—'} 
            icon={<ShoppingBag className="w-5 h-5" />} 
            color="var(--accent)" 
            iconBg="bg-[var(--accent)]/10 text-[var(--accent)]"
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/40" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input text-body"
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
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-[var(--light)]"
              >
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">Spend Tier:</span>
                    <select className="px-3 py-2 border-2 border-[var(--ink)]/30 rounded-input bg-white text-body focus:border-primary focus:shadow-input focus:outline-none">
                      <option value="">All Tiers</option>
                      {spendTiers.map(t => (
                        <option key={t.label} value={t.label}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">Min Orders:</span>
                    <input type="number" min="0" className="w-24 px-3 py-2 border-2 border-[var(--ink)]/30 rounded-input bg-white text-body focus:border-primary focus:shadow-input focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">Date From:</span>
                    <input type="date" className="px-3 py-2 border-2 border-[var(--ink)]/30 rounded-input bg-white text-body focus:border-primary focus:shadow-input focus:outline-none" />
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
              columns={columns}
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

function StatCard({ label, value, icon, color, iconBg, index }: StatCardProps) {
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
          <p className="font-medium text-body text-[var(--ink)]/70 text-sm">{label}</p>
        </SketchUnderline>
      </Card>
    </motion.div>
  )
}