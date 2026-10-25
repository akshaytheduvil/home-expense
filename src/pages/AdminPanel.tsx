import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ShieldAlert,
  Users,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  CheckCircle2,
  Phone,
  Lock,
  Edit2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Account } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export const AdminPanel: React.FC = () => {
  const { isAdmin, accounts, createCustomerAccount, updateAccount, deleteAccount } = useAuth()

  // New Customer Form State
  const [newUsername, setNewUsername] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Edit Customer Modal / State
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editPin, setEditPin] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Show/Hide PIN toggles
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({})

  // Security check: only admin can view this page
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopyCredentials = (acc: Account) => {
    const text = `Home Expense Login\nUsername: ${acc.username}\n4-Digit PIN: ${acc.pin}\nWebsite: https://akshaytheduvil.github.io/home-expense/`
    navigator.clipboard.writeText(text)
    toast.success(`Copied login details for ${acc.displayName} to clipboard!`)
  }

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString()
    setNewPin(randomPin)
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim()) {
      toast.error('Customer username is required')
      return
    }
    if (!/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be exactly 4 digits')
      return
    }

    setIsCreating(true)
    const result = await createCustomerAccount({
      username: newUsername,
      displayName: newDisplayName.trim() || newUsername.trim(),
      pin: newPin,
      phone: newPhone || null,
      notes: newNotes || null,
    })
    setIsCreating(false)

    if (result.success && result.account) {
      toast.success(
        `Customer "${result.account.displayName}" created with PIN: ${result.account.pin}!`
      )
      setNewUsername('')
      setNewDisplayName('')
      setNewPin('')
      setNewPhone('')
      setNewNotes('')
    } else {
      toast.error(result.error || 'Failed to create customer account')
    }
  }

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc)
    setEditUsername(acc.username)
    setEditDisplayName(acc.displayName)
    setEditPin(acc.pin)
    setEditPhone(acc.phone || '')
    setEditNotes(acc.notes || '')
  }

  const handleSaveEdit = async () => {
    if (!editingAccount) return
    if (!editUsername.trim()) {
      toast.error('Username cannot be empty')
      return
    }
    if (!/^\d{4}$/.test(editPin)) {
      toast.error('PIN must be exactly 4 digits')
      return
    }

    const success = await updateAccount(editingAccount.id, {
      username: editUsername,
      displayName: editDisplayName.trim() || editUsername.trim(),
      pin: editPin,
      phone: editPhone.trim() || null,
      notes: editNotes.trim() || null,
    })

    if (success) {
      toast.success(`Updated account for ${editDisplayName}`)
      setEditingAccount(null)
    } else {
      toast.error('Failed to update account')
    }
  }

  const customerAccounts = accounts.filter((a) => a.id !== 'primary')
  const primaryAccount = accounts.find((a) => a.id === 'primary')

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <span>Live Admin Panel</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your customers, provision usernames, issue 4-digit PINs, and oversee access.
          </p>
        </div>

        <Badge variant="blue" className="w-fit text-xs py-1 px-3">
          Admin: {primaryAccount?.displayName} (PIN: {primaryAccount?.pin})
        </Badge>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center space-x-3 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {customerAccounts.length}
            </div>
            <div className="text-xs text-muted-foreground">Active Customers</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-3 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{accounts.length}</div>
            <div className="text-xs text-muted-foreground">Total Ledgers Protected</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-3 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">Complete Isolation</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Zero data overlap between accounts
            </div>
          </div>
        </Card>
      </div>

      {/* Create New Customer Form */}
      <Card className="shadow-sm border-primary/30 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Plus className="h-4 w-4 text-primary" />
            <span>Create New Customer Account</span>
          </CardTitle>
          <CardDescription className="text-xs">
            When a customer enquires, generate their login credentials here. They can easily edit their family name later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="cust-username" className="text-xs">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cust-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. rahul or sunny"
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cust-family" className="text-xs">
                  Family / Display Name
                </Label>
                <Input
                  id="cust-family"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Rahul Family"
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="cust-pin" className="text-xs">
                    4-Digit Password / PIN <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    Randomize
                  </button>
                </div>
                <Input
                  id="cust-pin"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="e.g. 1234"
                  className="h-9 text-xs font-mono font-bold mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cust-phone" className="text-xs">
                  Phone (Optional)
                </Label>
                <Input
                  id="cust-phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cust-notes" className="text-xs">
                Admin Notes / Remarks (Only visible to you)
              </Label>
              <Input
                id="cust-notes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Friend from town, monthly enquiry, cash paid"
                className="h-9 text-xs mt-1"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" disabled={isCreating} className="text-xs">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Create & Issue Credentials</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Customer Directory Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <span>Customer Directory & Credentials ({customerAccounts.length})</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Review all issued customer credentials. You can copy details to send to customers or reset their PINs anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customerAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
              No customer accounts created yet. Use the form above to add your first customer.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">Username</TableHead>
                    <TableHead>Family / Display Name</TableHead>
                    <TableHead className="w-40">Password / PIN</TableHead>
                    <TableHead className="w-40">Contact / Notes</TableHead>
                    <TableHead className="w-28">Created</TableHead>
                    <TableHead className="w-32 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerAccounts.map((cust) => {
                    const isPinVisible = visiblePins[cust.id]

                    return (
                      <TableRow key={cust.id} className="hover:bg-accent/40">
                        <TableCell className="font-semibold text-xs font-mono text-primary">
                          @{cust.username}
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-foreground text-xs">
                            {cust.displayName}
                          </div>
                          <span className="text-[10px] text-muted-foreground">Private Ledger</span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm tracking-wider text-foreground">
                              {isPinVisible ? cust.pin : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePinVisibility(cust.id)}
                              className="text-muted-foreground hover:text-foreground p-1"
                              title={isPinVisible ? 'Hide PIN' : 'Show PIN'}
                            >
                              {isPinVisible ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(cust)}
                              className="text-muted-foreground hover:text-primary p-1"
                              title="Copy Login Details"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs text-foreground truncate max-w-xs">
                            {cust.phone && (
                              <span className="flex items-center space-x-1 text-muted-foreground text-[11px]">
                                <Phone className="h-3 w-3" />
                                <span>{cust.phone}</span>
                              </span>
                            )}
                            {cust.notes && (
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {cust.notes}
                              </span>
                            )}
                            {!cust.phone && !cust.notes && (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(cust.createdAt.slice(0, 10))}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(cust)}
                              title="Edit Credentials"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (
                                  confirm(
                                    `Are you sure you want to permanently delete customer account "${cust.displayName}"?`
                                  )
                                ) {
                                  await deleteAccount(cust.id)
                                  toast.success(`Account "${cust.displayName}" deleted`)
                                }
                              }}
                              title="Delete Customer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <span>Edit Credentials for {editingAccount.displayName}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Username</Label>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Family / Display Name</Label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">4-Digit Password / PIN</Label>
                <Input
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="h-9 text-xs font-mono font-bold mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Phone (Optional)</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Admin Notes</Label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingAccount(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
