import React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Receipt,
  PlusCircle,
  HardHat,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

export const Layout: React.FC = () => {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Add', path: '/add', icon: PlusCircle, isHighlight: true },
    { name: 'Workers', path: '/workers', icon: HardHat },
    { name: 'Summary', path: '/summary', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const mobileNavItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Add', path: '/add', icon: PlusCircle, isFab: true },
    { name: 'Workers', path: '/workers', icon: HardHat },
    { name: 'More', path: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-foreground">
      {/* Desktop / Tablet Fixed Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-4 h-screen sticky top-0 justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Brand & Live status */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                ₹
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight text-foreground">
                  Home Expense
                </h1>
                <p className="text-xs text-muted-foreground">Family Manager</p>
              </div>
            </div>
          </div>

          {/* Live Indicator Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-400 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>● Live Sync Active</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform group-hover:scale-105',
                      item.isHighlight && !isActive && 'text-blue-600 dark:text-blue-400'
                    )}
                  />
                  <span>{item.name}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="border-t border-border pt-4 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Toggle dark mode"
          >
            <span className="flex items-center space-x-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </span>
            <span className="text-xs font-mono opacity-60">
              {theme === 'dark' ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              ₹
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground block">
                Home Expense
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Live Indicator Dot */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
              title="Real-time sync active"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live</span>
            </div>

            {/* Dark mode switch */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-destructive hover:bg-destructive/10 focus:outline-none"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (5 tabs) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1 pb-safe shadow-lg"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            if (item.isFab) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center -mt-6 group',
                    'focus:outline-none'
                  )}
                  aria-label="Add new expense"
                >
                  <div
                    className={cn(
                      'h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95',
                      isActive
                        ? 'bg-blue-700 ring-4 ring-blue-200 dark:ring-blue-900'
                        : 'bg-primary hover:bg-blue-700'
                    )}
                  >
                    <PlusCircle className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium mt-1',
                      isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                    )}
                  >
                    Add
                  </span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 mb-0.5', isActive && 'stroke-[2.5]')} />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
