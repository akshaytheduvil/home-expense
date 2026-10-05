import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Expenses } from '@/pages/Expenses'
import { AddExpense } from '@/pages/AddExpense'
import { EditExpense } from '@/pages/EditExpense'
import { Workers } from '@/pages/Workers'
import { WorkerLedger } from '@/pages/WorkerLedger'
import { Settings } from '@/pages/Settings'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load Summary page as required for bundle performance
const Summary = lazy(() =>
  import('@/pages/Summary').then((module) => ({ default: module.Summary }))
)

// Helper component for updating document title per route
const TitleUpdater: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Dashboard — Home Expense',
      '/login': 'Sign In — Home Expense',
      '/expenses': 'All Expenses — Home Expense',
      '/add': 'Add Expense — Home Expense',
      '/summary': 'Summary & Analytics — Home Expense',
      '/workers': 'Workers & Vendors — Home Expense',
      '/settings': 'Settings — Home Expense',
    }

    if (location.pathname.startsWith('/workers/') && location.pathname !== '/workers') {
      document.title = 'Worker Ledger — Home Expense'
    } else if (location.pathname.startsWith('/edit/')) {
      document.title = 'Edit Expense — Home Expense'
    } else {
      document.title = titles[location.pathname] || 'Home Expense — Family Expense Manager'
    }
  }, [location])

  return null
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <TitleUpdater />
          <Routes>
            {/* Unprotected PIN Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes inside Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/add" element={<AddExpense />} />
              <Route path="/edit/:id" element={<EditExpense />} />
              <Route path="/workers" element={<Workers />} />
              <Route path="/workers/:id" element={<WorkerLedger />} />
              <Route
                path="/summary"
                element={
                  <Suspense
                    fallback={
                      <div className="space-y-4 p-4">
                        <Skeleton className="h-12 w-48 rounded-xl" />
                        <Skeleton className="h-44 w-full rounded-2xl" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Skeleton className="h-64 rounded-xl" />
                          <Skeleton className="h-64 rounded-xl" />
                        </div>
                      </div>
                    }
                  >
                    <Summary />
                  </Suspense>
                }
              />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="bottom-center" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
