'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatsCards, RevenueChartCard, OrderStatusDistribution, DashboardSummary } from '@/components/admin/StatsCards'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, ShoppingBag, DollarSign, Users } from 'lucide-react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { SketchUnderline, DoodleShape } from '@/components/decorative/DoodleElements'

interface AdminStats {
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  totalProducts: number
  totalCustomers: number
  lowStockProducts: number
  pendingCustomRequests: number
  conversionRate: number
  averageOrderValue: number
  todayOrders: number
  todayRevenue: number
}

interface TopCustomerItem {
  id: string
  name: string
  email: string
  totalSpent: number
  orderCount: number
}

interface ProductItem {
  stock: number
}

import { motion } from 'framer-motion'

interface MonthlyData {
  date: string
  revenue: number
  orders: number
}

interface TopProduct {
  name: string
  sales: number
  revenue: number
}

interface TopCustomer {
  id: string
  name: string
  email: string
  totalSpent: number
  orderCount: number
}

interface TopCategory {
  name: string
  sales: number
  revenue: number
}

interface GeoDistrict {
  district: string
  orders: number
  revenue: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [topCategories, setTopCategories] = useState<TopCategory[]>([])
  const [topDistricts, setTopDistricts] = useState<GeoDistrict[]>([])
  const [, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const range = '12mo'
        const [revRes, ordRes, topProductRes, topCustomerRes, categoriesRes, geoRes, productsRes, customersRes] = await Promise.all([
          fetch(`/api/analytics/revenue?range=${range}`).then((r) => r.json()),
          fetch(`/api/analytics/orders?range=${range}`).then((r) => r.json()),
          fetch(`/api/analytics/top-products?limit=8&range=${range}`).then((r) => r.json()),
          fetch(`/api/analytics/top-customers?limit=10&range=${range}`).then((r) => r.json()),
          fetch(`/api/analytics/categories?range=${range}`).then((r) => r.json()),
          fetch(`/api/analytics/geo?limit=10&range=${range}`).then((r) => r.json()),
          fetch('/api/products?limit=100').then((r) => r.json()),
          fetch('/api/customers?limit=1').then((r) => r.json()),
        ])
        setMonthly(revRes?.data?.monthly ?? [])
        setTopProducts(topProductRes?.data?.items ?? [])
        setTopCustomers((topCustomerRes?.data?.items ?? []).map((c: TopCustomerItem) => ({ id: c.id, name: c.name, email: c.email, totalSpent: c.totalSpent, orderCount: c.orderCount })))
        setTopCategories(categoriesRes?.data?.items ?? [])
        setTopDistricts(geoRes?.data?.items ?? [])
        setDistribution(ordRes?.data?.distribution ?? {})
        setStats({
          totalOrders: ordRes?.data?.total ?? 0,
          pendingOrders: ordRes?.data?.pending ?? 0,
          totalRevenue: revRes?.data?.totalRevenue ?? 0,
          totalProducts: productsRes?.data?.pagination?.total ?? (productsRes?.data?.data ?? []).length,
          totalCustomers: customersRes?.data?.pagination?.total ?? 0,
          lowStockProducts: (productsRes?.data?.data ?? []).filter((p: ProductItem) => Number(p.stock) <= 10).length,
          pendingCustomRequests: 0,
          conversionRate: 0,
          averageOrderValue: revRes?.data?.averageOrderValue ?? 0,
          todayOrders: 0,
          todayRevenue: 0,
        })
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const avgOrder = stats?.averageOrderValue ?? 0
  const clv = stats?.totalCustomers ? Math.round(stats.totalRevenue / Math.max(1, stats.totalCustomers)) : 0
  const ordersPerCustomer = stats?.totalCustomers ? (stats.totalOrders / stats.totalCustomers).toFixed(1) : '0'

  const chartColors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--purple)', 'var(--pink)', 'var(--orange)', '#06b6d4', 'var(--warning)']

  return (
  <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl text-primary">Analytics</h1>
            <p className="text-[var(--text-subtle)]">Track your store performance with detailed insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="doodle" size="sm" className="animate-pulse-soft">Live Data</Badge>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
        >
          {stats ? <StatsCards stats={stats} /> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div className="h-32 animate-pulse bg-[var(--light)] rounded-card" /><div className="h-32 animate-pulse bg-[var(--light)] rounded-card" /><div className="h-32 animate-pulse bg-[var(--light)] rounded-card" /><div className="h-32 animate-pulse bg-[var(--light)] rounded-card" /></div>}
        </motion.div>

        {/* Dashboard Summary Row */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <DashboardSummary stats={stats} />
          </motion.div>
        )}

