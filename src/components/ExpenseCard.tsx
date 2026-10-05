import React, { useState } from 'react'
import { Expense } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  HardHat,
  CreditCard,
} from 'lucide-react'

interface ExpenseCardProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDuplicate: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Card className="p-4 relative transition-all hover:border-blue-500/30">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Category & Date */}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Badge variant="blue" className="text-[10px] py-0 px-2 font-medium">
              {expense.category}
            </Badge>
            <span>•</span>
            <span>{formatDate(expense.date)}</span>
          </div>

          {/* Product Name */}
          <h4 className="font-semibold text-base text-foreground leading-snug truncate">
            {expense.product_name || expense.category}
          </h4>

          {/* Description or Notes */}
          {(expense.description || expense.notes) && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {expense.description || expense.notes}
            </p>
          )}

          {/* Worker and Payment Mode Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            {expense.worker_name && (
              <span className="inline-flex items-center space-x-1 bg-secondary/80 px-2 py-0.5 rounded-md text-[11px] font-medium text-foreground">
                <HardHat className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span>{expense.worker_name}</span>
              </span>
            )}
            {expense.payment_mode && (
              <span className="inline-flex items-center space-x-1 bg-secondary/50 px-2 py-0.5 rounded-md text-[11px]">
                <CreditCard className="h-3 w-3 opacity-60" />
                <span>{expense.payment_mode}</span>
              </span>
            )}
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex flex-col items-end justify-between shrink-0 space-y-3">
          <span className="text-base sm:text-lg font-bold text-foreground tabular-nums">
            {formatCurrency(expense.amount)}
          </span>

          {/* Action trigger menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none"
              aria-label="Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-border bg-card shadow-xl py-1 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit(expense)
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-accent text-foreground text-left"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onDuplicate(expense)
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-accent text-foreground text-left"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Duplicate</span>
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete(expense)
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-destructive/10 text-destructive text-left font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
