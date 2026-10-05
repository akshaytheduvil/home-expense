import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_MODES, STORAGE_KEYS } from '@/lib/constants'

export function useSettings() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [paymentModes, setPaymentModes] = useState<string[]>(DEFAULT_PAYMENT_MODES)
  const [loading, setLoading] = useState(true)

  const loadLocalSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_SETTINGS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.categories) setCategories(parsed.categories)
        if (parsed.paymentModes) setPaymentModes(parsed.paymentModes)
      }
    } catch (e) {
      console.warn('Failed to parse local settings:', e)
    }
  }

  const saveLocalSettings = (cats: string[], modes: string[]) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.LOCAL_SETTINGS,
        JSON.stringify({ categories: cats, paymentModes: modes })
      )
    } catch (e) {
      console.warn('Failed to save local settings:', e)
    }
  }

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    if (!isSupabaseConfigured) {
      loadLocalSettings()
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw error

      if (data && data.length > 0) {
        const catSetting = data.find(s => s.key === 'categories')
        const modeSetting = data.find(s => s.key === 'payment_modes')

        if (catSetting && Array.isArray(catSetting.value)) {
          setCategories(catSetting.value)
        }
        if (modeSetting && Array.isArray(modeSetting.value)) {
          setPaymentModes(modeSetting.value)
        }
      } else {
        loadLocalSettings()
      }
    } catch (err) {
      console.warn('Supabase fetchSettings error, using local:', err)
      loadLocalSettings()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateCategories = async (newCats: string[]) => {
    setCategories(newCats)
    saveLocalSettings(newCats, paymentModes)

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('settings')
          .upsert({ key: 'categories', value: newCats, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      } catch (err) {
        console.warn('Failed to update categories on Supabase:', err)
      }
    }
  }

  const updatePaymentModes = async (newModes: string[]) => {
    setPaymentModes(newModes)
    saveLocalSettings(categories, newModes)

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('settings')
          .upsert({ key: 'payment_modes', value: newModes, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      } catch (err) {
        console.warn('Failed to update payment_modes on Supabase:', err)
      }
    }
  }

  const addCategory = async (cat: string) => {
    const trimmed = cat.trim()
    if (!trimmed || categories.includes(trimmed)) return
    const updated = [...categories, trimmed]
    await updateCategories(updated)
  }

  const removeCategory = async (cat: string) => {
    const updated = categories.filter(c => c !== cat)
    await updateCategories(updated)
  }

  const addPaymentMode = async (mode: string) => {
    const trimmed = mode.trim()
    if (!trimmed || paymentModes.includes(trimmed)) return
    const updated = [...paymentModes, trimmed]
    await updatePaymentModes(updated)
  }

  const removePaymentMode = async (mode: string) => {
    const updated = paymentModes.filter(m => m !== mode)
    await updatePaymentModes(updated)
  }

  return {
    categories,
    paymentModes,
    loading,
    addCategory,
    removeCategory,
    updateCategories,
    addPaymentMode,
    removePaymentMode,
    updatePaymentModes,
    refetch: fetchSettings,
  }
}
