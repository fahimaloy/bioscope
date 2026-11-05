'use client'

import { cn } from '@/lib/utils'
import { CounterAnimation } from '@/components/animations/CounterAnimation'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, Clock, CheckCircle, AlertCircle, FileText, Eye } from 'lucide-react'

interface StatsCardsProps {
  stats: {
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
  className?: string
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  const cards = [
    {
      key: 'totalOrders',
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'var(--primary)',
      trend: '+12%',
      trendUp: true,
    },
    {
      key: 'pendingOrders',
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'var(--accent)',
      trend: 'Requires attention',
      trendUp: false,
    },
    {
      key: 'totalRevenue',
      label: 'Total Revenue',
      value: stats.totalRevenue,
      icon: DollarSign,
      color: 'var(--success)',
      format: 'currency',
      trend: '+8%',
      trendUp: true,
    },
    {
      key: 'totalProducts',
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'var(--secondary)',
      trend: '+5 new',
      trendUp: true,
    },
    {
      key: 'totalCustomers',
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'var(--purple)',
      trend: '+3%',
      trendUp: true,
    },
    {
      key: 'lowStockProducts',
      label: 'Low Stock',
      value: stats.lowStockProducts,
      icon: AlertCircle,
      color: 'var(--error)',
      trend: 'Needs restock',
      trendUp: false,
    },
    {
      key: 'pendingCustomRequests',
      label: 'Custom Requests',
      value: stats.pendingCustomRequests,
      icon: FileText,
      color: 'var(--info)',
      trend: 'Awaiting review',
      trendUp: false,
    },
    {
      key: 'conversionRate',
      label: 'Conversion Rate',
      value: stats.conversionRate,
      icon: TrendingUp,
      color: 'var(--warning)',
      format: 'percent',
      trend: '+0.5%',
      trendUp: true,
    },
  ]

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4', className)}>
      {cards.map((card, index) => {
        const span = index === 1 || index === 5 ? 'col-span-2' : 'col-span-1'
        const wide = index === 0 || index === 2 || index === 3

        return (
          <StatCard
            key={card.key}
            value={stats[card.key as keyof typeof stats]}
            label={card.label}
            icon={card.icon}
            color={card.color}
            trend={card.trend}
            trendUp={card.trendUp}
            format={card.format}
            className={span}
          />
        )
      })}
    </div>
  )
}

interface StatCardProps {
  value: number
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend?: string
  trendUp?: boolean
  format?: string
  className?: string
}

