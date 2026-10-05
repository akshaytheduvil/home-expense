import React, { useState } from 'react'
import { Search, Filter, X, ChevronDown, RotateCcw } from 'lucide-react'
import { ExpenseFilters, Worker } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  filters: ExpenseFilters
  onFiltersChange: (filters: ExpenseFilters) => void
  categories: string[]
  workers: Worker[]
  paymentModes: string[]
  totalMatches?: number
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  categories,
  workers,
  paymentModes,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    filters.categories.length +
    (filters.workerName ? 1 : 0) +
    (filters.paymentMode ? 1 : 0)

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      dateFrom: '',
      dateTo: '',
      categories: [],
      workerName: '',
      paymentMode: '',
    })
  }

  const toggleCategory = (cat: string) => {
    const isSelected = filters.categories.includes(cat)
    const newCats = isSelected
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat]
    onFiltersChange({ ...filters, categories: newCats })
  }

  return (
    <div className="space-y-3 bg-card border border-border rounded-xl p-3 sm:p-4 shadow-xs">
      {/* Top Search & Toggle Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product, note, or description..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 h-10 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Expand Button */}
        <Button
          variant={isOpen || activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-10 px-3 flex items-center space-x-1.5 shrink-0"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-white text-blue-600 text-xs font-bold flex items-center justify-center ml-1">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-10 px-2 text-muted-foreground hover:text-foreground"
            title="Clear all filters"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      <div className={cn('space-y-4 pt-2 border-t border-border/60', !isOpen && 'hidden md:block')}>
        {/* Date Range, Worker, Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Date From */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          {/* Worker Select */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Worker / Vendor</label>
            <select
              value={filters.workerName}
              onChange={(e) => onFiltersChange({ ...filters, workerName: e.target.value })}
              className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Mode</label>
            <select
              value={filters.paymentMode}
              onChange={(e) => onFiltersChange({ ...filters, paymentMode: e.target.value })}
              className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">All Modes</option>
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-select Category Chips */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Filter by Category (Multi-select)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = filters.categories.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-secondary/60 text-muted-foreground border-transparent hover:bg-secondary'
                  )}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
