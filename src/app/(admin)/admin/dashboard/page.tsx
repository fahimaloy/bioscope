'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardSummary, OrderStatusDistribution, RevenueChartCard } from '@/components/admin/StatsCards'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, Clock, AlertCircle, FileText, Plus, Settings, BarChart2 } from 'lucide-react'

const quickActions = [
  { name: 'Add Product', href: '/admin/products', icon: Plus, color: 'primary' },
  { name: 'Custom Requests', href: '/admin/custom-requests', icon: FileText, color: 'accent' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, color: 'default' },
]

const LOW_STOCK = 10

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [revenue, setRevenue] = useState<{ date: string; revenue: number; orders: number }[]>([])
  const [activity, setActivity] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, productsRes, customersRes, crRes, recentCrRes] = await Promise.all([
          fetch('/api/orders?limit=100&sortBy=createdAt&sortOrder=desc').then((r) => r.json()),
          fetch('/api/products?limit=100').then((r) => r.json()),
          fetch('/api/customers?limit=1').then((r) => r.json()),
          fetch('/api/custom-requests/stats').then((r) => r.json()),
          fetch('/api/custom-requests?limit=5&sortBy=createdAt&sortOrder=desc').then((r) => r.json()),
        ])
        const orders = ordersRes?.data?.data ?? []
        const products = productsRes?.data?.data ?? []
        const paid = orders.filter((o: any) => !['CANCELLED', 'REFUNDED'].includes(o.status))
        const revenueTotal = paid.reduce((s: any, o: any) => s + Number(o.total), 0)
        const dist: Record<string, number> = {}
        for (const o of orders) dist[o.status] = (dist[o.status] ?? 0) + 1

        // revenue per day for last 7 days
        const days: { date: string; revenue: number; orders: number }[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setHours(0, 0, 0, 0)
          d.setDate(d.getDate() - i)
          days.push({ date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 })
        }
        for (const o of paid) {
          const key = new Date(o.createdAt).toISOString().slice(0, 10)
          const day = days.find((d) => d.date === key)
          if (day) {
            day.revenue += Number(o.total)
            day.orders += 1
          }
        }

        const recent = [
          ...orders.slice(0, 4).map((o: any) => ({
            icon: '📦',
            title: `Order ${o.orderNumber} — ${o.status}`,
            desc: `${o.user?.name ?? o.shippingName} · ${formatCurrency(Number(o.total))}`,
            time: formatDate(o.createdAt),
            href: `/orders/${o.id}`,
          })),
          ...(recentCrRes?.data?.data ?? []).slice(0, 3).map((c: any) => ({
            icon: '✨',
            title: `Custom request ${c.status.toLowerCase()}`,
            desc: `${c.originalName} · ${c.width}×${c.height}cm × ${c.quantity}`,
            time: formatDate(c.createdAt),
            href: '/admin/custom-requests',
          })),
        ].slice(0, 6)

        setStats({
          totalOrders: ordersRes?.data?.pagination?.total ?? orders.length,
          pendingOrders: orders.filter((o: any) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length,
          totalRevenue: revenueTotal,
          totalProducts: productsRes?.data?.pagination?.total ?? products.length,
          totalCustomers: customersRes?.data?.pagination?.total ?? 0,
          lowStockProducts: products.filter((p: any) => Number(p.stock) <= LOW_STOCK).length,
          pendingCustomRequests: crRes?.data?.pending ?? 0,
          conversionRate: 0,
          averageOrderValue: paid.length ? Math.round(revenueTotal / paid.length) : 0,
          todayOrders: days[days.length - 1]?.orders ?? 0,
          todayRevenue: days[days.length - 1]?.revenue ?? 0,
        })
        setDistribution(dist)
        setRevenue(days)
        setActivity(recent)
      } catch (e) {
        console.error('dashboard load failed', e)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary">Dashboard</h1>
          <p className="text-[var(--ink)]/60">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Button variant={action.color === 'default' ? 'outline' : (action.color as any)} size="sm">
                <action.icon className="w-4 h-4 mr-2" />
                {action.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {stats ? <DashboardSummary stats={stats} /> : <div className="h-32 animate-pulse bg-[var(--light)] rounded-card" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChartCard data={revenue} />
        </div>

        <div className="space-y-4">
          <StatCard label="Pending Orders" value={stats?.pendingOrders ?? '—'} icon={Clock} color="var(--accent)" trend="Requires attention" trendUp={false} />
          <StatCard label="Low Stock Products" value={stats?.lowStockProducts ?? '—'} icon={AlertCircle} color="var(--error)" trend="Needs restock" trendUp={false} />
          <StatCard label="Custom Requests" value={stats?.pendingCustomRequests ?? '—'} icon={FileText} color="var(--info)" trend="Awaiting review" trendUp={false} />
          <StatCard label="Avg. Order Value" value={stats ? formatCurrency(stats.averageOrderValue) : '—'} icon={TrendingUp} color="var(--warning)" trend="All time" trendUp={true} />
        </div>
      </div>

      <OrderStatusDistribution distribution={distribution} />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-primary">Recent Activity</h2>
          <Link href="/admin/orders"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="space-y-3">
          {activity.length === 0 && <p className="text-[var(--ink)]/50 text-sm">No recent activity.</p>}
          {activity.map((a, index) => (
            <Link key={index} href={a.href} className="flex items-center gap-4 p-3 bg-[var(--light)] rounded-input border border-[var(--ink)]/20 hover:border-primary transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                <span>{a.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-body text-[var(--ink)] truncate">{a.title}</p>
                <p className="text-sm text-[var(--ink)]/60 truncate">{a.desc}</p>
              </div>
              <span className="text-xs text-[var(--ink)]/50 whitespace-nowrap">{a.time}</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLinkCard title="Manage Products" desc="Add, edit, or remove products" icon={Package} href="/admin/products" color="primary" />
        <QuickLinkCard title="Process Orders" desc="View and update order status" icon={ShoppingBag} href="/admin/orders" color="secondary" />
        <QuickLinkCard title="Custom Requests" desc="Review and price custom requests" icon={FileText} href="/admin/custom-requests" color="accent" />
        <QuickLinkCard title="Analytics" desc="View detailed reports" icon={BarChart2} href="/admin/analytics" color="default" />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, trend, trendUp }: {
  label: string
  value: string | number
  icon: any
  color: string
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className="bg-white rounded-card border-3 border-[var(--ink)] p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-10 h-10 rounded-input flex items-center justify-center')} style={{ backgroundColor: color + '20', color }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-display text-[var(--ink)] mb-1">{value}</div>
      <p className="font-medium text-body text-[var(--ink)]/70">{label}</p>
      <p className="text-xs text-[var(--ink)]/50 mt-1">{trend}</p>
    </div>
  )
}

function QuickLinkCard({ title, desc, icon: Icon, href, color }: {
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}) {
  return (
    <a href={href} className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-input flex items-center justify-center')} style={{ backgroundColor: (color === 'default' ? 'var(--dark)' : color) + '20', color: color === 'default' ? 'var(--dark)' : color }}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="font-display text-lg text-[var(--ink)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--ink)]/60 mb-4">{desc}</p>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
        View →
      </span>
    </a>
  )
}
