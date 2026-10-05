export interface Worker {
  id: string
  name: string
  phone?: string | null
  notes?: string | null
  created_at?: string
}

export interface Expense {
  id: string
  date: string
  category: string
  product_name?: string | null
  amount: number
  worker_name?: string | null
  payment_mode?: string | null
  description?: string | null
  notes?: string | null
  created_at?: string
}

export interface SettingItem<T = unknown> {
  id: string
  key: string
  value: T
  updated_at?: string
}

export interface ExpenseFilters {
  search: string
  dateFrom: string
  dateTo: string
  categories: string[]
  workerName: string
  paymentMode: string
}

export type TimeRangeOption =
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'all_time'
  | 'custom'

export interface WorkerStat extends Worker {
  totalSpent: number
  transactionCount: number
  lastPaymentDate?: string | null
}
