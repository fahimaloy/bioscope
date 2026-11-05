'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Users, User, DollarSign, ShoppingBag } from 'lucide-react'

function StatCard({ label, value, icon, color, trend, trendUp }: { label: string; value: string | number; icon: React.ReactNode; color: string; trend?: string; trendUp?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--ink)]/60">{label}</p>
          <p className="font-display text-2xl text-[var(--ink)] mt-1">{value}</p>
          {trend && <p className={`text-xs mt-1 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>{trend}</p>}
        </div>
        <div className="w-10 h-10 rounded-input flex items-center justify-center" style={{ backgroundColor: color + '20', color }}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

const columns = [
  { key: 'name', header: 'Customer', accessor: (row: any) => <div><span className="font-medium">{row.name ?? '—'}</span><br /><span className="text-sm text-[var(--ink)]/50">{row.email}</span></div>, sortable: true },
  { key: 'phone', header: 'Phone', accessor: (row: any) => <span className="text-sm">{row.phone ?? '—'}</span> },
  { key: 'orders', header: 'Orders', accessor: (row: any) => <span className="font-medium">{row.orderCount}</span>, sortable: true },
  { key: 'spent', header: 'Total Spent', accessor: (row: any) => <span className="font-display text-primary">{formatCurrency(row.totalSpent)}</span>, sortable: true },
  { key: 'joined', header: 'Joined', accessor: (row: any) => <span className="text-sm text-[var(--ink)]/60">{formatDate(row.createdAt)}</span>, sortable: true },
]

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pager, setPager] = useState({ total: 0, pageSize: 20 })
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Customers</h1>
            <p className="text-[var(--ink)]/60">Manage your customers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Customers" value={pager.total} icon={<Users className="w-5 h-5" />} color="var(--primary)" />
          <StatCard label="On This Page" value={customers.length} icon={<User className="w-5 h-5" />} color="var(--secondary)" />
          <StatCard label="Revenue (page)" value={formatCurrency(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} color="var(--success)" />
          <StatCard label="Avg. Order Value" value={customers.length ? formatCurrency(totalRevenue / Math.max(1, customers.reduce((s, c) => s + c.orderCount, 0))) : '—'} icon={<ShoppingBag className="w-5 h-5" />} color="var(--accent)" />
        </div>

        <Card className="p-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink)]/40" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input"
            />
          </div>
        </Card>

        <Card>
          <DataTable
            columns={columns}
            data={customers}
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
