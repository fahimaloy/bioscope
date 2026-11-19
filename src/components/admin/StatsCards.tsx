'use client'

import { cn } from '@/lib/utils'
import { CounterAnimation } from '@/components/animations/CounterAnimation'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, Palette } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SketchUnderline } from '@/components/decorative/DoodleElements'
import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface StatsCardsProps {
  stats: {
    totalOrders: number
    pendingOrders: number
    totalRevenue: number
    totalProducts: number
    totalCustomers: number
    lowStockProducts: number
    pendingCustomRequests: number
    averageOrderValue: number
    todayOrders: number
    todayRevenue: number
  }
  className?: string
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  // No trend badges: there is no period-over-period data source, and hardcoded
  // "+12%"-style trends are fake metrics (B2 ruling — no invented numbers).
  const cards = [
    {
      key: 'totalOrders',
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'var(--primary)',
    },
    {
      key: 'totalRevenue',
      label: 'Total Revenue',
      value: stats.totalRevenue,
      icon: DollarSign,
      color: 'var(--success)',
      format: 'currency',
    },
    {
      key: 'totalProducts',
      label: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'var(--secondary)',
    },
    {
      key: 'totalCustomers',
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'var(--purple)',
    },
  ]

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {cards.map((card, index) => (
        <StatCard
          key={card.key}
          value={stats[card.key as keyof typeof stats]}
          label={card.label}
          icon={card.icon}
          color={card.color}
          format={card.format}
          index={index}
        />
      ))}
    </div>
  )
}

interface StatCardProps {
  value: number
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  format?: string
  index: number
}

function StatCard({ value, label, icon: Icon, color, format, index }: StatCardProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100, damping: 15 }}
    >
      <Card variant="doodle" hover={true} padding="lg" className="relative overflow-visible">
        <div className="flex items-start justify-between mb-4">
          <div className="relative group">
            <div className={cn(
              'w-12 h-12 rounded-input flex items-center justify-center animate-float-gentle transition-all duration-300',
              'bg-[color-mix(in_srgb,var(--ink)_5%,transparent)]',
              `text-[${color}]`
            )}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </div>
        <CounterAnimation
          target={value}
          duration={1500}
          className="text-3xl font-display text-[var(--ink)] mb-1"
          format={format === 'currency' ? (v) => formatCurrency(v) : format === 'percent' ? (v) => `${v.toFixed(1)}%` : (v) => formatNumber(v)}
        />
        <SketchUnderline className="inline-block">
          <p className="font-medium text-body text-[color-mix(in_srgb,var(--ink)_70%,transparent)]">{label}</p>
        </SketchUnderline>
      </Card>
    </motion.div>
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
        <div className={cn('w-10 h-10 rounded-input flex items-center justify-center animate-float-gentle', `bg-[${color}]/10 text-[${color}]`)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-display text-[var(--ink)] mb-1">{formatNumber(value)}</div>
      <p className="text-sm font-medium text-[var(--text-subtle)]">{label}</p>
    </div>
  )
}

