import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  Tag,
  CreditCard,
  HardHat,
  Database,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Plus,
  ArrowRight,
  AlertTriangle,
  FileSpreadsheet,
  Smartphone,
  Info,
  User,
  Users,
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useWorkers } from '@/hooks/useWorkers'
import { useExpenses } from '@/hooks/useExpenses'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { exportToCsv, downloadJson, formatCurrency, cn } from '@/lib/utils'
import { parseAndCleanCsv } from '@/lib/csvParser'
import { toast } from 'sonner'

export const Settings: React.FC = () => {
  const navigate = useNavigate()
  const { categories, paymentModes, addCategory, removeCategory, addPaymentMode, removePaymentMode } = useSettings()
  const { workers, ensureWorkersExist } = useWorkers()
  const { expenses, bulkImportExpenses, clearAllExpenses } = useExpenses()
  const { theme, toggleTheme } = useTheme()
  const {
    currentAccount,
    accounts,
    switchAccount,
    updateAccount,
    createAccount,
    deleteAccount,
  } = useAuth()

  // Dynamic add states
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newModeName, setNewModeName] = useState('')

  // Multi-account states
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountPin, setNewAccountPin] = useState('')
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editAccName, setEditAccName] = useState('')
  const [editAccPin, setEditAccPin] = useState('')

  // Danger delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')

  // Bulk Import state
  const [csvText, setCsvText] = useState('')
  const [importStatus, setImportStatus] = useState<{ inserted: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  // PWA install prompt handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        toast.success('Home Expense added to your home screen!')
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      toast.info('To install: Open browser menu (⋮) and tap "Add to Home screen"')
    }
  }

  // Categories handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    await addCategory(newCategoryName.trim())
    toast.success(`Category "${newCategoryName.trim()}" added`)
    setNewCategoryName('')
  }

  // Payment modes handler
  const handleAddMode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newModeName.trim()) return
    await addPaymentMode(newModeName.trim())
    toast.success(`Payment mode "${newModeName.trim()}" added`)
    setNewModeName('')
  }

  // Multi-Account Action handlers
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountName.trim()) {
      toast.error('Account name is required')
      return
    }
    if (!/^\d{4}$/.test(newAccountPin)) {
      toast.error('PIN must be exactly 4 digits')
      return
    }
    const created = await createAccount(newAccountName.trim(), newAccountPin)
    if (created) {
      toast.success(`Account "${created.name}" created with PIN ${created.pin}!`)
      setNewAccountName('')
      setNewAccountPin('')
    } else {
      toast.error('Failed to create account (PIN may already be in use)')
    }
  }

  // Data Export All CSV
  const handleExportAllCsv = () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export')
      return
    }
    const rows = expenses.map((e) => ({
      ID: e.id,
      Date: e.date,
      Category: e.category,
      Product: e.product_name || '',
      Amount: e.amount,
      Worker: e.worker_name || '',
      PaymentMode: e.payment_mode || 'Cash',
      Description: e.description || '',
      Notes: e.notes || '',
      CreatedAt: e.created_at || '',
    }))
    exportToCsv(`Home_Expense_Complete_Backup_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toast.success('All expenses exported to CSV')
  }

  // Backup Full JSON
  const handleBackupJson = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      expenses,
      workers,
      settings: {
        categories,
        paymentModes,
      },
    }
    downloadJson(`Home_Expense_Backup_${new Date().toISOString().slice(0, 10)}.json`, backupData)
    toast.success('Full database backup JSON downloaded')
  }

  // Handle Sample CSV Template Download
  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        Date: '2026-10-06',
        Work: 'Labour Padav',
        'Worker Name': 'Mani',
        Expense: 2100,
        'Mode of Payment': 'Cash',
        Category: 'Renovation',
      },
      {
        Date: '2026-10-06',
        Work: 'Paint',
        'Worker Name': 'Asees',
        Expense: 40000,
        'Mode of Payment': 'Cash',
        Category: 'Painting',
      },
      {
        Date: '2026-10-06',
        Work: 'Wiring materials',
        'Worker Name': 'Sunoop',
        Expense: 1750,
        'Mode of Payment': 'UPI',
        Category: 'Renovation',
      },
    ]
    exportToCsv('Home_Expense_Template.csv', sampleRows)
    toast.success('Sample CSV template downloaded')
  }

  // Parse CSV text and trigger import
  const parseAndImportCsv = async (rawCsv: string) => {
    const { expenses: parsedRows, workers: foundWorkers, totalAmount, errors: parseErrors } =
      parseAndCleanCsv(rawCsv, categories)

    if (parsedRows.length === 0) {
      setImportStatus({ inserted: 0, errors: parseErrors })
      toast.error('No valid rows could be parsed from the CSV data')
      return
    }

    // Auto-register workers if any
    if (foundWorkers.length > 0) {
      try {
        const addedCount = await ensureWorkersExist(foundWorkers)
        if (addedCount > 0) {
          toast.info(`Registered ${addedCount} new worker(s) in directory`)
        }
      } catch (wErr) {
        console.warn('Worker auto-registration warning:', wErr)
      }
    }

    try {
      const res = await bulkImportExpenses(parsedRows)
      const combinedErrors = [...parseErrors, ...res.errors]
      setImportStatus({ inserted: res.inserted, errors: combinedErrors })

      if (res.inserted > 0) {
        toast.success(
          `Successfully imported ${res.inserted} expenses (${formatCurrency(totalAmount)})!`
        )
        setCsvText('')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      toast.error(msg)
      setImportStatus({ inserted: 0, errors: [msg] })
    }
  }

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target?.result as string
      if (text) {
        setCsvText(text)
        await parseAndImportCsv(text)
      }
    }
    reader.readAsText(file)
  }

  // Handle JSON Import
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string
        const parsed = JSON.parse(text)
        if (parsed.expenses && Array.isArray(parsed.expenses)) {
          const res = await bulkImportExpenses(parsed.expenses)
          toast.success(`Imported ${res.inserted} expenses from JSON backup`)
        } else {
          toast.error('Invalid backup JSON format')
        }
      } catch (err) {
        toast.error('Failed to parse JSON file')
      }
    }
    reader.readAsText(file)
  }

  // Confirm delete all expenses
  const handleConfirmDeleteAll = async () => {
    if (deleteConfirmationText !== 'DELETE ALL') {
      toast.error('Please type "DELETE ALL" exactly to confirm')
      return
    }
    await clearAllExpenses()
    toast.success('All expenses have been deleted')
    setIsDeleteModalOpen(false)
    setDeleteConfirmationText('')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <span>App Settings & Data Management</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Configure categories, payment modes, PIN security, and bulk data backup
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* A. CATEGORIES SECTION */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <span>Expense Categories</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Manage household spending buckets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <Input
                placeholder="New category..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-9 text-xs"
              />
              <Button type="submit" size="sm" className="h-9 px-3 shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                <span>Add</span>
              </Button>
            </form>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="inline-flex items-center space-x-1.5 bg-secondary text-foreground text-xs px-2.5 py-1 rounded-full border border-border"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="text-muted-foreground hover:text-destructive ml-1"
                    title={`Remove ${cat}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* C. PAYMENT MODES SECTION */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>Payment Modes</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Configure settlement methods (Cash, UPI, Card)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddMode} className="flex gap-2">
              <Input
                placeholder="New payment mode..."
                value={newModeName}
                onChange={(e) => setNewModeName(e.target.value)}
                className="h-9 text-xs"
              />
              <Button type="submit" size="sm" className="h-9 px-3 shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                <span>Add</span>
              </Button>
            </form>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
              {paymentModes.map((mode) => (
                <div
                  key={mode}
                  className="inline-flex items-center space-x-1.5 bg-secondary text-foreground text-xs px-2.5 py-1 rounded-full border border-border"
                >
                  <span>{mode}</span>
                  <button
                    type="button"
                    onClick={() => removePaymentMode(mode)}
                    className="text-muted-foreground hover:text-destructive ml-1"
                    title={`Remove ${mode}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* B. WORKERS QUICK LINK */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <HardHat className="h-4 w-4 text-primary" />
              <span>Workers & Vendors</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {workers.length} active workers and vendor ledgers registered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1 text-xs">
              {workers.slice(0, 6).map((w) => (
                <span
                  key={w.id}
                  className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md"
                >
                  {w.name}
                </span>
              ))}
              {workers.length > 6 && (
                <span className="text-muted-foreground text-xs py-0.5">
                  +{workers.length - 6} more
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/workers')}
              className="w-full flex items-center justify-center space-x-1.5 mt-2"
            >
              <span>Manage Workers Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* F. MULTI-ACCOUNT & SECURITY */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Accounts & Security PINs</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage separate accounts. Expenses, workers, and categories are 100% isolated and never mix.
                </CardDescription>
              </div>
              <Badge variant="blue" className="w-fit text-xs">
                Active: {currentAccount.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* List of Accounts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accounts.map((acc) => {
                const isActive = acc.id === currentAccount.id
                const isEditing = editingAccountId === acc.id

                return (
                  <div
                    key={acc.id}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3',
                      isActive
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-card hover:bg-accent/30'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={cn(
                            'h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-foreground'
                          )}
                        >
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground flex items-center space-x-1.5">
                            <span>{acc.name}</span>
                            {isActive && (
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            PIN: <strong className="font-mono text-foreground">{acc.pin}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingAccountId(acc.id)
                              setEditAccName(acc.name)
                              setEditAccPin(acc.pin)
                            }}
                          >
                            Edit
                          </Button>
                        )}
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs text-primary"
                            onClick={() => {
                              switchAccount(acc.id)
                              toast.success(`Switched to "${acc.name}"`)
                            }}
                          >
                            Switch
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Inline Edit Form for this Account */}
                    {isEditing && (
                      <div className="pt-2 border-t border-border space-y-2 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">Account Name</Label>
                            <Input
                              value={editAccName}
                              onChange={(e) => setEditAccName(e.target.value)}
                              placeholder="Account name"
                              className="h-8 text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">4-Digit PIN</Label>
                            <Input
                              value={editAccPin}
                              onChange={(e) =>
                                setEditAccPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                              }
                              maxLength={4}
                              placeholder="PIN"
                              className="h-8 text-xs font-mono mt-0.5"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {accounts.length > 1 && !acc.isDefault ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (confirm(`Delete account "${acc.name}"?`)) {
                                  await deleteAccount(acc.id)
                                  setEditingAccountId(null)
                                  toast.success('Account removed')
                                }
                              }}
                            >
                              Delete
                            </Button>
                          ) : (
                            <div />
                          )}

                          <div className="flex space-x-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditingAccountId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 px-2.5 text-xs"
                              onClick={async () => {
                                if (!editAccName.trim()) {
                                  toast.error('Account name is required')
                                  return
                                }
                                if (!/^\d{4}$/.test(editAccPin)) {
                                  toast.error('PIN must be exactly 4 digits')
                                  return
                                }
                                const ok = await updateAccount(acc.id, {
                                  name: editAccName,
                                  pin: editAccPin,
                                })
                                if (ok) {
                                  setEditingAccountId(null)
                                  toast.success(`Account "${editAccName}" updated`)
                                } else {
                                  toast.error('Failed to update account')
                                }
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Create New Account */}
            <div className="pt-3 border-t border-border">
              <h5 className="text-xs font-semibold text-foreground mb-2 flex items-center space-x-1.5">
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Create New Account</span>
              </h5>
              <form onSubmit={handleCreateAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. Friend, Office, Home 2"
                  className="h-9 text-xs"
                />
                <Input
                  value={newAccountPin}
                  onChange={(e) =>
                    setNewAccountPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  maxLength={4}
                  placeholder="New 4-digit PIN"
                  className="h-9 text-xs font-mono"
                />
                <Button type="submit" size="sm" className="h-9 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Add Account</span>
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* D & 14. BULK IMPORT & DATA MANAGEMENT */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Database className="h-4 w-4 text-primary" />
            <span>Data Import, Export & Backup</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Export full history, restore JSON backups, or bulk import CSV records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export / Backup Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAllCsv}
              className="flex items-center space-x-2 justify-start h-10"
            >
              <Download className="h-4 w-4 text-blue-600" />
              <span>Export All CSV ({expenses.length})</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBackupJson}
              className="flex items-center space-x-2 justify-start h-10"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Backup Full JSON</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => jsonInputRef.current?.click()}
              className="flex items-center space-x-2 justify-start h-10"
            >
              <Upload className="h-4 w-4 text-primary" />
              <span>Import JSON Backup</span>
            </Button>
            <input
              type="file"
              ref={jsonInputRef}
              onChange={handleJsonUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Bulk Import CSV Section */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold flex items-center space-x-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  <span>Bulk Import Expenses (Paste or Upload CSV)</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Supports flexible headers: <code className="bg-secondary px-1 py-0.5 rounded font-mono text-[11px]">Date, Work, Worker Name, Expense, Mode of Payment</code>
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-1 text-xs"
                  title="Download a starter CSV template"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Download Template</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 text-xs"
                >
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  <span>Upload .csv File</span>
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
            </div>

            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`date,category,product,amount,worker,mode,desc\n2026-10-05,Grocery,Vegetables,600,Marvel,UPI,Weekly\n2026-10-05,Painting,Hall paint,1500,Period,Cash,Primer 20L`}
              className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono focus:ring-2 focus:ring-primary focus:outline-none"
            />

            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!csvText.trim()}
                onClick={() => parseAndImportCsv(csvText)}
                className="flex items-center space-x-1.5"
              >
                <Upload className="h-4 w-4" />
                <span>Process & Import CSV</span>
              </Button>
            </div>

            {/* Import Status Message */}
            {importStatus && (
              <div className="p-3 bg-secondary/60 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-foreground">
                  Import Results: {importStatus.inserted} rows inserted successfully.
                </p>
                {importStatus.errors.length > 0 && (
                  <div className="text-destructive space-y-0.5 pt-1">
                    <p className="font-medium">{importStatus.errors.length} errors encountered:</p>
                    <ul className="list-disc pl-4 max-h-24 overflow-y-auto">
                      {importStatus.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danger Zone: Delete All Expenses */}
          <div className="pt-4 border-t border-destructive/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-destructive flex items-center space-x-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>Danger Zone</span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently purge all expense entries from the system
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center space-x-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All Expenses</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* E. APP & PWA SECTION */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center space-x-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <span>App Preferences & PWA Installation</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Offline capability, display modes, and version information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <span className="font-semibold text-sm block">Dark Mode</span>
              <span className="text-xs text-muted-foreground">
                Toggle dark fintech color palette
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center space-x-1.5"
            >
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <span className="font-semibold text-sm block">Install Mobile App (PWA)</span>
              <span className="text-xs text-muted-foreground">
                {isInstalled
                  ? 'App installed and running in standalone mode'
                  : 'Add to home screen for fullscreen mobile experience'}
              </span>
            </div>
            <Button
              variant={isInstalled ? 'secondary' : 'default'}
              size="sm"
              disabled={isInstalled}
              onClick={handleInstallPwa}
              className="flex items-center space-x-1.5"
            >
              <Smartphone className="h-4 w-4" />
              <span>{isInstalled ? 'Installed' : 'Install App'}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Info className="h-3.5 w-3.5" />
              <span>Version 1.0.0 (Production Build)</span>
            </span>
            <span>React 18 + Supabase + Tailwind CSS</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete All Confirmation Dialog */}
      {isDeleteModalOpen && (
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>Confirm Complete Expense Purge</span>
              </DialogTitle>
              <DialogDescription>
                This will permanently delete all {expenses.length} expense records. This action
                CANNOT be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="confirm-delete-text">
                Type <strong>DELETE ALL</strong> below to confirm:
              </Label>
              <Input
                id="confirm-delete-text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE ALL"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setDeleteConfirmationText('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmationText !== 'DELETE ALL'}
                onClick={handleConfirmDeleteAll}
              >
                Permanently Delete All
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </div>
  )
}
