import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Calendar, Tag, CreditCard, FileText, ArrowLeft } from 'lucide-react'
import { useExpenses } from '@/hooks/useExpenses'
import { useSettings } from '@/hooks/useSettings'
import { WorkerSelect } from '@/components/WorkerSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { getTodayIso } from '@/lib/utils'
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

export const AddExpense: React.FC = () => {
  const { addExpense } = useExpenses()
  const { categories, paymentModes } = useSettings()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      date: getTodayIso(),
      category: 'Grocery',
      product_name: '',
      amount: '' as unknown as number,
      worker_name: '',
      payment_mode: 'Cash',
      description: '',
      notes: '',
    },
  })

  const currentCategory = watch('category')
  const currentPaymentMode = watch('payment_mode')

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await addExpense({
        date: data.date,
        category: data.category,
        product_name: data.product_name?.trim() || null,
        amount: data.amount,
        worker_name: data.worker_name?.trim() || null,
        payment_mode: data.payment_mode || 'Cash',
        description: data.description?.trim() || null,
        notes: data.notes?.trim() || null,
      })

      toast.success('✅ Expense added')

      // Reset form but retain category, payment mode, and date for rapid logging
      reset({
        date: data.date,
        category: currentCategory,
        product_name: '',
        amount: '' as unknown as number,
        worker_name: '',
        payment_mode: currentPaymentMode,
        description: '',
        notes: '',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add expense'
      toast.error(msg)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <PlusCircle className="h-6 w-6 text-primary" />
            <span>Add New Expense</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Log grocery, painting, renovation, or household payments
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/expenses')}
          className="hidden sm:flex items-center space-x-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All Expenses</span>
        </Button>
      </div>

      <Card className="shadow-md border-border/80">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Amount Field (Hero Input) */}
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
                  placeholder="0"
                  {...register('amount')}
                  className="w-full bg-background rounded-lg pl-10 pr-4 py-3 text-2xl font-bold tabular-nums border border-input focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  autoFocus
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Date and Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
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

              {/* Category */}
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
                {errors.category && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <Label htmlFor="product_name">Product / Item Name</Label>
              <Input
                id="product_name"
                placeholder="e.g. Vegetables, Hall Paint, Balcony Glass, Petrol"
                {...register('product_name')}
              />
            </div>

            {/* Worker / Vendor Field (CRITICAL) */}
            <div className="space-y-1.5">
              <Label htmlFor="worker_name">Worker / Contractor / Vendor</Label>
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
              <p className="text-[11px] text-muted-foreground">
                Select a worker to automatically build their personal ledger and expense history.
              </p>
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

            {/* Description (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Description (Optional)</span>
              </Label>
              <textarea
                id="description"
                rows={2}
                placeholder="e.g. 20L drum, 3 bags cement, weekly vegetables"
                {...register('description')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Notes (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                rows={2}
                placeholder="e.g. Bill paid via Dad's phone, cash given to Ramesh"
                {...register('notes')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold shadow-md active:scale-98"
              >
                {isSubmitting ? 'Saving Expense...' : 'Save Expense (Stay on page)'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
