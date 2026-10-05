import { useState, useEffect, useCallback } from 'react'
import { Expense } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { STORAGE_KEYS } from '@/lib/constants'

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  // Local storage management
  const getLocalExpenses = (): Expense[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_EXPENSES)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Purge old demo seeds if present
        if (Array.isArray(parsed) && parsed.some((e: any) => e.id?.startsWith('exp-'))) {
          localStorage.setItem(STORAGE_KEYS.LOCAL_EXPENSES, JSON.stringify([]))
          return []
        }
        return parsed
      }
    } catch (e) {
      console.warn('Failed to parse local expenses:', e)
    }
    localStorage.setItem(STORAGE_KEYS.LOCAL_EXPENSES, JSON.stringify([]))
    return []
  }

  const saveLocalExpenses = (items: Expense[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_EXPENSES, JSON.stringify(items))
    } catch (e) {
      console.warn('Failed to save local expenses:', e)
    }
    setExpenses(items)
  }

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
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
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
  }, [])

  useEffect(() => {
    fetchExpenses()

    // Listen for cross-tab updates in local storage mode
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.LOCAL_EXPENSES && e.newValue) {
        try {
          setExpenses(JSON.parse(e.newValue))
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Setup Supabase Real-Time Channel
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('expenses-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newRecord = payload.new as Expense
              setExpenses((prev) => {
                if (prev.some((e) => e.id === newRecord.id)) return prev
                return [newRecord, ...prev].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )
              })
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Expense
              setExpenses((prev) =>
                prev.map((e) => (e.id === updated.id ? updated : e))
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
  }, [fetchExpenses])

  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'created_at'>
  ): Promise<Expense> => {
    if (!isSupabaseConfigured) {
      const newExpense: Expense = {
        ...expenseData,
        id: 'exp_' + Date.now(),
        created_at: new Date().toISOString(),
      }
      const updated = [newExpense, ...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      saveLocalExpenses(updated)
      return newExpense
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single()

    if (error) throw error

    // Optimistically update local state
    setExpenses((prev) => {
      if (prev.some((e) => e.id === data.id)) return prev
      return [data, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    })
    return data
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

    const { error } = await supabase.from('expenses').update(updates).eq('id', id)
    if (error) throw error

    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
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

    const { error } = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) throw error
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
        validItems.push(item)
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
    if (error) throw error

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
