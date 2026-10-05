import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Download,
  HardHat,
} from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { useWorkers } from '@/hooks/useWorkers'
import { useSettings } from '@/hooks/useSettings'
import { Expense, ExpenseFilters } from '@/types'
import { FilterBar } from '@/components/FilterBar'
import { ExpenseCard } from '@/components/ExpenseCard'
import { Button } from '@/components/ui/button'
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

export const Expenses: React.FC = () => {
  const { expenses, loading, deleteExpense } = useExpenses()
  const { workers } = useWorkers()
  const { categories, paymentModes } = useSettings()
  const navigate = useNavigate()

  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    categories: [],
    workerName: '',
    paymentMode: '',
  })

  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // 1. Search (product_name, description, notes)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim()
        const matchProduct = item.product_name?.toLowerCase().includes(query)
        const matchDesc = item.description?.toLowerCase().includes(query)
        const matchNotes = item.notes?.toLowerCase().includes(query)
        const matchWorker = item.worker_name?.toLowerCase().includes(query)
        if (!matchProduct && !matchDesc && !matchNotes && !matchWorker) {
          return false
        }
      }

      // 2. Date from / to
      if (filters.dateFrom && item.date < filters.dateFrom) {
        return false
      }
      if (filters.dateTo && item.date > filters.dateTo) {
        return false
      }

      // 3. Category multi-select
      if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
        return false
      }

      // 4. Worker filter
      if (filters.workerName && item.worker_name !== filters.workerName) {
        return false
      }

      // 5. Payment mode filter
      if (filters.paymentMode && item.payment_mode !== filters.paymentMode) {
        return false
      }

      return true
    })
  }, [expenses, filters])

  // Running Total
  const runningTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  }, [filteredExpenses])

  const handleEdit = (expense: Expense) => {
    navigate(`/edit/${expense.id}`)
  }

  const handleDuplicate = (expense: Expense) => {
    // Navigate to /add and pass state for duplicate pre-fill
    navigate('/add', {
      state: {
        duplicateData: {
          category: expense.category,
          product_name: expense.product_name || '',
          amount: expense.amount,
          worker_name: expense.worker_name || '',
          payment_mode: expense.payment_mode || 'Cash',
          description: expense.description || '',
          notes: expense.notes || '',
        },
      },
    })
    toast.info('Expense details copied to new form')
  }

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return
    try {
      await deleteExpense(expenseToDelete.id)
      toast.success('Expense deleted successfully')
      setExpenseToDelete(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete'
      toast.error(msg)
    }
  }

  const handleExportFilteredCsv = () => {
    if (filteredExpenses.length === 0) {
      toast.error('No matching records to export')
      return
    }
    const rows = filteredExpenses.map((e) => ({
      Date: e.date,
      Category: e.category,
      Product: e.product_name || '',
      Amount: e.amount,
      Worker: e.worker_name || '',
      Mode: e.payment_mode || '',
      Description: e.description || '',
      Notes: e.notes || '',
    }))
    exportToCsv(`Home_Expenses_Filtered_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toast.success('CSV exported successfully')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <Receipt className="h-6 w-6 text-primary" />
            <span>All Expenses</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            View, filter, edit, duplicate, and manage family records
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportFilteredCsv}
            className="flex items-center space-x-1.5"
            title="Export filtered records to CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/add')}
            className="flex items-center space-x-1.5 bg-primary text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Filter Component */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        workers={workers}
        paymentModes={paymentModes}
        totalMatches={filteredExpenses.length}
      />

      {/* Expense List: Mobile Cards / Desktop Table */}
      {filteredExpenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No expenses found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search filters or record a new household expense.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters({
                search: '',
                dateFrom: '',
                dateTo: '',
                categories: [],
                workerName: '',
                paymentMode: '',
              })
            }
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile View: Stacked Cards */}
          <div className="space-y-2.5 md:hidden">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={(e) => setExpenseToDelete(e)}
              />
            ))}
          </div>

          {/* Desktop View: Data Table */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead>Product / Description</TableHead>
                  <TableHead className="w-36">Worker</TableHead>
                  <TableHead className="w-24">Mode</TableHead>
                  <TableHead className="w-32 text-right">Amount</TableHead>
                  <TableHead className="w-28 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((item) => (
                  <TableRow key={item.id} className="hover:bg-accent/40">
                    <TableCell className="font-medium text-xs whitespace-nowrap">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="blue" className="text-xs py-0.5">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">
                        {item.product_name || item.category}
                      </div>
                      {(item.description || item.notes) && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {item.description || item.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.worker_name ? (
                        <span className="inline-flex items-center space-x-1.5 text-xs text-foreground bg-secondary/80 px-2 py-1 rounded-md">
                          <HardHat className="h-3 w-3 text-blue-600" />
                          <span>{item.worker_name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
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
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDuplicate(item)}
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setExpenseToDelete(item)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Running Total Sticky/Fixed Bar */}
      <div className="sticky bottom-16 md:bottom-4 z-20 rounded-xl bg-card/95 backdrop-blur-md border border-border p-3.5 shadow-lg flex items-center justify-between">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredExpenses.length}</span>{' '}
          {filteredExpenses.length === 1 ? 'expense' : 'expenses'}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total:</span>
          <span className="text-lg sm:text-xl font-bold tabular-nums text-primary">
            {formatCurrency(runningTotal)}
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-destructive flex items-center space-x-2">
              <Trash2 className="h-5 w-5" />
              <span>Confirm Delete</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this expense for{' '}
              <strong>{expenseToDelete.product_name || expenseToDelete.category}</strong> (
              {formatCurrency(expenseToDelete.amount)})?
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
