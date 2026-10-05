import React, { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkers } from '@/hooks/useWorkers'
import { Worker } from '@/types'
import { toast } from 'sonner'
import { UserPlus, Phone, FileText } from 'lucide-react'

interface AddWorkerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWorkerCreated: (worker: Worker) => void
}

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  open,
  onOpenChange,
  onWorkerCreated,
}) => {
  const { addWorker } = useWorkers()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Worker / Vendor name is required')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const created = await addWorker(trimmedName, phone.trim() || null, notes.trim() || null)
      toast.success(`Worker "${created.name}" added successfully`)
      onWorkerCreated(created)
      setName('')
      setPhone('')
      setNotes('')
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add worker'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-primary">
            <UserPlus className="h-5 w-5" />
            <span>Add New Worker / Vendor</span>
          </DialogTitle>
          <DialogDescription>
            Add a contractor, laborer, vendor, or store for expense attribution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="worker-name" required>
              Name
            </Label>
            <Input
              id="worker-name"
              placeholder="e.g. Ramesh Painter, Marvel Tiles"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              autoFocus
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="worker-phone">
              <span className="flex items-center space-x-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Phone (Optional)</span>
              </span>
            </Label>
            <Input
              id="worker-phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="worker-notes">
              <span className="flex items-center space-x-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Notes / Specialty (Optional)</span>
              </span>
            </Label>
            <Input
              id="worker-notes"
              placeholder="e.g. Balcony railing, plumbing fixtures"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Save Worker'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
