import React, { createContext, useContext, useState, useEffect } from 'react'
import { APP_PIN, STORAGE_KEYS } from '@/lib/constants'

interface AuthContextType {
  isAuthed: boolean
  login: (pin: string) => boolean
  logout: () => void
  currentPin: string
  setNewPin: (newPin: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'ok'
    } catch {
      return false
    }
  })

  const [currentPin, setCurrentPinState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CUSTOM_PIN) || APP_PIN
    } catch {
      return APP_PIN
    }
  })

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.AUTH) {
        setIsAuthed(e.newValue === 'ok')
      }
      if (e.key === STORAGE_KEYS.CUSTOM_PIN && e.newValue) {
        setCurrentPinState(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const login = (enteredPin: string): boolean => {
    if (enteredPin === currentPin) {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'ok')
      setIsAuthed(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    setIsAuthed(false)
  }

  const setNewPin = (newPin: string): boolean => {
    if (!/^\d{4}$/.test(newPin)) {
      return false
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PIN, newPin)
    setCurrentPinState(newPin)
    return true
  }

  return (
    <AuthContext.Provider value={{ isAuthed, login, logout, currentPin, setNewPin }}>
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
