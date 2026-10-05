import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Lock, Delete } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export const Login: React.FC = () => {
  const { isAuthed, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  useEffect(() => {
    if (isAuthed) {
      navigate(from, { replace: true })
    }
  }, [isAuthed, navigate, from])

  const handleAttemptLogin = (enteredPin: string) => {
    if (enteredPin.length !== 4) return

    const success = login(enteredPin)
    if (success) {
      navigate(from, { replace: true })
    } else {
      setError('Incorrect PIN')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      setPin('')
    }
  }

  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit
      setPin(nextPin)
      setError(null)
      if (nextPin.length === 4) {
        handleAttemptLogin(nextPin)
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white text-3xl font-bold shadow-lg mb-4">
            ₹
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Home Expense
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Family Expense Manager
          </p>
        </div>

        {/* PIN Entry Card */}
        <div
          className={`rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur-sm transition-transform ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          <div className="flex items-center justify-center space-x-2 text-primary mb-2">
            <Lock className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide uppercase">
              Enter 4-Digit PIN
            </span>
          </div>

          <p className="text-xs text-center text-muted-foreground mb-6">
            Default PIN: <span className="font-mono font-semibold text-foreground">3735</span>
          </p>

          {/* Hidden/Direct Input for physical keyboards & mobile autofill */}
          <div className="flex justify-center mb-4">
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
                  handleAttemptLogin(val)
                }
              }}
              autoFocus
              className="sr-only"
              id="pin-direct-input"
              aria-label="4-digit PIN"
            />
            {/* Visual PIN Dots */}
            <div
              className="flex justify-center items-center space-x-4 cursor-pointer py-2"
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
                        : 'border-muted-foreground/40 bg-transparent'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {/* Inline Error Message */}
          <div className="h-6 text-center mb-4">
            {error ? (
              <span className="text-sm font-medium text-destructive inline-block animate-in fade-in">
                {error}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Shared family access
              </span>
            )}
          </div>

          {/* Numeric Keypad for Mobile and Touch Devices */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="h-14 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xl font-semibold active:scale-95 transition-all shadow-xs flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Digit ${digit}`}
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-14 rounded-xl bg-secondary/40 hover:bg-secondary/70 text-muted-foreground text-sm font-semibold active:scale-95 transition-all flex items-center justify-center focus:outline-none"
              aria-label="Clear PIN"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-14 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xl font-semibold active:scale-95 transition-all shadow-xs flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Digit 0"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-xl bg-secondary/40 hover:bg-secondary/70 text-muted-foreground active:scale-95 transition-all flex items-center justify-center focus:outline-none"
              aria-label="Backspace"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-muted-foreground text-center mt-6">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Secured PIN Protected Ledger</span>
        </div>
      </div>
    </div>
  )
}
