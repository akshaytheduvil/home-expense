import { Account } from '@/types'

export const APP_PIN = '3735'

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'primary',
    username: 'admin',
    displayName: 'Akshay (Family)',
    pin: '3735',
    role: 'admin',
    phone: null,
    notes: 'Primary Admin Family Account',
    createdAt: '2026-10-06T15:28:40.000Z',
    isActive: true,
    isDefault: true,
  },
  {
    id: 'friend',
    username: 'friend',
    displayName: "Friend's Family",
    pin: '5555',
    role: 'customer',
    phone: null,
    notes: 'First Customer Account',
    createdAt: '2026-10-25T13:46:20.000Z',
    isActive: true,
  },
]

export const STORAGE_KEYS = {
  AUTH: 'home_expense_auth',
  ACTIVE_ACCOUNT: 'home_expense_active_account',
  LAST_USERNAME: 'home_expense_last_username',
  ACCOUNTS: 'home_expense_accounts',
  CUSTOM_PIN: 'home_expense_custom_pin',
  THEME: 'home_expense_theme',
  LOCAL_EXPENSES: 'home_expense_local_data',
  LOCAL_WORKERS: 'home_expense_local_workers',
  LOCAL_SETTINGS: 'home_expense_local_settings',
} as const

export const DEFAULT_CATEGORIES: string[] = [
  'Painting',
  'Grocery',
  'Renovation',
  'Petrol',
  'Utilities',
  'Medical',
  'Education',
  'Transport',
  'Other',
]

export const DEFAULT_PAYMENT_MODES: string[] = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Cheque',
  'Wallet',
  'Other',
]

export const DEFAULT_WORKERS = [
  { id: 'w1', name: 'Athafund', notes: 'Woodwork & furniture' },
  { id: 'w2', name: 'Chundhar', notes: 'Masonry & civil work' },
  { id: 'w3', name: 'Glass', notes: 'Windows & fittings' },
  { id: 'w4', name: 'Marvel', notes: 'Tiles & granite' },
  { id: 'w5', name: 'Period', notes: 'Painting contractor' },
  { id: 'w6', name: 'Petrol', notes: 'Vehicle fuel vendor' },
  { id: 'w7', name: 'Other', notes: 'Miscellaneous vendors' },
]

export const CATEGORY_COLORS: Record<string, string> = {
  Painting: '#3b82f6',
  Grocery: '#10b981',
  Renovation: '#f59e0b',
  Petrol: '#ef4444',
  Utilities: '#8b5cf6',
  Medical: '#ec4899',
  Education: '#06b6d4',
  Transport: '#14b8a6',
  Other: '#6b7280',
}
