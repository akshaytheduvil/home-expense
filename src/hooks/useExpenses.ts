import { useState, useEffect, useCallback } from 'react'
import { Expense } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { STORAGE_KEYS } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'

function matchesAccount(item: any, accId: string): boolean {
  if (item.account_id) {
    return item.account_id === accId
  }
  // Fallback for pre-migration data
  if (accId === 'primary') {
    return !item.notes?.startsWith('[acc:')
  }
  return item.notes?.startsWith(`[acc:${accId}]`)
}

function cleanNotes(notes?: string | null): string | null {
  if (!notes) return null
  return notes.replace(/^\[acc:[^\]]+\]\s*/, '') || null
}

export function useExpenses() {
  const { currentAccount } = useAuth()
  const accountId = currentAccount?.id || 'primary'

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  const storageKey = `${STORAGE_KEYS.LOCAL_EXPENSES}_${accountId}`

  // Local storage management
  const getLocalExpenses = useCallback((): Expense[] => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.some((e: any) => e.id?.startsWith('exp-'))) {
          localStorage.setItem(storageKey, JSON.stringify([]))
          return []
        }
        return parsed
      }
    } catch (e) {
      console.warn('Failed to parse local expenses:', e)
    }
    localStorage.setItem(storageKey, JSON.stringify([]))
    return []
  }, [storageKey])

  const saveLocalExpenses = useCallback((items: Expense[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch (e) {
      console.warn('Failed to save local expenses:', e)
    }
    setExpenses(items)
  }, [storageKey])

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    if (!isSupabaseConfigured) {
      const local = getLocalExpenses()
      local.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setExpenses(local)
      setIsLive(true)
      setLoading(false)
      return
    }

    try {
      // 1. Query with account_id filter if column exists
      let query = supabase.from('expenses').select('*')
      if (accountId === 'primary') {
        query = query.or('account_id.eq.primary,account_id.is.null')
      } else {
        query = query.eq('account_id', accountId)
      }

      let { data, error } = await query.order('date', { ascending: false })

      // 2. Fallback if account_id column is not yet in Postgres schema
      if (error && error.code === 'PGRST204') {
        const fallback = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false })

        if (fallback.error) throw fallback.error

        data = (fallback.data || [])
          .filter((item) => matchesAccount(item, accountId))
          .map((item) => ({
            ...item,
            notes: cleanNotes(item.notes),
          }))
      } else if (error) {
        throw error
      } else if (data) {
        data = data.map((item) => ({
          ...item,
          notes: cleanNotes(item.notes),
        }))
      }

      setExpenses(data || [])
      setIsLive(true)
    } catch (err) {
      console.warn('Supabase fetchExpenses failed, falling back to local:', err)
      const local = getLocalExpenses()
      setExpenses(local)
      setIsLive(true)
    } finally {
      setLoading(false)
    }
  }, [accountId, getLocalExpenses])

  useEffect(() => {
    fetchExpenses()

    // Listen for cross-tab updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setExpenses(JSON.parse(e.newValue))
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Setup Supabase Real-Time Channel
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel(`expenses-changes-${accountId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newRecord = payload.new as any
              if (!matchesAccount(newRecord, accountId)) return

              const cleaned: Expense = {
                ...newRecord,
                notes: cleanNotes(newRecord.notes),
              }
              setExpenses((prev) => {
                if (prev.some((e) => e.id === cleaned.id)) return prev
                return [cleaned, ...prev].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )
              })
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as any
              if (!matchesAccount(updated, accountId)) {
                setExpenses((prev) => prev.filter((e) => e.id !== updated.id))
                return
              }
              const cleaned: Expense = {
                ...updated,
                notes: cleanNotes(updated.notes),
              }
              setExpenses((prev) =>
                prev.map((e) => (e.id === cleaned.id ? cleaned : e))
              )
            } else if (payload.eventType === 'DELETE') {
              const deleted = payload.old as { id: string }
              setExpenses((prev) => prev.filter((e) => e.id !== deleted.id))
            }
          }
        )
        .subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED')
        })

      return () => {
        supabase.removeChannel(channel)
        window.removeEventListener('storage', handleStorageChange)
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [accountId, fetchExpenses, storageKey])

  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'created_at'>
  ): Promise<Expense> => {
    if (!isSupabaseConfigured) {
      const newExpense: Expense = {
        ...expenseData,
        account_id: accountId,
        id: 'exp_' + Date.now(),
        created_at: new Date().toISOString(),
      }
      const updated = [newExpense, ...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      saveLocalExpenses(updated)
      return newExpense
    }

    // Try inserting with native account_id column
    const insertPayload: any = {
      ...expenseData,
      account_id: accountId,
    }

    let { data, error } = await supabase
      .from('expenses')
      .insert([insertPayload])
      .select()
      .single()

    // Fallback if column does not exist yet
    if (error && error.code === 'PGRST204') {
      const tag = accountId === 'primary' ? '' : `[acc:${accountId}] `
      const notes = (tag + (expenseData.notes || '')).trim() || null

      const fallbackPayload = {
        date: expenseData.date,
        category: expenseData.category,
        product_name: expenseData.product_name || null,
        amount: expenseData.amount,
        worker_name: expenseData.worker_name || null,
        payment_mode: expenseData.payment_mode || 'Cash',
        description: expenseData.description || null,
        notes,
      }

      const res = await supabase.from('expenses').insert([fallbackPayload]).select().single()
      if (res.error) throw res.error
      data = { ...res.data, notes: cleanNotes(res.data.notes) }
    } else if (error) {
      throw error
    }

    const cleanedData: Expense = {
      ...data,
      notes: cleanNotes(data.notes),
    }

    setExpenses((prev) => {
      if (prev.some((e) => e.id === cleanedData.id)) return prev
      return [cleanedData, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    })
    return cleanedData
  }

  const updateExpense = async (
    id: string,
    updates: Partial<Expense>
  ): Promise<void> => {
    if (!isSupabaseConfigured) {
      const updated = expenses.map((e) => (e.id === id ? { ...e, ...updates } : e))
      saveLocalExpenses(updated)
      return
    }

    let updatePayload: any = { ...updates }
    if (accountId !== 'primary' && updates.notes !== undefined) {
      updatePayload.notes = `[acc:${accountId}] ${updates.notes || ''}`.trim() || null
    }

    const { error } = await supabase.from('expenses').update(updatePayload).eq('id', id)
    if (error) throw error

    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...updates, notes: cleanNotes(updates.notes ?? e.notes) } : e
      )
    )
  }

  const deleteExpense = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      const updated = expenses.filter((e) => e.id !== id)
      saveLocalExpenses(updated)
      return
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error

    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const clearAllExpenses = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      saveLocalExpenses([])
      return
    }

    // Strictly scope delete operation to active account ONLY
    if (accountId === 'primary') {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .or('account_id.eq.primary,account_id.is.null')

      // Fallback if column not yet in DB: delete items for this account
      if (error && error.code === 'PGRST204') {
        const ids = expenses.map((e) => e.id)
        if (ids.length > 0) {
          await supabase.from('expenses').delete().in('id', ids)
        }
      } else if (error) {
        throw error
      }
    } else {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('account_id', accountId)

      if (error && error.code === 'PGRST204') {
        const ids = expenses.map((e) => e.id)
        if (ids.length > 0) {
          await supabase.from('expenses').delete().in('id', ids)
        }
      } else if (error) {
        throw error
      }
    }

    setExpenses([])
  }

  const bulkImportExpenses = async (
    items: Omit<Expense, 'id' | 'created_at'>[]
  ): Promise<{ inserted: number; errors: string[] }> => {
    const errors: string[] = []
    const validItems: Omit<Expense, 'id' | 'created_at'>[] = []

    items.forEach((item, idx) => {
      if (!item.date || !item.category || !item.amount || item.amount <= 0) {
        errors.push(`Row ${idx + 1}: Invalid date, category, or amount`)
      } else {
        validItems.push({
          ...item,
          account_id: accountId,
        })
      }
    })

    if (validItems.length === 0) {
      return { inserted: 0, errors }
    }

    if (!isSupabaseConfigured) {
      const created: Expense[] = validItems.map((v, i) => ({
        ...v,
        id: 'exp_' + (Date.now() + i),
        created_at: new Date().toISOString(),
      }))
      const updated = [...created, ...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      saveLocalExpenses(updated)
      return { inserted: created.length, errors }
    }

    const { error } = await supabase.from('expenses').insert(validItems)

    if (error && error.code === 'PGRST204') {
      // Fallback if column not yet added
      const tag = accountId === 'primary' ? '' : `[acc:${accountId}] `
      const fallbackItems = validItems.map((v) => ({
        date: v.date,
        category: v.category,
        product_name: v.product_name || null,
        amount: v.amount,
        worker_name: v.worker_name || null,
        payment_mode: v.payment_mode || 'Cash',
        description: v.description || null,
        notes: (tag + (v.notes || '')).trim() || null,
      }))
      const fallbackRes = await supabase.from('expenses').insert(fallbackItems)
      if (fallbackRes.error) throw fallbackRes.error
    } else if (error) {
      throw error
    }

    await fetchExpenses()
    return { inserted: validItems.length, errors }
  }

  return {
    expenses,
    loading,
    isLive,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
    bulkImportExpenses,
  }
}