// Dashboard summary row
export function DashboardSummary({ stats }: { stats: StatsCardsProps['stats'] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
    >
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
          label="Pending Requests"
          value={stats.pendingCustomRequests}
          icon={Palette}
          color="var(--secondary)"
        />
      </div>
    </motion.div>
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

  return (
    <Card variant="doodle" hover={true} padding="md" className="relative overflow-visible">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-input flex items-center justify-center animate-float-gentle', `bg-[${color}]/10 text-[${color}]`)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <CounterAnimation
        target={value}
        duration={1000}
        className="text-2xl font-display text-[var(--ink)] mb-1"
        format={format === 'currency' ? (v) => formatCurrency(v) : format === 'percent' ? (v) => `${v.toFixed(1)}%` : (v) => formatNumber(v)}
      />
      <SketchUnderline className="inline-block">
        <p className="text-sm font-medium text-[var(--text-subtle)]">{label}</p>
      </SketchUnderline>
    </Card>
  )
}

// Revenue Chart Card - Doodle styled with Recharts
export function RevenueChartCard({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  // Calculate max revenue for nice Y-axis ticks

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 15 }}
    >
      <Card variant="doodle" padding="lg" className="relative overflow-visible">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg text-primary">Revenue Overview</h3>
          <Badge variant="doodle" size="sm">Live</Badge>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="50%" stopColor="var(--accent)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="var(--light)"
                vertical={false}
                horizontal={true}
                strokeWidth={1}
              />
              <XAxis
                dataKey="date"
                stroke="var(--ink)"
                fontSize={12}
                fontFamily="var(--font-body)"
                tick={{ fill: 'var(--ink)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--light)', strokeWidth: 1 }}
                tickLine={{ stroke: 'var(--light)' }}
                tickCount={data.length}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--ink)"
                fontSize={12}
                fontFamily="var(--font-body)"
                tick={{ fill: 'var(--ink)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value).replace('BDT', '').trim()}
                tickCount={5}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-raised)',
                  border: '3px solid var(--ink)',
                  borderRadius: '20px',
                  boxShadow: 'var(--shadow-ink-2)',
                  fontFamily: 'var(--font-body)',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-BD', { weekday: 'short', month: 'short', day: 'numeric' })}
                itemStyle={{ color: 'var(--primary)', fontWeight: 800, fontFamily: 'var(--font-display)' }}
                labelStyle={{ color: 'var(--text-muted)', fontSize: '12px' }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="url(#revenueStroke)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="url(#revenueStroke)"
                strokeWidth={3}
                fill="none"
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <motion.circle
                    key={index}
                    cx={entry.date}
                    cy={entry.revenue}
                    r={5}
                    fill="var(--primary)"
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
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
              Revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              Trend
            </span>
          </div>
          <div className="text-right">
            <p className="font-display text-lg text-[var(--ink)]">
              {formatCurrency(data[data.length - 1]?.revenue ?? 0)}
            </p>
            <p className="text-xs text-[var(--text-subtle)]">Today</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Orders Status Distribution - kept from original
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 100, damping: 15 }}
    >
      <Card variant="doodle" padding="lg" className="relative overflow-visible">
        <h3 className="font-display text-lg text-primary mb-4">Order Status Distribution</h3>
        <div className="space-y-3">
          {statuses.map((status) => {
            const count = distribution[status.key] || 0
            const percentage = total > 0 ? (count / total) * 100 : 0

            return (
              <motion.div
                key={status.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * statuses.indexOf(status), type: 'spring', stiffness: 100, damping: 15 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${status.color}20` }}>
                  <motion.div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: status.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: percentage > 0 ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--ink)]">{status.label}</span>
                    <span className="text-[var(--text-subtle)] font-display">{count}</span>
                  </div>
                  <div className="h-2 bg-[var(--light)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: percentage / 100 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
                      style={{ backgroundColor: status.color, transformOrigin: 'left' }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-[var(--text-subtle)] w-10 text-right font-display">{percentage.toFixed(1)}%</span>
              </motion.div>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}

// Activity Feed Timeline - Doodle styled
interface ActivityItem {
  id: string
  type: 'order' | 'custom' | 'product' | 'customer'
  title: string
  description: string
  timestamp: Date | string
  href?: string
  icon?: React.ReactNode
}

export function ActivityFeed({ activities, limit = 6 }: { activities: ActivityItem[]; limit?: number }) {
  const displayActivities = activities.slice(0, limit)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 100, damping: 15 }}
    >
      <Card variant="doodle" padding="lg" className="relative overflow-visible">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg text-primary">Recent Activity</h3>
          <Badge variant="outline" size="sm">{displayActivities.length} items</Badge>
        </div>
        <div className="relative">
          {/* Timeline connector line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-[var(--light)]" aria-hidden="true" />
          
          {displayActivities.map((activity, index) => {
            const isLast = index === displayActivities.length - 1
            const timeAgo = formatRelativeTime(activity.timestamp)
            
            // Get icon based on type
            const getTypeIcon = () => {
              switch (activity.type) {
                case 'order': return <Package className="w-5 h-5" />
                case 'custom': return <span className="text-2xl">✨</span>
                case 'product': return <ShoppingBag className="w-5 h-5" />
                case 'customer': return <Users className="w-5 h-5" />
                default: return <Package className="w-5 h-5" />
              }
            }
            
            const getTypeColor = () => {
              switch (activity.type) {
                case 'order': return 'var(--primary)'
                case 'custom': return 'var(--accent)'
                case 'product': return 'var(--secondary)'
                case 'customer': return 'var(--purple)'
                default: return 'var(--primary)'
              }
            }

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 100, damping: 15 }}
                className="relative pl-12 pb-6 group"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-1">
                  <motion.div
                    className="relative z-10 w-9 h-9 rounded-full border-3 flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--surface-raised)',
                      borderColor: getTypeColor(),
                      boxShadow: isLast ? '0 0 0 4px var(--accent)' : 'none',
                    }}
                    animate={isLast ? { boxShadow: ['0 0 0 0 var(--accent)', '0 0 0 4px var(--accent)', '0 0 0 0 var(--accent)'] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {getTypeIcon()}
                  </motion.div>
                  {!isLast && (
                    <div className="absolute left-4 top-9 w-0.5 h-full bg-[var(--light)]" />
                  )}
                </div>
                
                {/* Activity content */}
                <div className="bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)] border-2 border-[var(--light)] rounded-card p-4 hover:border-primary hover:shadow-md transition-all duration-300">
                  {activity.href ? (
                    <a href={activity.href} className="block">
                      <ActivityContent activity={activity} typeColor={getTypeColor()} timeAgo={timeAgo} />
                    </a>
                  ) : (
                    <ActivityContent activity={activity} typeColor={getTypeColor()} timeAgo={timeAgo} />
                  )}
                </div>
              </motion.div>
            )
          })}
          
          {displayActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-subtle)] text-sm">No recent activity.</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function ActivityContent({ activity, typeColor, timeAgo }: { activity: ActivityItem; typeColor: string; timeAgo: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-input flex items-center justify-center" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
        {activity.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-body text-[var(--ink)] truncate">{activity.title}</p>
        <p className="text-sm text-[var(--text-subtle)] truncate mt-0.5">{activity.description}</p>
      </div>
      <span className="text-xs text-[var(--text-subtle)] whitespace-nowrap font-mono">{timeAgo}</span>
    </div>
  )
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })
}