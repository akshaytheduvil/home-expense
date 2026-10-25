import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_MODES, STORAGE_KEYS } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'

export function useSettings() {
  const { currentAccount } = useAuth()
  const accountId = currentAccount?.id || 'primary'

  const catKey = accountId === 'primary' ? 'categories' : `categories_${accountId}`
  const modeKey = accountId === 'primary' ? 'payment_modes' : `payment_modes_${accountId}`
  const storageKey = `${STORAGE_KEYS.LOCAL_SETTINGS}_${accountId}`

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [paymentModes, setPaymentModes] = useState<string[]>(DEFAULT_PAYMENT_MODES)
  const [loading, setLoading] = useState(true)

  const loadLocalSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.categories) setCategories(parsed.categories)
        if (parsed.paymentModes) setPaymentModes(parsed.paymentModes)
        return
      }
    } catch (e) {
      console.warn('Failed to parse local settings:', e)
    }
    setCategories(DEFAULT_CATEGORIES)
    setPaymentModes(DEFAULT_PAYMENT_MODES)
  }, [storageKey])

  const saveLocalSettings = useCallback((cats: string[], modes: string[]) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ categories: cats, paymentModes: modes })
      )
    } catch (e) {
      console.warn('Failed to save local settings:', e)
    }
  }, [storageKey])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    if (!isSupabaseConfigured) {
      loadLocalSettings()
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', [catKey, modeKey])

      if (error) throw error

      if (data && data.length > 0) {
        const catSetting = data.find((s) => s.key === catKey)
        const modeSetting = data.find((s) => s.key === modeKey)

        if (catSetting && Array.isArray(catSetting.value)) {
          setCategories(catSetting.value)
        } else {
          setCategories(DEFAULT_CATEGORIES)
        }

        if (modeSetting && Array.isArray(modeSetting.value)) {
          setPaymentModes(modeSetting.value)
        } else {
          setPaymentModes(DEFAULT_PAYMENT_MODES)
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
  }, [catKey, modeKey, loadLocalSettings])

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
          .upsert(
            { key: catKey, value: newCats, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )
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
          .upsert(
            { key: modeKey, value: newModes, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )
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
    const updated = categories.filter((c) => c !== cat)
    await updateCategories(updated)
  }

  const addPaymentMode = async (mode: string) => {
    const trimmed = mode.trim()
    if (!trimmed || paymentModes.includes(trimmed)) return
    const updated = [...paymentModes, trimmed]
    await updatePaymentModes(updated)
  }

  const removePaymentMode = async (mode: string) => {
    const updated = paymentModes.filter((m) => m !== mode)
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
