'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardSummary, RevenueChartCard, OrderStatusDistribution, ActivityFeed, StatsCards } from '@/components/admin/StatsCards'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Package, ShoppingBag, TrendingUp, Clock, AlertCircle, FileText, Plus, Settings, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { SketchUnderline } from '@/components/decorative/DoodleElements'

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
            id: `order-${o.id}`,
            type: 'order' as const,
            title: `Order ${o.orderNumber} — ${o.status}`,
            desc: `${o.user?.name ?? o.shippingName} · ${formatCurrency(Number(o.total))}`,
            time: formatDate(o.createdAt),
            href: `/orders/${o.id}`,
            icon: <ShoppingBag className="w-4 h-4" />,
          })),
          ...(recentCrRes?.data?.data ?? []).slice(0, 3).map((c: any) => ({
            id: `cr-${c.id}`,
            type: 'custom' as const,
            title: `Custom request ${c.status.toLowerCase()}`,
            desc: `${c.originalName} · ${c.width}×${c.height}cm × ${c.quantity}`,
            time: formatDate(c.createdAt),
            href: '/admin/custom-requests',
            icon: <span className="text-xl">✨</span>,
          })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6)

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl text-primary">Dashboard</h1>
          <p className="text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
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
      </motion.div>

      {/* Main Stats Cards - 4 cards: Orders, Revenue, Products, Customers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
      >
        {stats ? <StatsCards stats={stats} /> : <div className="h-32 animate-pulse bg-[var(--light)] rounded-card" />}
      </motion.div>

      {/* Dashboard Summary Row */}
      {stats && <DashboardSummary stats={stats} />}

      {/* Revenue Chart + Secondary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          <RevenueChartCard data={revenue} />
        </div>

        <div className="space-y-4">
          <SecondaryStatCard 
            label="Pending Orders" 
            value={stats?.pendingOrders ?? '—'} 
            icon={Clock} 
            color="var(--accent)" 
            trend="Requires attention" 
            trendUp={false} 
          />
          <SecondaryStatCard 
            label="Low Stock Products" 
            value={stats?.lowStockProducts ?? '—'} 
            icon={AlertCircle} 
            color="var(--error)" 
            trend="Needs restock" 
            trendUp={false} 
          />
          <SecondaryStatCard 
            label="Custom Requests" 
            value={stats?.pendingCustomRequests ?? '—'} 
            icon={FileText} 
            color="var(--info)" 
            trend="Awaiting review" 
            trendUp={false} 
          />
          <SecondaryStatCard 
            label="Avg. Order Value" 
            value={stats ? formatCurrency(stats.averageOrderValue) : '—'} 
            icon={TrendingUp} 
            color="var(--warning)" 
            trend="All time" 
            trendUp={true} 
          />
        </div>
      </motion.div>

      {/* Order Status Distribution */}
      <OrderStatusDistribution distribution={distribution} />

      {/* Activity Feed Timeline */}
      <ActivityFeed activities={activity} limit={6} />

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <QuickLinkCard title="Manage Products" desc="Add, edit, or remove products" icon={Package} href="/admin/products" color="primary" />
        <QuickLinkCard title="Process Orders" desc="View and update order status" icon={ShoppingBag} href="/admin/orders" color="secondary" />
        <QuickLinkCard title="Custom Requests" desc="Review and price custom requests" icon={FileText} href="/admin/custom-requests" color="accent" />
        <QuickLinkCard title="Analytics" desc="View detailed reports" icon={BarChart2} href="/admin/analytics" color="default" />
      </motion.div>
    </div>
  )
}

function SecondaryStatCard({ label, value, icon: Icon, color, trend, trendUp }: {
  label: string
  value: string | number
  icon: any
  color: string
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card variant="doodle" hover={true} padding="md" className="relative overflow-visible group">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-10 h-10 rounded-input flex items-center justify-center animate-float-gentle transition-all duration-300 group-hover:scale-110', `bg-[${color}]/10 text-[${color}]`)}>
          <Icon className="w-5 h-5" />
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

function QuickLinkCard({ title, desc, icon: Icon, href, color }: {
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}) {
  return (
    <a href={href} className="block">
      <Card variant="doodle" hover={true} padding="lg" className="relative overflow-visible group h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('w-12 h-12 rounded-input flex items-center justify-center animate-float-gentle transition-all duration-300 group-hover:scale-110', `bg-[${color === 'default' ? 'var(--dark)' : color}]/10 text-[${color === 'default' ? 'var(--dark)' : color}]`)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <h3 className="font-display text-lg text-[var(--ink)] mb-1">{title}</h3>
        <p className="text-sm text-[color-mix(in_srgb,var(--ink)_60%,transparent)] mb-4">{desc}</p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline transition-colors">
          View →
        </span>
      </Card>
    </a>
  )
}