import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Phone,
  Calendar,
  Search,
  Receipt,
  Plus,
} from 'lucide-react'
import { useWorkers } from '@/hooks/useWorkers'
import { useExpenses } from '@/hooks/useExpenses'
import { useSettings } from '@/hooks/useSettings'
import { Expense } from '@/types'
import { ExpenseCard } from '@/components/ExpenseCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, exportToCsv } from '@/lib/utils'
import { toast } from 'sonner'

export const WorkerLedger: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { workers, loading: workersLoading } = useWorkers()
  const { expenses, loading: expensesLoading, deleteExpense } = useExpenses()
  const { categories, paymentModes } = useSettings()

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMode, setSelectedMode] = useState('')
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  // Find worker
  const worker = workers.find((w) => w.id === id)

  // All expenses belonging to this worker
  const workerExpenses = useMemo(() => {
    if (!worker) return []
    return expenses.filter(
      (e) => e.worker_name && e.worker_name.toLowerCase() === worker.name.toLowerCase()
    )
  }, [worker, expenses])

  // Compute ledger header metrics
  const ledgerMetrics = useMemo(() => {
    const totalSpent = workerExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const transactionCount = workerExpenses.length

    let dateRange = 'No transactions recorded'
    if (workerExpenses.length > 0) {
      const dates = workerExpenses.map((e) => e.date).sort()
      dateRange = `${formatDate(dates[0])} → ${formatDate(dates[dates.length - 1])}`
    }

    return { totalSpent, transactionCount, dateRange }
  }, [workerExpenses])

  // Filtered ledger expenses
  const filteredLedger = useMemo(() => {
    return workerExpenses.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchProduct = item.product_name?.toLowerCase().includes(q)
        const matchDesc = item.description?.toLowerCase().includes(q)
        const matchNotes = item.notes?.toLowerCase().includes(q)
        if (!matchProduct && !matchDesc && !matchNotes) return false
      }
      if (dateFrom && item.date < dateFrom) return false
      if (dateTo && item.date > dateTo) return false
      if (selectedCategory && item.category !== selectedCategory) return false
      if (selectedMode && item.payment_mode !== selectedMode) return false
      return true
    })
  }, [workerExpenses, search, dateFrom, dateTo, selectedCategory, selectedMode])

  const filteredTotal = useMemo(() => {
    return filteredLedger.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  }, [filteredLedger])

  const handleExportCsv = () => {
    if (!worker || workerExpenses.length === 0) {
      toast.error('No transactions available to export')
      return
    }
    const rows = filteredLedger.map((e) => ({
      Date: e.date,
      Category: e.category,
      Product: e.product_name || '',
      Amount: e.amount,
      Worker: worker.name,
      PaymentMode: e.payment_mode || 'Cash',
      Description: e.description || '',
      Notes: e.notes || '',
    }))
    exportToCsv(`${worker.name}_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toast.success(`Ledger for ${worker.name} exported`)
  }

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return
    try {
      await deleteExpense(expenseToDelete.id)
      toast.success('Expense deleted')
      setExpenseToDelete(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      toast.error(msg)
    }
  }

  if (workersLoading || expensesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Worker Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested worker does not exist or was removed.
        </p>
        <Button onClick={() => navigate('/workers')}>Back to Workers</Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Top Navigation & Back */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/workers')}
          className="flex items-center space-x-1.5 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workers</span>
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5"
            disabled={workerExpenses.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/add')}
            className="flex items-center space-x-1.5 bg-primary text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Entry</span>
          </Button>
        </div>
      </div>

      {/* Header Card: Worker Name & Financial Ledger Stats */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl font-bold shadow-inner">
              {worker.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>{worker.name}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">
                  Ledger
                </span>
              </h1>
              {worker.phone && (
                <p className="text-xs text-blue-200 mt-1 flex items-center space-x-1">
                  <Phone className="h-3 w-3 inline" />
                  <span>{worker.phone}</span>
                </p>
              )}
              {worker.notes && (
                <p className="text-xs text-blue-100/80 mt-0.5 line-clamp-1">
                  {worker.notes}
                </p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <span className="text-xs uppercase tracking-wider text-blue-200 block">
              Total Spent on Worker
            </span>
            <span className="text-3xl sm:text-4xl font-bold tabular-nums text-white">
              {formatCurrency(ledgerMetrics.totalSpent)}
            </span>
            <div className="text-xs text-blue-200 mt-1 flex items-center sm:justify-end space-x-2">
              <span>{ledgerMetrics.transactionCount} transactions</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 inline" />
                <span>{ledgerMetrics.dateRange}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Local Filter Bar */}
      <div className="p-3 sm:p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Search Item
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Product name, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Date From
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Date To
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Payment Mode
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">All Modes</option>
              {paymentModes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {filteredLedger.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-semibold text-base">No transactions recorded</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            No expenses found for {worker.name} under selected filters.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setSearch('')
              setDateFrom('')
              setDateTo('')
              setSelectedCategory('')
              setSelectedMode('')
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile Stacked Cards */}
          <div className="space-y-2.5 md:hidden">
            {filteredLedger.map((item) => (
              <ExpenseCard
                key={item.id}
                expense={item}
                onEdit={(e) => navigate(`/edit/${e.id}`)}
                onDuplicate={(e) => navigate('/add', { state: { duplicateData: e } })}
                onDelete={(e) => setExpenseToDelete(e)}
              />
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead>Product / Description</TableHead>
                  <TableHead className="w-24">Mode</TableHead>
                  <TableHead className="w-32 text-right">Amount</TableHead>
                  <TableHead className="w-24 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedger.map((item) => (
                  <TableRow key={item.id} className="hover:bg-accent/40">
                    <TableCell className="font-medium text-xs whitespace-nowrap">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="blue" className="text-xs">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">
                        {item.product_name || item.category}
                      </div>
                      {(item.description || item.notes) && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.description || item.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.payment_mode || 'Cash'}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-foreground">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => navigate(`/edit/${item.id}`)}
                          title="Edit"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Running Ledger Total Footer */}
      <div className="sticky bottom-16 md:bottom-4 z-20 rounded-xl bg-card/95 backdrop-blur-md border border-border p-3.5 shadow-lg flex items-center justify-between">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredLedger.length}</span>{' '}
          worker transactions
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground uppercase font-semibold">
            Filtered Total:
          </span>
          <span className="text-lg sm:text-xl font-bold tabular-nums text-primary">
            {formatCurrency(filteredTotal)}
          </span>
        </div>
      </div>

      {/* Delete dialog */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-destructive">Confirm Delete</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this expense of {formatCurrency(expenseToDelete.amount)}?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setExpenseToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteExpense}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
