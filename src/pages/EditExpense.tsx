import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Trash2, Calendar, Tag, CreditCard, FileText } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { useSettings } from '@/hooks/useSettings'
import { WorkerSelect } from '@/components/WorkerSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  product_name: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  worker_name: z.string().optional(),
  payment_mode: z.string().min(1, 'Payment mode is required'),
  description: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

export const EditExpense: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { expenses, updateExpense, deleteExpense, loading } = useExpenses()
  const { categories, paymentModes } = useSettings()
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const currentItem = expenses.find((e) => e.id === id)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
  })

  useEffect(() => {
    if (currentItem) {
      reset({
        date: currentItem.date,
        category: currentItem.category,
        product_name: currentItem.product_name || '',
        amount: currentItem.amount,
        worker_name: currentItem.worker_name || '',
        payment_mode: currentItem.payment_mode || 'Cash',
        description: currentItem.description || '',
        notes: currentItem.notes || '',
      })
    }
  }, [currentItem, reset])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading expense...</div>
  }

  if (!currentItem) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Expense Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested expense could not be located.
        </p>
        <Button onClick={() => navigate('/expenses')}>Go to Expenses</Button>
      </div>
    )
  }

  const onSubmit = async (data: ExpenseFormData) => {
    if (!id) return
    try {
      await updateExpense(id, {
        date: data.date,
        category: data.category,
        product_name: data.product_name?.trim() || null,
        amount: data.amount,
        worker_name: data.worker_name?.trim() || null,
        payment_mode: data.payment_mode || 'Cash',
        description: data.description?.trim() || null,
        notes: data.notes?.trim() || null,
      })
      toast.success('Expense updated successfully')
      navigate(-1)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update expense'
      toast.error(msg)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteExpense(id)
      toast.success('Expense deleted')
      navigate('/expenses')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete expense'
      toast.error(msg)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Edit Expense
            </h1>
            <p className="text-xs text-muted-foreground">
              Modify expense record or adjust attribution
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteConfirm(true)}
          className="flex items-center space-x-1"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Amount Field */}
            <div className="space-y-1.5 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <Label htmlFor="amount" required className="text-blue-900 dark:text-blue-200">
                Amount (₹)
              </Label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹
                </span>
                <input
                  id="amount"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  {...register('amount')}
                  className="w-full bg-background rounded-lg pl-10 pr-4 py-3 text-2xl font-bold tabular-nums border border-input focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Date & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date" required>
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Date</span>
                </Label>
                <Input id="date" type="date" {...register('date')} />
                {errors.date && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" required>
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Category</span>
                </Label>
                <select
                  id="category"
                  {...register('category')}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <Label htmlFor="product_name">Product / Item Name</Label>
              <Input id="product_name" {...register('product_name')} />
            </div>

            {/* Worker Select */}
            <div className="space-y-1.5">
              <Label htmlFor="worker_name">Worker / Vendor</Label>
              <Controller
                name="worker_name"
                control={control}
                render={({ field }) => (
                  <WorkerSelect
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.worker_name?.message}
                  />
                )}
              />
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <Label htmlFor="payment_mode" required>
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Payment Mode</span>
              </Label>
              <select
                id="payment_mode"
                {...register('payment_mode')}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Description (Optional)</span>
              </Label>
              <textarea
                id="description"
                rows={2}
                {...register('description')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                rows={2}
                {...register('notes')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving...' : 'Update Expense'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-destructive flex items-center space-x-2">
              <Trash2 className="h-5 w-5" />
              <span>Delete Expense</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete this expense? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
