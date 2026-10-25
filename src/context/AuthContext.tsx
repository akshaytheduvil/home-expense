import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { APP_PIN, DEFAULT_ACCOUNTS, STORAGE_KEYS } from '@/lib/constants'
import { Account } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthContextType {
  isAuthed: boolean
  isAdmin: boolean
  currentAccount: Account
  accounts: Account[]
  login: (username: string, pin: string) => { success: boolean; error?: string; account?: Account }
  logout: () => void
  updateMyDisplayName: (newDisplayName: string) => Promise<boolean>
  createCustomerAccount: (data: {
    username: string
    displayName: string
    pin: string
    phone?: string | null
    notes?: string | null
  }) => Promise<{ success: boolean; error?: string; account?: Account }>
  updateAccount: (accountId: string, updates: Partial<Account>) => Promise<boolean>
  deleteAccount: (accountId: string) => Promise<boolean>
  currentPin: string
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
          return parsed.map((a) => ({
            ...a,
            username: a.username || (a.id === 'primary' ? 'admin' : 'friend'),
            displayName: a.displayName || a.name || 'Account',
            role: a.role || (a.id === 'primary' ? 'admin' : 'customer'),
            createdAt: a.createdAt || new Date().toISOString(),
            isActive: a.isActive !== false,
          }))
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

  // Sync accounts from Supabase settings table
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
        const cloudAccounts: Account[] = data.value.map((a: any) => ({
          id: a.id,
          username: a.username || (a.id === 'primary' ? 'admin' : 'user_' + a.id),
          displayName: a.displayName || a.name || 'Account',
          pin: a.pin,
          role: a.role || (a.id === 'primary' ? 'admin' : 'customer'),
          phone: a.phone || null,
          notes: a.notes || null,
          createdAt: a.createdAt || new Date().toISOString(),
          isActive: a.isActive !== false,
          isDefault: a.isDefault,
        }))

        setAccounts(cloudAccounts)
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(cloudAccounts))

        const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT)
        const matched = cloudAccounts.find((a) => a.id === activeId)
        if (matched) {
          setCurrentAccount(matched)
        }
      } else {
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

  /**
   * Secure Login: Requires BOTH Username and 4-digit PIN.
   */
  const login = (
    enteredUsername: string,
    enteredPin: string
  ): { success: boolean; error?: string; account?: Account } => {
    const trimmedUser = enteredUsername.trim().toLowerCase()
    const trimmedPin = enteredPin.trim()

    if (!trimmedUser) {
      return { success: false, error: 'Please enter your username' }
    }
    if (!/^\d{4}$/.test(trimmedPin)) {
      return { success: false, error: 'Please enter your 4-digit PIN' }
    }

    const matched = accounts.find((a) => {
      // Primary admin matches 'admin', 'akshay', 'home', 'family', or '3735'
      const usernameMatch =
        a.username.toLowerCase() === trimmedUser ||
        (a.id === 'primary' && ['admin', 'akshay', 'home', 'family', '3735'].includes(trimmedUser))

      return usernameMatch && a.pin === trimmedPin
    })

    if (!matched) {
      return { success: false, error: 'Incorrect username or 4-digit PIN' }
    }

    if (matched.isActive === false) {
      return { success: false, error: 'This account has been deactivated. Please contact Admin.' }
    }

    localStorage.setItem(STORAGE_KEYS.AUTH, 'ok')
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, matched.id)
    localStorage.setItem(STORAGE_KEYS.LAST_USERNAME, enteredUsername.trim())
    setCurrentAccount(matched)
    setIsAuthed(true)
    return { success: true, account: matched }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    setIsAuthed(false)
  }

  /**
   * Customer self-service: update own family name / display name
   */
  const updateMyDisplayName = async (newDisplayName: string): Promise<boolean> => {
    const trimmed = newDisplayName.trim()
    if (!trimmed) return false

    const updated = accounts.map((a) =>
      a.id === currentAccount.id ? { ...a, displayName: trimmed } : a
    )
    return saveAccounts(updated)
  }

  /**
   * Admin: create new customer account with username, family name, 4-digit PIN
   */
  const createCustomerAccount = async (data: {
    username: string
    displayName: string
    pin: string
    phone?: string | null
    notes?: string | null
  }): Promise<{ success: boolean; error?: string; account?: Account }> => {
    const trimmedUser = data.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    const trimmedDisplay = data.displayName.trim() || data.username.trim()
    const trimmedPin = data.pin.trim()

    if (!trimmedUser) {
      return { success: false, error: 'Username must contain letters or numbers' }
    }
    if (!/^\d{4}$/.test(trimmedPin)) {
      return { success: false, error: 'PIN must be exactly 4 digits' }
    }

    // Check duplicate username
    if (accounts.some((a) => a.username.toLowerCase() === trimmedUser)) {
      return { success: false, error: `Username "${trimmedUser}" is already taken` }
    }

    const newAccount: Account = {
      id: 'acc_' + Date.now(),
      username: trimmedUser,
      displayName: trimmedDisplay,
      pin: trimmedPin,
      role: 'customer',
      phone: data.phone?.trim() || null,
      notes: data.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      isActive: true,
    }

    const updated = [...accounts, newAccount]
    const saved = await saveAccounts(updated)
    if (!saved) {
      return { success: false, error: 'Failed to save customer account' }
    }
    return { success: true, account: newAccount }
  }

  /**
   * Admin: update any account's PIN, username, display name, or notes
   */
  const updateAccount = async (accountId: string, updates: Partial<Account>): Promise<boolean> => {
    if (updates.pin && !/^\d{4}$/.test(updates.pin)) {
      return false
    }

    const updated = accounts.map((a) => {
      if (a.id === accountId) {
        return {
          ...a,
          ...updates,
          username: updates.username ? updates.username.trim().toLowerCase() : a.username,
          displayName: updates.displayName ? updates.displayName.trim() : a.displayName,
        }
      }
      return a
    })
    return saveAccounts(updated)
  }

  /**
   * Admin: delete a customer account (primary admin cannot be deleted)
   */
  const deleteAccount = async (accountId: string): Promise<boolean> => {
    if (accountId === 'primary') return false
    const updated = accounts.filter((a) => a.id !== accountId)
    const success = await saveAccounts(updated)
    return success
  }

  const isAdmin = currentAccount.role === 'admin'
  const currentPin = currentAccount.pin || APP_PIN

  return (
    <AuthContext.Provider
      value={{
        isAuthed,
        isAdmin,
        currentAccount,
        accounts,
        login,
        logout,
        updateMyDisplayName,
        createCustomerAccount,
        updateAccount,
        deleteAccount,
        currentPin,
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
