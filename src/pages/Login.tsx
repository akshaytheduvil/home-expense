import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Lock, User, Delete } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { STORAGE_KEYS } from '@/lib/constants'

export const Login: React.FC = () => {
  const { isAuthed, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Remember last entered username on this device (default to 'admin' for Akshay's family convenience)
  const [username, setUsername] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_USERNAME) || 'admin'
    } catch {
      return 'admin'
    }
  })

  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const usernameInputRef = useRef<HTMLInputElement>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  useEffect(() => {
    if (isAuthed) {
      navigate(from, { replace: true })
    }
  }, [isAuthed, navigate, from])

  const handleAttemptLogin = (userToLogin: string, enteredPin: string) => {
    const trimmedUser = userToLogin.trim()
    if (!trimmedUser) {
      setError('Please enter your username first')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      usernameInputRef.current?.focus()
      return
    }

    if (enteredPin.length !== 4) return

    const result = login(trimmedUser, enteredPin)
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.error || 'Incorrect username or 4-digit PIN')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      setPin('')
    }
  }

  const handleDigitPress = (digit: string) => {
    if (!username.trim()) {
      setError('Please enter your username first')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      usernameInputRef.current?.focus()
      return
    }

    if (pin.length < 4) {
      const nextPin = pin + digit
      setPin(nextPin)
      setError(null)
      if (nextPin.length === 4) {
        handleAttemptLogin(username, nextPin)
      }
    }
  }

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1))
    setError(null)
  }

  const handleClear = () => {
    setPin('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* App Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white text-3xl font-bold shadow-lg mb-3">
            ₹
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Home Expense
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Private Multi-Account Expense Manager
          </p>
        </div>

        {/* Login Card */}
        <div
          className={`rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur-sm transition-transform ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          <div className="flex items-center justify-center space-x-2 text-primary mb-5">
            <Lock className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide uppercase">
              Secure Sign In
            </span>
          </div>

          {/* 1. Username Box */}
          <div className="mb-5">
            <label
              htmlFor="username-input"
              className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 text-center"
            >
              Username / Family Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <input
                ref={usernameInputRef}
                id="username-input"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError(null)
                }}
                placeholder="Enter username provided by admin"
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center shadow-xs"
              />
            </div>
          </div>

          {/* 2. Hidden physical keyboard input for PIN */}
          <div className="flex flex-col items-center justify-center mb-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">
              Enter 4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPin(val)
                setError(null)
                if (val.length === 4) {
                  handleAttemptLogin(username, val)
                }
              }}
              className="sr-only"
              id="pin-direct-input"
              aria-label="4-digit PIN"
            />

            {/* Visual PIN Dots */}
            <div
              className="flex justify-center items-center space-x-4 cursor-pointer py-1"
              onClick={() => {
                document.getElementById('pin-direct-input')?.focus()
              }}
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin.length
                return (
                  <div
                    key={index}
                    className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? 'border-primary bg-primary scale-110 shadow-sm'
                        : 'border-muted-foreground/30 bg-transparent'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Inline Error Message */}
          <div className="h-6 text-center my-2 flex items-center justify-center">
            {error ? (
              <span className="text-xs font-semibold text-destructive inline-block animate-in fade-in">
                {error}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Enter your credentials to access your private ledger
              </span>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="h-13 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xl font-semibold active:scale-95 transition-all shadow-xs flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                aria-label={`Digit ${digit}`}
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-13 rounded-xl bg-secondary/40 hover:bg-secondary/70 text-muted-foreground text-xs font-semibold active:scale-95 transition-all flex items-center justify-center focus:outline-none cursor-pointer"
              aria-label="Clear PIN"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-13 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xl font-semibold active:scale-95 transition-all shadow-xs flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              aria-label="Digit 0"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-13 rounded-xl bg-secondary/40 hover:bg-secondary/70 text-muted-foreground active:scale-95 transition-all flex items-center justify-center focus:outline-none cursor-pointer"
              aria-label="Backspace"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-muted-foreground text-center mt-6">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Strictly Private & Encrypted Multi-Tenant Ledger</span>
        </div>
      </div>
    </div>
  )
}