function StatCard({ value, label, icon: Icon, color, trend, trendUp, format, className }: StatCardProps) {
  const displayValue = format === 'currency'
    ? formatCurrency(value)
    : format === 'percent'
    ? `${value.toFixed(1)}%`
    : formatNumber(value)

  return (
    <div className={cn(
      'bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card transition-all hover:shadow-card-hover',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-input flex items-center justify-center', `bg-[${color}]/10 text-[${color}]`)}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-sm text-[var(--ink)]/50 font-medium">{trendUp ? '↑' : '↓'} {trend}</span>
      </div>
      <CounterAnimation
        target={value}
        duration={1500}
        className="text-3xl font-display text-[var(--ink)] mb-1"
        format={format === 'currency' ? (v) => formatCurrency(v) : format === 'percent' ? (v) => `${v.toFixed(1)}%` : (v) => formatNumber(v)}
      />
      <p className="font-medium text-body text-[var(--ink)]/70">{label}</p>
    </div>
  )
}

// Real-time stats card with live updates
export function LiveStatCard({
  value,
  label,
  icon: Icon,
  color,
  className,
}: {
  value: number
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  className?: string
}) {
  return (
    <div className={cn(
      'bg-white rounded-card border-3 border-[var(--ink)] p-4 shadow-card transition-all',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-input flex items-center justify-center', `bg-[${color}]/10 text-[${color}]`)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-display text-[var(--ink)] mb-1">{formatNumber(value)}</div>
      <p className="text-sm font-medium text-[var(--ink)]/60">{label}</p>
    </div>
  )
}

// Dashboard summary row
export function DashboardSummary({ stats }: { stats: StatsCardsProps['stats'] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <SummaryCard
        label="Today's Orders"
        value={stats.todayOrders}
        icon={ShoppingBag}
        color="var(--primary)"
      />
      <SummaryCard
        label="Today's Revenue"
        value={stats.todayRevenue}
        icon={DollarSign}
        color="var(--success)"
        format="currency"
      />
      <SummaryCard
        label="Avg Order Value"
        value={stats.averageOrderValue}
        icon={TrendingUp}
        color="var(--warning)"
        format="currency"
      />
      <SummaryCard
        label="Conversion Rate"
        value={stats.conversionRate}
        icon={TrendingUp}
        color="var(--warning)"
        format="percent"
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  format,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  format?: 'currency' | 'percent'
}) {
  const displayValue = format === 'currency'
    ? formatCurrency(value)
    : format === 'percent'
    ? `${value.toFixed(1)}%`
    : formatNumber(value)

  return (
    <div className="bg-white rounded-card border-3 border-[var(--ink)] p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-input flex items-center justify-center')}>
          <span className="text-2xl">{getIconForLabel(label)}</span>
        </div>
      </div>
      <CounterAnimation
        target={value}
        duration={1000}
        className="text-2xl font-display text-[var(--ink)] mb-1"
        format={format === 'currency' ? (v) => formatCurrency(v) : format === 'percent' ? (v) => `${v.toFixed(1)}%` : (v) => formatNumber(v)}
      />
      <p className="text-sm font-medium text-[var(--ink)]/60">{label}</p>
    </div>
  )
}

function getIconForLabel(label: string) {
  if (label.includes('Orders')) return '📦'
  if (label.includes('Revenue')) return '💰'
  if (label.includes('Avg')) return '📈'
  if (label.includes('Conversion')) return '📊'
  return '📊'
}

// Revenue Chart Card
export function RevenueChartCard({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  return (
    <div className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
      <h3 className="font-display text-lg text-primary mb-4">Revenue Overview</h3>
      <div className="h-64">
        {/* Chart would go here - using Recharts */}
        <div className="h-full flex items-center justify-center text-[var(--ink)]/50">
          <p>Revenue chart would be rendered here with Recharts</p>
        </div>
      </div>
    </div>
  )
}

// Orders Status Distribution
export function OrderStatusDistribution({ distribution }: { distribution: Record<string, number> }) {
  const statuses = [
    { key: 'PENDING', label: 'Pending', color: 'var(--accent)' },
    { key: 'CONFIRMED', label: 'Confirmed', color: 'var(--secondary)' },
    { key: 'PROCESSING', label: 'Processing', color: 'var(--primary)' },
    { key: 'PRINTING', label: 'Printing', color: 'var(--primary)' },
    { key: 'READY_TO_SHIP', label: 'Ready to Ship', color: 'var(--secondary)' },
    { key: 'SHIPPED', label: 'Shipped', color: 'var(--info)' },
    { key: 'DELIVERED', label: 'Delivered', color: 'var(--success)' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'var(--error)' },
    { key: 'REFUNDED', label: 'Refunded', color: 'var(--error)' },
  ]

  const total = Object.values(distribution).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
      <h3 className="font-display text-lg text-primary mb-4">Order Status Distribution</h3>
      <div className="space-y-3">
        {statuses.map((status) => {
          const count = distribution[status.key] || 0
          const percentage = total > 0 ? (count / total) * 100 : 0

          return (
            <div key={status.key} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${status.color}20` }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--ink)]">{status.label}</span>
                  <span className="text-[var(--ink)]/60">{count}</span>
                </div>
                <div className="h-2 bg-[var(--light)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: status.color }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-[var(--ink)]/60 w-10 text-right">{percentage.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}