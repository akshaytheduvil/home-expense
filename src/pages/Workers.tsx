import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HardHat,
  Plus,
  ArrowRight,
  Phone,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useWorkers } from '@/hooks/useWorkers'
import { useExpenses } from '@/hooks/useExpenses'
import { Worker, WorkerStat } from '@/types'
import { AddWorkerModal } from '@/components/AddWorkerModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export const Workers: React.FC = () => {
  const { workers, loading: workersLoading, updateWorker, deleteWorker, fetchWorkers } = useWorkers()
  const { expenses, loading: expensesLoading } = useExpenses()
  const navigate = useNavigate()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [workerToDelete, setWorkerToDelete] = useState<WorkerStat | null>(null)

  // Compute stats per worker: total spent, transaction count, last payment
  const workerStats: WorkerStat[] = useMemo(() => {
    return workers.map((worker) => {
      const linked = expenses.filter(
        (e) => e.worker_name && e.worker_name.toLowerCase() === worker.name.toLowerCase()
      )
      const totalSpent = linked.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      const transactionCount = linked.length

      // Find latest transaction
      let lastPaymentDate: string | null = null
      let lastPaymentAmount = 0
      if (linked.length > 0) {
        const sorted = [...linked].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        lastPaymentDate = sorted[0].date
        lastPaymentAmount = Number(sorted[0].amount) || 0
      }

      return {
        ...worker,
        totalSpent,
        transactionCount,
        lastPaymentDate,
        lastPaymentAmount,
      } as WorkerStat & { lastPaymentAmount: number }
    })
  }, [workers, expenses])

  const handleEditClick = (worker: Worker) => {
    setWorkerToEdit(worker)
    setEditName(worker.name)
    setEditPhone(worker.phone || '')
    setEditNotes(worker.notes || '')
  }

  const handleSaveEdit = async () => {
    if (!workerToEdit) return
    const trimmed = editName.trim()
    if (!trimmed) {
      toast.error('Worker name is required')
      return
    }

    try {
      await updateWorker(workerToEdit.id, {
        name: trimmed,
        phone: editPhone.trim() || null,
        notes: editNotes.trim() || null,
      })
      toast.success('Worker details updated')
      setWorkerToEdit(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed'
      toast.error(msg)
    }
  }

  const confirmDeleteWorker = async () => {
    if (!workerToDelete) return
    try {
      await deleteWorker(workerToDelete.id)
      toast.success(`Worker "${workerToDelete.name}" removed`)
      setWorkerToDelete(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      toast.error(msg)
    }
  }

  if (workersLoading || expensesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <HardHat className="h-6 w-6 text-primary" />
            <span>Workers & Vendors</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Contractors, laborers, and shops with individual payment ledgers
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center space-x-1.5 bg-primary text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add Worker</span>
        </Button>
      </div>

      {/* Workers Grid */}
      {workerStats.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
          <HardHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-base">No workers configured</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Add your painting contractor, tile master, or grocery store to track spending.
          </p>
          <Button onClick={() => setIsAddOpen(true)}>+ Add First Worker</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workerStats.map((worker) => {
            const hasActivity = worker.transactionCount > 0
            const lastItem = worker as WorkerStat & { lastPaymentAmount?: number }

            return (
              <Card
                key={worker.id}
                className="p-5 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Top row: Avatar & Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shadow-xs">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground leading-tight">
                          {worker.name}
                        </h3>
                        {worker.phone ? (
                          <a
                            href={`tel:${worker.phone}`}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center space-x-1 mt-0.5"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{worker.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Vendor</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditClick(worker)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                        title="Edit worker"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setWorkerToDelete(worker)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete worker"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes / Speciality */}
                  {worker.notes && (
                    <p className="text-xs text-muted-foreground mt-3 bg-secondary/40 p-2 rounded-lg line-clamp-2">
                      {worker.notes}
                    </p>
                  )}

                  {/* Financial Stats */}
                  <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Spent:</span>
                      <span className="font-bold text-sm text-foreground tabular-nums">
                        {formatCurrency(worker.totalSpent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Transactions:</span>
                      <span className="font-medium text-foreground">
                        {worker.transactionCount} {worker.transactionCount === 1 ? 'record' : 'records'}
                      </span>
                    </div>

                    {hasActivity && worker.lastPaymentDate && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-dashed border-border/40">
                        <span>Last payment:</span>
                        <span className="text-foreground">
                          {formatCurrency(lastItem.lastPaymentAmount || 0)} on {formatDate(worker.lastPaymentDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Ledger Action Link */}
                <div className="mt-5 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-1.5 text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
                    onClick={() => navigate(`/workers/${worker.id}`)}
                  >
                    <span>View Ledger</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Worker Modal */}
      <AddWorkerModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onWorkerCreated={() => {
          fetchWorkers()
        }}
      />

      {/* Edit Worker Dialog */}
      {workerToEdit && (
        <Dialog open={Boolean(workerToEdit)} onOpenChange={() => setWorkerToEdit(null)}>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Worker Details</DialogTitle>
              <DialogDescription>
                Update worker name, phone contact, or specialization notes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="edit-name" required>Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWorkerToEdit(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}

      {/* Delete Worker Warning Dialog */}
      {workerToDelete && (
        <Dialog open={Boolean(workerToDelete)} onOpenChange={() => setWorkerToDelete(null)}>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>Delete Worker</span>
              </DialogTitle>
              <DialogDescription>
                {workerToDelete.transactionCount > 0 ? (
                  <span className="text-foreground">
                    Worker <strong>{workerToDelete.name}</strong> has{' '}
                    <strong>{workerToDelete.transactionCount} linked expenses</strong> totaling{' '}
                    <strong>{formatCurrency(workerToDelete.totalSpent)}</strong>.
                    <br />
                    Deleting this worker will remove their entry from the workers list while keeping
                    the underlying expense records intact.
                  </span>
                ) : (
                  <span>
                    Are you sure you want to remove worker <strong>{workerToDelete.name}</strong>?
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWorkerToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteWorker}>
                Delete worker but keep expenses
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </div>
  )
}
