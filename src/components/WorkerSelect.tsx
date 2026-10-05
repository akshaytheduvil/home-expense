import React, { useState, useMemo, useRef, useEffect } from 'react'
import { HardHat, Plus, Check, ChevronDown, Search, X } from 'lucide-react'
import { useWorkers } from '@/hooks/useWorkers'
import { AddWorkerModal } from '@/components/AddWorkerModal'
import { Worker } from '@/types'
import { cn } from '@/lib/utils'

interface WorkerSelectProps {
  value?: string | null
  onChange: (workerName: string) => void
  disabled?: boolean
  error?: string
}

export const WorkerSelect: React.FC<WorkerSelectProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const { workers, loading, fetchWorkers } = useWorkers()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sort workers alphabetically
  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a, b) => a.name.localeCompare(b.name))
  }, [workers])

  // Filter workers if > 8
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return sortedWorkers
    return sortedWorkers.filter((w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
  }, [sortedWorkers, searchQuery])

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const handleSelect = (workerName: string) => {
    onChange(workerName)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleWorkerCreated = (newWorker: Worker) => {
    fetchWorkers()
    onChange(newWorker.name)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left',
          error && 'border-destructive ring-destructive'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center space-x-2 truncate">
          <HardHat className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value || 'Select worker / vendor (optional)'}
          </span>
        </span>
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="p-1 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar if workers > 8 */}
          {sortedWorkers.length > 8 && (
            <div className="p-2 border-b border-border bg-muted/40">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search worker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground border border-input focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* List of Workers */}
          <div className="overflow-y-auto max-h-48 py-1 divide-y divide-border/30">
            {loading ? (
              <div className="py-4 text-center text-xs text-muted-foreground">Loading workers...</div>
            ) : filteredWorkers.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No workers found matching "{searchQuery}"
              </div>
            ) : (
              filteredWorkers.map((worker) => {
                const isSelected = value === worker.name
                return (
                  <button
                    key={worker.id}
                    type="button"
                    onClick={() => handleSelect(worker.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm hover:bg-accent/60 transition-colors text-left',
                      isSelected && 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                    )}
                  >
                    <span className="flex items-center space-x-2 truncate">
                      <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[11px] font-bold shrink-0">
                        {worker.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{worker.name}</span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Sticky Bottom Action: "➕ Add new worker" */}
          <div className="border-t border-border p-1.5 bg-muted/20">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setIsModalOpen(true)
              }}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>➕ Add new worker</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      <AddWorkerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onWorkerCreated={handleWorkerCreated}
      />
    </div>
  )
}
