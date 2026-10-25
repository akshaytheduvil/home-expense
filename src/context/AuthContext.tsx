import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { APP_PIN, DEFAULT_ACCOUNTS, STORAGE_KEYS } from '@/lib/constants'
import { Account } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthContextType {
  isAuthed: boolean
  currentAccount: Account
  accounts: Account[]
  login: (pin: string) => { success: boolean; account?: Account }
  logout: () => void
  switchAccount: (accountId: string) => void
  updateAccount: (accountId: string, updates: { name?: string; pin?: string }) => Promise<boolean>
  createAccount: (name: string, pin: string) => Promise<Account | null>
  deleteAccount: (accountId: string) => Promise<boolean>
  currentPin: string
  setNewPin: (newPin: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial accounts from localStorage
  const getStoredAccounts = (): Account[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored accounts:', e)
    }
    return DEFAULT_ACCOUNTS
  }

  const [accounts, setAccounts] = useState<Account[]>(getStoredAccounts)

  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'ok'
    } catch {
      return false
    }
  })

  const [currentAccount, setCurrentAccount] = useState<Account>(() => {
    try {
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT)
      const list = getStoredAccounts()
      const found = list.find((a) => a.id === activeId)
      return found || list[0] || DEFAULT_ACCOUNTS[0]
    } catch {
      return DEFAULT_ACCOUNTS[0]
    }
  })

  // Sync accounts from Supabase settings
  const syncAccountsFromCloud = useCallback(async () => {
    if (!isSupabaseConfigured) return
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'app_accounts')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase accounts fetch error:', error)
        return
      }

      if (data && Array.isArray(data.value) && data.value.length > 0) {
        const cloudAccounts: Account[] = data.value
        setAccounts(cloudAccounts)
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(cloudAccounts))

        // Update current account reference if it exists in cloud accounts
        const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT)
        const matched = cloudAccounts.find((a) => a.id === activeId)
        if (matched) {
          setCurrentAccount(matched)
        }
      } else {
        // First-time sync: upload default accounts to cloud
        await supabase.from('settings').upsert(
          {
            key: 'app_accounts',
            value: DEFAULT_ACCOUNTS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
      }
    } catch (err) {
      console.warn('Failed to sync accounts from cloud:', err)
    }
  }, [])

  useEffect(() => {
    syncAccountsFromCloud()

    // Listen to storage changes across browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.AUTH) {
        setIsAuthed(e.newValue === 'ok')
      }
      if (e.key === STORAGE_KEYS.ACCOUNTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          setAccounts(parsed)
        } catch {}
      }
      if (e.key === STORAGE_KEYS.ACTIVE_ACCOUNT && e.newValue) {
        const found = accounts.find((a) => a.id === e.newValue)
        if (found) setCurrentAccount(found)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [syncAccountsFromCloud, accounts])

  const saveAccounts = async (updated: Account[]): Promise<boolean> => {
    try {
      setAccounts(updated)
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updated))

      // Also update current account in state if modified
      const currentUpdated = updated.find((a) => a.id === currentAccount.id)
      if (currentUpdated) {
        setCurrentAccount(currentUpdated)
      }

      if (isSupabaseConfigured) {
        await supabase.from('settings').upsert(
          {
            key: 'app_accounts',
            value: updated,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
      }
      return true
    } catch (e) {
      console.error('Failed to save accounts:', e)
      return false
    }
  }

  const login = (enteredPin: string): { success: boolean; account?: Account } => {
    const trimmed = enteredPin.trim()
    const matched = accounts.find((a) => a.pin === trimmed)
    if (matched) {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'ok')
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, matched.id)
      setCurrentAccount(matched)
      setIsAuthed(true)
      return { success: true, account: matched }
    }
    return { success: false }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    setIsAuthed(false)
  }

  const switchAccount = (accountId: string) => {
    const found = accounts.find((a) => a.id === accountId)
    if (found) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, found.id)
      setCurrentAccount(found)
    }
  }

  const updateAccount = async (
    accountId: string,
    updates: { name?: string; pin?: string }
  ): Promise<boolean> => {
    if (updates.pin && !/^\d{4}$/.test(updates.pin)) {
      return false
    }
    const updated = accounts.map((a) => {
      if (a.id === accountId) {
        return {
          ...a,
          name: updates.name?.trim() || a.name,
          pin: updates.pin || a.pin,
        }
      }
      return a
    })
    return saveAccounts(updated)
  }

  const createAccount = async (name: string, pin: string): Promise<Account | null> => {
    const trimmedName = name.trim()
    if (!trimmedName || !/^\d{4}$/.test(pin)) {
      return null
    }

    // Check duplicate PIN to avoid collision during login
    if (accounts.some((a) => a.pin === pin)) {
      return null
    }

    const newAccount: Account = {
      id: 'acc_' + Date.now(),
      name: trimmedName,
      pin,
    }

    const updated = [...accounts, newAccount]
    const success = await saveAccounts(updated)
    return success ? newAccount : null
  }

  const deleteAccount = async (accountId: string): Promise<boolean> => {
    if (accounts.length <= 1) return false
    const updated = accounts.filter((a) => a.id !== accountId)
    const success = await saveAccounts(updated)
    if (success && currentAccount.id === accountId) {
      const nextAcc = updated[0]
      setCurrentAccount(nextAcc)
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, nextAcc.id)
    }
    return success
  }

  // Backwards compatibility for single-PIN helpers
  const currentPin = currentAccount.pin || APP_PIN

  const setNewPin = (newPin: string): boolean => {
    if (!/^\d{4}$/.test(newPin)) return false
    updateAccount(currentAccount.id, { pin: newPin })
    return true
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthed,
        currentAccount,
        accounts,
        login,
        logout,
        switchAccount,
        updateAccount,
        createAccount,
        deleteAccount,
        currentPin,
        setNewPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
