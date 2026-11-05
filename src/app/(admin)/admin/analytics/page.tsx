'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { StatsCards, OrderStatusDistribution } from '@/components/admin/StatsCards'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { TrendingUp, ShoppingBag, DollarSign, Users } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--purple)', '#E67E22']

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [monthly, setMonthly] = useState<{ date: string; revenue: number; orders: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number; revenue: number }[]>([])
  const [distribution, setDistribution] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, productsRes, customersRes] = await Promise.all([
          fetch('/api/orders?limit=100&sortBy=createdAt&sortOrder=desc').then((r) => r.json()),
          fetch('/api/products?limit=100').then((r) => r.json()),
          fetch('/api/customers?limit=1').then((r) => r.json()),
        ])
        const orders = ordersRes?.data?.data ?? []
        const paid = orders.filter((o: any) => !['CANCELLED', 'REFUNDED'].includes(o.status))
        const revenueTotal = paid.reduce((s: any, o: any) => s + Number(o.total), 0)

        const dist: Record<string, number> = {}
        for (const o of orders) dist[o.status] = (dist[o.status] ?? 0) + 1

        // monthly buckets, last 6 months
        const months: { date: string; revenue: number; orders: number }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date()
          d.setDate(1)
          d.setHours(0, 0, 0, 0)
          d.setMonth(d.getMonth() - i)
          months.push({ date: d.toLocaleString('en', { month: 'short' }), revenue: 0, orders: 0 })
        }
        for (const o of paid) {
          const d = new Date(o.createdAt)
          const key = d.toLocaleString('en', { month: 'short' })
          const m = months.find((x) => x.date === key && new Date(o.createdAt).getFullYear() === new Date().getFullYear())
          const bucket = months[months.length - 1 - Math.min(5, Math.floor((Date.now() - d.getTime()) / (30 * 24 * 3600 * 1000)))]
          const target = bucket && bucket.date === key ? bucket : months.find((x) => x.date === key)
          if (target) {
            target.revenue += Number(o.total)
            target.orders += 1
          }
        }

        // top products by revenue from order items
        const byProduct = new Map<string, { name: string; sales: number; revenue: number }>()
        for (const o of orders) {
          for (const item of o.items ?? []) {
            const cur = byProduct.get(item.productId ?? item.productName) ?? { name: item.productName, sales: 0, revenue: 0 }
            cur.sales += Number(item.quantity)
            cur.revenue += Number(item.totalPrice ?? item.unitPrice * item.quantity)
            byProduct.set(item.productId ?? item.productName, cur)
          }
        }
        const top = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)

        setStats({
          totalOrders: ordersRes?.data?.pagination?.total ?? orders.length,
          pendingOrders: orders.filter((o: any) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length,
          totalRevenue: revenueTotal,
          totalProducts: productsRes?.data?.pagination?.total ?? 0,
          totalCustomers: customersRes?.data?.pagination?.total ?? 0,
          lowStockProducts: (productsRes?.data?.data ?? []).filter((p: any) => Number(p.stock) <= 10).length,
          pendingCustomRequests: 0,
          conversionRate: 0,
          averageOrderValue: paid.length ? Math.round(revenueTotal / paid.length) : 0,
          todayOrders: 0,
          todayRevenue: 0,
        })
        setMonthly(months)
        setTopProducts(top)
        setDistribution(dist)
      } catch (e) {
        console.error('analytics load failed', e)
      }
    }
    load()
  }, [])

  const avgOrder = stats?.averageOrderValue ?? 0
  const clv = stats?.totalCustomers ? Math.round(stats.totalRevenue / Math.max(1, stats.totalCustomers)) : 0

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-primary">Analytics</h1>
          <p className="text-[var(--ink)]/60">Track your store performance</p>
        </div>

        {stats ? <StatsCards stats={stats} /> : <div className="h-32 animate-pulse bg-[var(--light)] rounded-card mb-8" />}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 h-full">
            <h3 className="font-display text-lg text-primary mb-4">Revenue Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--light)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--dark)" fontSize={12} />
                  <YAxis stroke="var(--dark)" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '3px solid var(--dark)', borderRadius: '20px', boxShadow: '8px 8px 0px var(--secondary)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 h-full">
            <h3 className="font-display text-lg text-primary mb-4">Orders Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--light)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--dark)" fontSize={12} />
                  <YAxis stroke="var(--dark)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '3px solid var(--dark)', borderRadius: '20px', boxShadow: '8px 8px 0px var(--secondary)' }}
                    formatter={(value: number) => [formatNumber(value), 'Orders']}
                  />
                  <Line type="monotone" dataKey="orders" stroke="var(--secondary)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'var(--secondary)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="font-display text-lg text-primary mb-4">Top Selling Products</h3>
            <div className="space-y-4">
              {topProducts.length === 0 && <p className="text-[var(--ink)]/50 text-sm">No order data yet.</p>}
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-[var(--light)] rounded-input">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-display text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-body text-[var(--ink)]">{product.name}</p>
                      <p className="text-sm text-[var(--ink)]/50">{formatNumber(product.sales)} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-primary">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-[var(--ink)]/50">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <OrderStatusDistribution distribution={distribution} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Avg. Order Value" value={formatCurrency(avgOrder)} icon={<DollarSign className="w-5 h-5" />} color="var(--primary)" trend="All time" trendUp />
          <StatCard label="Customer Lifetime Value" value={formatCurrency(clv)} icon={<Users className="w-5 h-5" />} color="var(--secondary)" trend="All time" trendUp />
          <StatCard label="Orders / Customer" value={stats ? formatNumber(stats.totalCustomers ? stats.totalOrders / stats.totalCustomers : 0) : '—'} icon={<TrendingUp className="w-5 h-5" />} color="var(--accent)" trend="All time" trendUp />
          <StatCard label="Pending Orders" value={stats ? String(stats.pendingOrders) : '—'} icon={<ShoppingBag className="w-5 h-5" />} color="var(--error)" trend="Needs action" trendUp={false} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, trend, trendUp }: { label: string; value: string; icon: React.ReactNode; color: string; trend: string; trendUp: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-10 h-10 rounded-input flex items-center justify-center')} style={{ backgroundColor: color + '20', color }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-display text-[var(--ink)] mb-1">{value}</p>
      <p className="font-medium text-body text-[var(--ink)]/70">{label}</p>
      <p className={cn('text-xs mt-1', trendUp ? 'text-green-600' : 'text-red-600')}>{trend}</p>
    </Card>
  )
}