        {/* Revenue Overview Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 15 }}
        >
          <RevenueChartCard data={monthly} />
        </motion.div>

        {/* Orders Trend + Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100, damping: 15 }}
          className="grid lg:grid-cols-2 gap-6"
        >
          {/* Orders Trend */}
          <Card variant="doodle" padding="lg" className="relative overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg text-primary">Orders Trend</h3>
              <Badge variant="doodle" size="sm">12 Months</Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.35} />
                      <stop offset="50%" stopColor="var(--accent)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--secondary)" />
                      <stop offset="100%" stopColor="var(--accent)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--light)" vertical={false} horizontal={true} strokeWidth={1} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--ink)"
                    fontSize={12}
                    fontFamily="var(--font-body)"
                    tick={{ fill: 'var(--ink)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--light)', strokeWidth: 1 }}
                    tickLine={{ stroke: 'var(--light)' }}
                    tickCount={monthly.length}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="var(--ink)"
                    fontSize={12}
                    fontFamily="var(--font-body)"
                    tick={{ fill: 'var(--ink)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatNumber(value)}
                    tickCount={5}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-raised)',
                      border: '3px solid var(--ink)',
                      borderRadius: '20px',
                      boxShadow: 'var(--shadow-ink-2)',
                      fontFamily: 'var(--font-body)',
                    }}
                    formatter={(value: number) => [formatNumber(value), 'Orders']}
                    labelFormatter={(date) => date}
                    itemStyle={{ color: 'var(--secondary)', fontWeight: 800, fontFamily: 'var(--font-display)' }}
                    labelStyle={{ color: 'var(--text-muted)', fontSize: '12px' }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="url(#ordersStroke)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#ordersGradient)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="url(#ordersStroke)"
                    strokeWidth={3}
                    fill="none"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {monthly.map((entry, index) => (
                      <motion.circle
                        key={index}
                        cx={entry.date}
                        cy={entry.orders}
                        r={5}
                        fill="var(--secondary)"
                        stroke="var(--surface-raised)"
                        strokeWidth={3}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        whileHover={{ scale: 2 }}
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                      />
                    ))}
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--light)]">
              <div className="flex items-center gap-4 text-sm text-[var(--text-subtle)]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--secondary)' }} />
                  Orders
                </span>
              </div>
              <div className="text-right">
                <p className="font-display text-lg text-[var(--ink)]">
                  {formatNumber(monthly[monthly.length - 1]?.orders ?? 0)}
                </p>
                <p className="text-xs text-[var(--text-subtle)]">This Month</p>
              </div>
            </div>
          </Card>

          {/* Top Products */}
          <Card variant="doodle" padding="lg" className="relative overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg text-primary">Top Selling Products</h3>
              <Badge variant="outline" size="sm">By Revenue</Badge>
            </div>
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {topProducts.length === 0 ? (
                <div className="text-center py-12">
                  <DoodleShape size="lg" color="primary" animation="float" className="mx-auto opacity-30 mb-4" />
                  <p className="text-body text-[var(--text-subtle)]">No order data yet.</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <motion.div
                    key={product.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 100, damping: 15 }}
                    className="flex items-center gap-4 p-3 bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)] border-2 border-[var(--light)] rounded-card hover:border-primary hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-input opacity-20" />
                      <div className="relative w-full h-full rounded-input flex items-center justify-center bg-white border-2 border-[color-mix(in_srgb,var(--ink)_10%,transparent)]">
                        <span className="font-display text-primary text-lg">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-body text-[var(--ink)] truncate">{product.name}</p>
                      <p className="text-sm text-[var(--text-subtle)]">{formatNumber(product.sales)} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-primary">{formatCurrency(product.revenue)}</p>
                      <p className="text-xs text-[var(--text-subtle)]">Revenue</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Revenue by Category (Pie) + Order Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 100, damping: 15 }}
          className="grid lg:grid-cols-2 gap-6"
        >
          {/* Revenue by Product Category */}
          <Card variant="doodle" padding="lg" className="relative overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg text-primary">Revenue by Category</h3>
              <Badge variant="doodle" size="sm">Top 6</Badge>
            </div>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProducts.slice(0, 6).map((p, i) => ({ name: p.name.length > 15 ? p.name.slice(0, 12) + '...' : p.name, value: p.revenue, color: chartColors[i % chartColors.length] }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {topProducts.slice(0, 6).map((p, i) => (
                      <Cell key={`cell-${i}`} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-raised)',
                      border: '3px solid var(--ink)',
                      borderRadius: '20px',
                      boxShadow: 'var(--shadow-ink-2)',
                      fontFamily: 'var(--font-body)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    itemStyle={{ color: 'var(--primary)', fontWeight: 800, fontFamily: 'var(--font-display)' }}
                    labelStyle={{ color: 'var(--text-muted)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {topProducts.slice(0, 6).map((p, i) => (
                <span key={p.name} className="flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                  {p.name.length > 15 ? p.name.slice(0, 12) + '...' : p.name}
                </span>
              ))}
            </div>
          </Card>

          {/* Order Status Distribution */}
          <OrderStatusDistribution distribution={distribution} />
        </motion.div>

        {/* Revenue by Category + Top Districts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 100, damping: 15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card variant="doodle" padding="lg" className="relative overflow-visible">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-primary">Revenue by Category</h3>
              <Badge variant="outline" size="sm">Last 12 months</Badge>
            </div>
            {topCategories.length === 0 ? (
              <p className="text-[var(--text-subtle)] text-sm py-8 text-center">No category sales yet.</p>
            ) : (
              <ul className="space-y-3">
                {topCategories.map((c) => {
                  const max = topCategories[0]?.revenue || 1
                  return (
                    <li key={c.name}>
                      <div className="flex items-center justify-between gap-4 text-sm mb-1">
                        <span className="font-medium text-[var(--ink)]">{c.name}</span>
                        <span className="text-[var(--text-subtle)] whitespace-nowrap">{formatCurrency(c.revenue)} · {formatNumber(c.sales)} sold</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--light)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.max(3, Math.round((c.revenue / max) * 100))}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card variant="doodle" padding="lg" className="relative overflow-visible">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-primary">Top Districts</h3>
              <Badge variant="outline" size="sm">Paid orders</Badge>
            </div>
            {topDistricts.length === 0 ? (
              <p className="text-[var(--text-subtle)] text-sm py-8 text-center">No district data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-[var(--text-subtle)] border-b-2 border-[var(--light)]">
                      <th className="py-2">District</th>
                      <th className="py-2">Orders</th>
                      <th className="py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--light)]">
                    {topDistricts.map((d) => (
                      <tr key={d.district}>
                        <td className="py-2 font-medium text-[var(--ink)]">{d.district}</td>
                        <td className="py-2 text-[var(--ink)]">{formatNumber(d.orders)}</td>
                        <td className="py-2 text-right font-medium text-[var(--ink)]">{formatCurrency(d.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
        >
          <Card variant="doodle" padding="lg" className="relative overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg text-primary">Top Customers</h3>
              <Badge variant="outline" size="sm">By Lifetime Value</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" role="grid">
                <thead className="bg-[var(--surface-sunken)] border-b-2 border-[var(--primary)]">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--ink)] uppercase tracking-wider text-sm">Rank</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--ink)] uppercase tracking-wider text-sm">Customer</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--ink)] uppercase tracking-wider text-sm">Orders</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--ink)] uppercase tracking-wider text-sm">Total Spent</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-[var(--ink)] uppercase tracking-wider text-sm">Avg. Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--light)]">
                  {topCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <DoodleShape size="lg" color="primary" animation="float" className="opacity-30" />
                          <p className="text-body text-[var(--text-subtle)]">No customer data yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    topCustomers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 100, damping: 15 }}
                        className="transition-colors hover:bg-[var(--surface-raised)]"
                      >
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-display text-sm">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-body text-[var(--ink)]">{customer.name}</p>
                            <p className="text-sm text-[var(--text-subtle)]">{customer.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-[var(--ink)]">{customer.orderCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-display text-primary">{formatCurrency(customer.totalSpent)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">{formatCurrency(customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0)}</span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Key Metrics Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 100, damping: 15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <MetricCard
            label="Avg. Order Value"
            value={formatCurrency(avgOrder)}
            icon={<DollarSign className="w-5 h-5" />}
            color="var(--primary)"
            trend="All time"
            trendUp={true}
            iconBg="bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]"
          />
          <MetricCard
            label="Customer Lifetime Value"
            value={formatCurrency(clv)}
            icon={<Users className="w-5 h-5" />}
            color="var(--secondary)"
            trend="All time"
            trendUp={true}
            iconBg="bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)] text-[var(--secondary)]"
          />
          <MetricCard
            label="Orders / Customer"
            value={ordersPerCustomer}
            icon={<TrendingUp className="w-5 h-5" />}
            color="var(--accent)"
            trend="All time"
            trendUp={true}
            iconBg="bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]"
          />
          <MetricCard
            label="Pending Orders"
            value={String(stats?.pendingOrders ?? 0)}
            icon={<ShoppingBag className="w-5 h-5" />}
            color="var(--error)"
            trend="Needs action"
            trendUp={false}
            iconBg="bg-[color-mix(in_srgb,var(--error)_10%,transparent)] text-[var(--error)]"
          />
        </motion.div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  trend: string
  trendUp: boolean
  iconBg: string
}

function MetricCard({ label, value, icon, color: _color, trend, trendUp, iconBg }: MetricCardProps) {
  return (
    <Card variant="doodle" hover={true} padding="md" className="relative overflow-visible group">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-10 h-10 rounded-input flex items-center justify-center animate-float-gentle transition-all duration-300 group-hover:scale-110', iconBg)}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: trendUp ? 'var(--success)' : 'var(--error)' }}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      </div>
      <div className="text-xl font-display text-[var(--ink)] mb-1">{value}</div>
      <SketchUnderline className="inline-block">
        <p className="font-medium text-body text-[color-mix(in_srgb,var(--ink)_70%,transparent)] text-sm">{label}</p>
      </SketchUnderline>
    </Card>
  )
}