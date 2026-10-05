import { useState, useEffect, useCallback } from 'react'
import { Worker } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { DEFAULT_WORKERS, STORAGE_KEYS } from '@/lib/constants'

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Local storage helper when Supabase is not configured
  const getLocalWorkers = (): Worker[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_WORKERS)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to parse local workers:', e)
    }
    // Default initial seed
    const initial: Worker[] = DEFAULT_WORKERS.map(w => ({
      id: w.id,
      name: w.name,
      notes: w.notes,
      created_at: new Date().toISOString(),
    }))
    localStorage.setItem(STORAGE_KEYS.LOCAL_WORKERS, JSON.stringify(initial))
    return initial
  }

  const setLocalWorkers = (updated: Worker[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_WORKERS, JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to save local workers:', e)
    }
    setWorkers(updated)
  }

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
      setWorkers(data || [])
    } catch (err: unknown) {
      console.warn('Supabase fetchWorkers failed, falling back to local:', err)
      const local = getLocalWorkers()
      local.sort((a, b) => a.name.localeCompare(b.name))
      setWorkers(local)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkers()
  }, [fetchWorkers])

  const addWorker = async (name: string, phone?: string | null, notes?: string | null): Promise<Worker> => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Worker name is required')

    // Check duplicate
    if (workers.some(w => w.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Worker "${trimmed}" already exists`)
    }

    if (!isSupabaseConfigured) {
      const newWorker: Worker = {
        id: 'w_' + Date.now(),
        name: trimmed,
        phone: phone || null,
        notes: notes || null,
        created_at: new Date().toISOString(),
      }
      const updated = [...workers, newWorker].sort((a, b) => a.name.localeCompare(b.name))
      setLocalWorkers(updated)
      return newWorker
    }

    const { data, error: sbError } = await supabase
      .from('workers')
      .insert([{ name: trimmed, phone: phone || null, notes: notes || null }])
      .select()
      .single()

    if (sbError) throw sbError

    setWorkers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  const updateWorker = async (id: string, updates: Partial<Worker>): Promise<void> => {
    if (!isSupabaseConfigured) {
      const updated = workers.map(w => (w.id === id ? { ...w, ...updates } : w))
      setLocalWorkers(updated)
      return
    }

    const { error: sbError } = await supabase.from('workers').update(updates).eq('id', id)
    if (sbError) throw sbError

    setWorkers(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)))
  }

  const deleteWorker = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      const updated = workers.filter(w => w.id !== id)
      setLocalWorkers(updated)
      return
    }

    const { error: sbError } = await supabase.from('workers').delete().eq('id', id)
    if (sbError) throw sbError

    setWorkers(prev => prev.filter(w => w.id !== id))
  }

  return {
    workers,
    loading,
    error,
    fetchWorkers,
    addWorker,
    updateWorker,
    deleteWorker,
  }
}
