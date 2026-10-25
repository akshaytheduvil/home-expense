import { useState, useEffect, useCallback } from 'react'
import { Worker } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { DEFAULT_WORKERS, STORAGE_KEYS } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'

function matchesWorkerAccount(worker: any, accId: string): boolean {
  if (worker.account_id) {
    return worker.account_id === accId
  }
  if (accId === 'primary') {
    return !worker.notes?.startsWith('[acc:')
  }
  return worker.notes?.startsWith(`[acc:${accId}]`)
}

function cleanWorkerNotes(notes?: string | null): string | null {
  if (!notes) return null
  return notes.replace(/^\[acc:[^\]]+\]\s*/, '') || null
}

export function useWorkers() {
  const { currentAccount } = useAuth()
  const accountId = currentAccount?.id || 'primary'

  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const storageKey = `${STORAGE_KEYS.LOCAL_WORKERS}_${accountId}`

  // Local storage helper when Supabase is not configured
  const getLocalWorkers = useCallback((): Worker[] => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to parse local workers:', e)
    }
    // Default initial seed for new accounts
    const initial: Worker[] = DEFAULT_WORKERS.map((w) => ({
      id: w.id,
      name: w.name,
      notes: w.notes,
      account_id: accountId,
      created_at: new Date().toISOString(),
    }))
    localStorage.setItem(storageKey, JSON.stringify(initial))
    return initial
  }, [accountId, storageKey])

  const setLocalWorkers = useCallback((updated: Worker[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to save local workers:', e)
    }
    setWorkers(updated)
  }, [storageKey])

  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!isSupabaseConfigured) {
      const local = getLocalWorkers()
      local.sort((a, b) => a.name.localeCompare(b.name))
      setWorkers(local)
      setLoading(false)
      return
    }

    try {
      const { data, error: sbError } = await supabase
        .from('workers')
        .select('*')
        .order('name', { ascending: true })

      if (sbError) throw sbError

      const filtered = (data || [])
        .filter((w) => matchesWorkerAccount(w, accountId))
        .map((w) => ({
          ...w,
          notes: cleanWorkerNotes(w.notes),
        }))

      setWorkers(filtered)
    } catch (err: unknown) {
      console.warn('Supabase fetchWorkers failed, falling back to local:', err)
      const local = getLocalWorkers()
      local.sort((a, b) => a.name.localeCompare(b.name))
      setWorkers(local)
    } finally {
      setLoading(false)
    }
  }, [accountId, getLocalWorkers])

  useEffect(() => {
    fetchWorkers()
  }, [fetchWorkers])

  const addWorker = async (name: string, phone?: string | null, notes?: string | null): Promise<Worker> => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Worker name is required')

    // Check duplicate in current account
    if (workers.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Worker "${trimmed}" already exists`)
    }

    if (!isSupabaseConfigured) {
      const newWorker: Worker = {
        id: 'w_' + Date.now(),
        name: trimmed,
        phone: phone || null,
        notes: notes || null,
        account_id: accountId,
        created_at: new Date().toISOString(),
      }
      const updated = [...workers, newWorker].sort((a, b) => a.name.localeCompare(b.name))
      setLocalWorkers(updated)
      return newWorker
    }

    const tag = accountId === 'primary' ? '' : `[acc:${accountId}] `
    const fallbackNotes = (tag + (notes || '')).trim() || null

    const { data, error: sbError } = await supabase
      .from('workers')
      .insert([{ name: trimmed, phone: phone || null, notes: fallbackNotes }])
      .select()
      .single()

    if (sbError) throw sbError

    const cleaned: Worker = {
      ...data,
      account_id: accountId,
      notes: cleanWorkerNotes(data.notes),
    }

    setWorkers((prev) => [...prev, cleaned].sort((a, b) => a.name.localeCompare(b.name)))
    return cleaned
  }

  const updateWorker = async (id: string, updates: Partial<Worker>): Promise<void> => {
    if (!isSupabaseConfigured) {
      const updated = workers.map((w) => (w.id === id ? { ...w, ...updates } : w))
      setLocalWorkers(updated)
      return
    }

    const { account_id: _acc, ...validUpdates } = updates as any

    let updatePayload: any = { ...validUpdates }
    if (accountId !== 'primary' && updates.notes !== undefined) {
      updatePayload.notes = `[acc:${accountId}] ${updates.notes || ''}`.trim() || null
    }

    const { error: sbError } = await supabase.from('workers').update(updatePayload).eq('id', id)
    if (sbError) throw sbError

    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates, notes: cleanWorkerNotes(updates.notes ?? w.notes) } : w))
    )
  }

  const deleteWorker = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      const updated = workers.filter((w) => w.id !== id)
      setLocalWorkers(updated)
      return
    }

    const { error: sbError } = await supabase.from('workers').delete().eq('id', id)
    if (sbError) throw sbError

    setWorkers((prev) => prev.filter((w) => w.id !== id))
  }

  const ensureWorkersExist = async (names: string[]): Promise<number> => {
    const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)))
    if (unique.length === 0) return 0

    const currentNames = new Set(workers.map((w) => w.name.toLowerCase()))
    const newNames = unique.filter((name) => !currentNames.has(name.toLowerCase()))
    if (newNames.length === 0) return 0

    if (!isSupabaseConfigured) {
      const addedWorkers: Worker[] = newNames.map((name, i) => ({
        id: 'w_' + (Date.now() + i),
        name,
        notes: null,
        account_id: accountId,
        created_at: new Date().toISOString(),
      }))
      const updated = [...workers, ...addedWorkers].sort((a, b) => a.name.localeCompare(b.name))
      setLocalWorkers(updated)
      return newNames.length
    }

    const tag = accountId === 'primary' ? null : `[acc:${accountId}]`
    const upsertPayload = newNames.map((name) => ({
      name,
      notes: tag,
    }))

    const { error: sbError } = await supabase.from('workers').upsert(upsertPayload, {
      onConflict: 'name',
      ignoreDuplicates: true,
    })

    if (sbError) throw sbError

    await fetchWorkers()
    return newNames.length
  }

  return {
    workers,
    loading,
    error,
    fetchWorkers,
    addWorker,
    ensureWorkersExist,
    updateWorker,
    deleteWorker,
  }
}
