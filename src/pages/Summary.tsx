import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  HardHat,
  CreditCard,
} from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { TimeRangeOption } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency, exportToCsv } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/lib/constants'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { toast } from 'sonner'

export const Summary: React.FC = () => {
  const { expenses } = useExpenses()

  const [range, setRange] = useState<TimeRangeOption>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Compute dates for ranges
  const rangeBounds = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    if (range === 'this_week') {
      const day = now.getDay()
      const diff = day === 0 ? 6 : day - 1
      const monday = new Date(now)
      monday.setDate(now.getDate() - diff)
      const fromStr = monday.toISOString().slice(0, 10)
      const toStr = now.toISOString().slice(0, 10)
      return { from: fromStr, to: toStr, label: 'This Week' }
    }

    if (range === 'this_month') {
      const firstDay = new Date(currentYear, currentMonth, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      return {
        from: firstDay.toISOString().slice(0, 10),
        to: lastDay.toISOString().slice(0, 10),
        label: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      }
    }

    if (range === 'last_month') {
      const firstDay = new Date(currentYear, currentMonth - 1, 1)
      const lastDay = new Date(currentYear, currentMonth, 0)
      return {
        from: firstDay.toISOString().slice(0, 10),
        to: lastDay.toISOString().slice(0, 10),
        label: firstDay.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      }
    }

    if (range === 'this_year') {
      return {
        from: `${currentYear}-01-01`,
        to: `${currentYear}-12-31`,
        label: `Year ${currentYear}`,
      }
    }

    if (range === 'custom') {
      return {
        from: customFrom,
        to: customTo,
        label: 'Custom Range',
      }
    }

    return { from: '', to: '', label: 'All Time' }
  }, [range, customFrom, customTo])

  // Filter expenses by selected range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (rangeBounds.from && e.date < rangeBounds.from) return false
      if (rangeBounds.to && e.date > rangeBounds.to) return false
      return true
    })
  }, [expenses, rangeBounds])

  // Selected range total
  const rangeTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  }, [filteredExpenses])

  // Month-over-Month calculation (Current month vs Previous month)
  const momStats = useMemo(() => {
    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth()

    let curTotal = 0
    let prevTotal = 0

    expenses.forEach((e) => {
      const d = new Date(e.date + 'T00:00:00')
      const amt = Number(e.amount) || 0
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        curTotal += amt
      } else if (
        (curMonth === 0 && d.getFullYear() === curYear - 1 && d.getMonth() === 11) ||
        (d.getFullYear() === curYear && d.getMonth() === curMonth - 1)
      ) {
        prevTotal += amt
      }
    })

    let pctChange = 0
    if (prevTotal > 0) {
      pctChange = Math.round(((curTotal - prevTotal) / prevTotal) * 100)
    } else if (curTotal > 0) {
      pctChange = 100
    }

    return { curTotal, prevTotal, pctChange }
  }, [expenses])

  // Category breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Other'
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        pct: rangeTotal > 0 ? Math.round((value / rangeTotal) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses, rangeTotal])

  // Worker breakdown (Top 10)
  const workerData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      const w = e.worker_name || 'Unassigned / Vendor'
      map[w] = (map[w] || 0) + (Number(e.amount) || 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        pct: rangeTotal > 0 ? Math.round((value / rangeTotal) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [filteredExpenses, rangeTotal])

  // Payment mode breakdown
  const paymentModeData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredExpenses.forEach((e) => {
      const mode = e.payment_mode || 'Cash'
      map[mode] = (map[mode] || 0) + (Number(e.amount) || 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        pct: rangeTotal > 0 ? Math.round((value / rangeTotal) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses, rangeTotal])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCsv = () => {
    if (filteredExpenses.length === 0) {
      toast.error('No expenses to export for this range')
      return
    }
    const rows = filteredExpenses.map((e) => ({
      Date: e.date,
      Category: e.category,
      Product: e.product_name || '',
      Amount: e.amount,
      Worker: e.worker_name || '',
      PaymentMode: e.payment_mode || 'Cash',
      Description: e.description || '',
      Notes: e.notes || '',
    }))
    exportToCsv(`Home_Expense_Summary_${range}_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toast.success('Summary CSV exported')
  }

  const rangeButtons: { id: TimeRangeOption; label: string }[] = [
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all_time', label: 'All Time' },
    { id: 'custom', label: 'Custom' },
  ]

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280']

  return (
    <div className="space-y-6">
      {/* Header & Print/Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span>Financial Summary & Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Spending patterns, vendor attribution, and category analysis
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center space-x-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </Button>
        </div>
      </div>

      {/* Range Selector Bar */}
      <div className="p-3 bg-card rounded-xl border border-border space-y-3 print:hidden shadow-xs">
        <div className="flex items-center justify-start overflow-x-auto pb-1 gap-1.5 scrollbar-none">
          {rangeButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRange(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                range === btn.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom date range pickers */}
        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border animate-in fade-in">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">From Date</label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">To Date</label>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* A. Big Total Card & MoM Change */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selected Range Hero Card */}
        <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-200">
              Total Spent in {rangeBounds.label}
            </span>
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums tracking-tight mt-1 text-white">
              {formatCurrency(rangeTotal)}
            </div>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-2">
              Based on {filteredExpenses.length} transactions recorded
            </p>
          </div>
        </div>

        {/* E. Month-over-Month Change Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Month-Over-Month
            </span>
            <div className="flex items-center space-x-2 mt-2">
              {momStats.pctChange > 0 ? (
                <div className="inline-flex items-center space-x-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full text-sm font-bold">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{momStats.pctChange}%</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-sm font-bold">
                  <TrendingDown className="h-4 w-4" />
                  <span>{momStats.pctChange}%</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {momStats.pctChange > 0
                ? 'Higher expenditure compared to previous month'
                : 'Lower expenditure compared to previous month'}
            </p>
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
            This Month: <strong className="text-foreground">{formatCurrency(momStats.curTotal)}</strong> | Prev:{' '}
            <strong className="text-foreground">{formatCurrency(momStats.prevTotal)}</strong>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* B. By Category — Pie Chart + List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <PieIcon className="h-4 w-4 text-primary" />
              <span>Spending by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No category data for this period
              </div>
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={2}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cat-${index}`}
                            fill={
                              CATEGORY_COLORS[entry.name] ||
                              chartColors[index % chartColors.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="divide-y divide-border/60 max-h-52 overflow-y-auto text-xs">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="py-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[cat.name] ||
                              chartColors[i % chartColors.length],
                          }}
                        />
                        <span className="font-medium text-foreground truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-muted-foreground">{cat.pct}%</span>
                        <span className="font-bold tabular-nums text-foreground">
                          {formatCurrency(cat.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* D. By Payment Mode — Donut Chart + List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>Spending by Payment Mode</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentModeData.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No payment mode data
              </div>
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentModeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={3}
                      >
                        {paymentModeData.map((_, index) => (
                          <Cell
                            key={`mode-${index}`}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="divide-y divide-border/60 max-h-52 overflow-y-auto text-xs">
                  {paymentModeData.map((mode, i) => (
                    <div key={mode.name} className="py-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: chartColors[i % chartColors.length],
                          }}
                        />
                        <span className="font-medium text-foreground truncate">{mode.name}</span>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-muted-foreground">{mode.pct}%</span>
                        <span className="font-bold tabular-nums text-foreground">
                          {formatCurrency(mode.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* C. By Worker — Horizontal Bar Chart (Top 10) + List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <HardHat className="h-4 w-4 text-blue-600" />
            <span>Top 10 Workers & Vendors by Spend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workerData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No worker expenditure recorded for this timeframe
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workerData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                      fontSize={11}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={90}
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Amount']}
                    />
                    <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 border-t border-border">
                {workerData.map((w, idx) => (
                  <div
                    key={w.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/40"
                  >
                    <span className="truncate font-medium text-foreground">
                      {idx + 1}. {w.name}
                    </span>
                    <span className="font-bold tabular-nums text-foreground ml-2">
                      {formatCurrency(w.value)} ({w.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
