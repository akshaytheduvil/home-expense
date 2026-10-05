import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  ArrowRight,
  Receipt,
  Calendar,
  Clock,
  TrendingUp,
  Tag,
  Users,
} from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, getTodayIso } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/lib/constants'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export const Dashboard: React.FC = () => {
  const { expenses, loading } = useExpenses()
  const navigate = useNavigate()

  const todayIso = useMemo(() => getTodayIso(), [])

  // Calculate statistics
  const stats = useMemo(() => {
    let allTime = 0
    let todayTotal = 0
    let weekTotal = 0
    let monthTotal = 0

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Start of this week (Monday)
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diffToMonday)
    monday.setHours(0, 0, 0, 0)

    expenses.forEach((item) => {
      const amount = Number(item.amount) || 0
      allTime += amount

      if (item.date === todayIso) {
        todayTotal += amount
      }

      const itemDate = new Date(item.date + 'T00:00:00')
      if (itemDate >= monday && itemDate <= now) {
        weekTotal += amount
      }

      if (itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth) {
        monthTotal += amount
      }
    })

    return {
      allTime,
      todayTotal,
      weekTotal,
      monthTotal,
    }
  }, [expenses, todayIso])

  // Recent 5 expenses
  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5)
  }, [expenses])

  // Category breakdown for pie chart (top 5 + Other)
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((item) => {
      const cat = item.category || 'Other'
      map[cat] = (map[cat] || 0) + (Number(item.amount) || 0)
    })

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    if (sorted.length <= 5) {
      return sorted.map(([name, value]) => ({ name, value }))
    }

    const top5 = sorted.slice(0, 5).map(([name, value]) => ({ name, value }))
    const otherTotal = sorted.slice(5).reduce((sum, item) => sum + item[1], 0)
    if (otherTotal > 0) {
      top5.push({ name: 'Other', value: otherTotal })
    }
    return top5
  }, [expenses])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Card: Total Spent (All Time) */}
      <StatCard
        title="Total Spent (All Time)"
        amount={stats.allTime}
        subtitle={`${expenses.length} total logged household transactions`}
        variant="hero"
      />

      {/* 2. 3 Stat Cards: This Month, This Week, Today */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
        <StatCard
          title="This Month"
          amount={stats.monthTotal}
          icon={Calendar}
          subtitle={new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        />
        <StatCard
          title="This Week"
          amount={stats.weekTotal}
          icon={TrendingUp}
          subtitle="Mon - Sun"
        />
        <StatCard
          title="Today"
          amount={stats.todayTotal}
          icon={Clock}
          subtitle={formatDate(todayIso)}
        />
      </div>

      {/* 3. Quick Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => navigate('/add')}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span>Quick Add Expense</span>
        </Button>
      </div>

      {/* 4. Two-Column Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent 5 Expenses */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center space-x-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                <span>Recent Expenses</span>
              </CardTitle>
              <Link
                to="/expenses"
                className="text-xs font-semibold text-primary hover:underline flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No expenses logged yet. Click "Quick Add" to start!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentExpenses.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/edit/${item.id}`)}
                      className="py-3 flex items-center justify-between hover:bg-accent/40 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {item.product_name || item.category}
                          </span>
                          <Badge variant="blue" className="text-[10px] py-0 px-2 shrink-0">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{formatDate(item.date)}</span>
                          {item.worker_name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3 inline" />
                                <span>{item.worker_name}</span>
                              </span>
                            </>
                          )}
                          {item.payment_mode && (
                            <>
                              <span>•</span>
                              <span>{item.payment_mode}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-sm text-foreground tabular-nums block">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-border mt-3 text-center">
                <Link
                  to="/expenses"
                  className="text-xs font-semibold text-primary hover:text-blue-700 flex items-center justify-center space-x-1"
                >
                  <span>View All Expenses ({expenses.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Category Pie Chart */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center space-x-2">
                <Tag className="h-4 w-4 text-emerald-600" />
                <span>Spending by Category</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {categoryChartData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No category data available.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={45}
                          paddingAngle={3}
                        >
                          {categoryChartData.map((entry, index) => {
                            const color =
                              CATEGORY_COLORS[entry.name] ||
                              ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'][
                                index % 6
                              ]
                            return <Cell key={`cell-${index}`} fill={color} />
                          })}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Spent']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Legend */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {categoryChartData.map((entry, idx) => {
                      const color =
                        CATEGORY_COLORS[entry.name] ||
                        ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'][
                          idx % 6
                        ]
                      const pct = stats.allTime > 0 ? Math.round((entry.value / stats.allTime) * 100) : 0
                      return (
                        <div key={entry.name} className="flex items-center space-x-2 truncate">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate text-muted-foreground">
                            {entry.name}: <strong className="text-foreground">{pct}%</strong>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
