import { Expense } from '@/types'

/**
 * Aliases for common column headers in spreadsheets (Excel, Google Sheets, manual logs)
 */
export const HEADER_ALIASES = {
  date: ['date', 'dt', 'date of payment', 'trans date', 'transaction date'],
  category: ['category', 'cat', 'type', 'head', 'bucket', 'expense category'],
  product_name: ['work', 'note', 'product', 'product_name', 'item', 'item name', 'particulars', 'purpose', 'details', 'title', 'service'],
  amount: ['expense', 'amount', 'cost', 'price', 'total', 'amt', 'rs', 'inr', 'rupees'],
  worker_name: ['worker name', 'worker', 'worker_name', 'contractor', 'person', 'vendor', 'name', 'by', 'payee', 'mechanic'],
  payment_mode: ['mode of payment', 'payment mode', 'mode', 'payment_mode', 'pay mode', 'payment type', 'payment method', 'paid via'],
  description: ['description', 'desc', 'work description', 'details', 'note', 'notes'],
  notes: ['notes', 'note', 'remark', 'remarks', 'comment', 'comments', 'memo'],
}

/**
 * Tokenize CSV or TSV text with full delimiter, quote, and comma awareness
 */
export function parseCsvText(text: string): string[][] {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || ''
  const tabCount = (firstLine.match(/\t/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const semiCount = (firstLine.match(/;/g) || []).length
  const delimiter =
    tabCount > commaCount && tabCount > semiCount ? '\t' : semiCount > commaCount ? ';' : ','

  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let insideQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"'
        i++ // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++ // Skip \r\n
      }
      currentRow.push(currentField.trim())
      if (currentRow.some((col) => col.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      currentField = ''
    } else {
      currentField += char
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((col) => col.length > 0)) {
      rows.push(currentRow)
    }
  }

  return rows
}

/**
 * Clean currency string: "₹40,000.00" -> 40000
 */
export function cleanAmount(amountStr: unknown): number {
  if (typeof amountStr === 'number') return isNaN(amountStr) ? 0 : amountStr
  if (!amountStr) return 0
  const cleaned = String(amountStr).replace(/[^0-9.-]/g, '')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

/**
 * Normalize dates: supports DD-MM-YYYY, MM-DD-YYYY, YYYY-MM-DD, slashes, and dots
 */
export function normalizeDate(dateStr: string, lastValidDate?: string): string {
  if (!dateStr || !dateStr.trim()) {
    return lastValidDate || new Date().toISOString().slice(0, 10)
  }
  const clean = dateStr.trim()

  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Match DD-MM-YYYY or MM-DD-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (dmyMatch) {
    const [, p1, p2, year] = dmyMatch
    const num1 = parseInt(p1, 10)
    const num2 = parseInt(p2, 10)

    if (num1 > 12) {
      // Must be DD-MM-YYYY (e.g. 15-09-2026, 28-09-2026)
      return `${year}-${String(num2).padStart(2, '0')}-${String(num1).padStart(2, '0')}`
    } else if (num2 > 12) {
      // Must be MM-DD-YYYY (e.g. 09-28-2026)
      return `${year}-${String(num1).padStart(2, '0')}-${String(num2).padStart(2, '0')}`
    } else {
      // Ambiguous (both <= 12). Default to standard DD-MM-YYYY (Indian format)
      return `${year}-${String(num2).padStart(2, '0')}-${String(num1).padStart(2, '0')}`
    }
  }

  const parsed = new Date(clean)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return lastValidDate || new Date().toISOString().slice(0, 10)
}

/**
 * Infer category from work / product keyword
 */
export function inferCategory(productOrWork: string, existingCategories: string[] = []): string {
  if (!productOrWork) return 'Other'
  const text = productOrWork.toLowerCase()

  if (text.includes('paint') || text.includes('colour') || text.includes('primer')) {
    return existingCategories.includes('Painting') ? 'Painting' : 'Renovation'
  }
  if (
    text.includes('cement') ||
    text.includes('brick') ||
    text.includes('padav') ||
    text.includes('thepp') ||
    text.includes('labour') ||
    text.includes('koolie') ||
    text.includes('interlock') ||
    text.includes('welding') ||
    text.includes('tank') ||
    text.includes('concrete') ||
    text.includes('interior') ||
    text.includes('meterial') ||
    text.includes('material') ||
    text.includes('wire') ||
    text.includes('wiring') ||
    text.includes('switch') ||
    text.includes('fan') ||
    text.includes('tv')
  ) {
    return existingCategories.includes('Renovation') ? 'Renovation' : 'Other'
  }
  if (text.includes('grocery') || text.includes('food') || text.includes('veg') || text.includes('milk')) {
    return 'Grocery'
  }
  if (text.includes('fuel') || text.includes('petrol') || text.includes('diesel')) {
    return 'Petrol'
  }
  if (text.includes('doctor') || text.includes('med') || text.includes('hospital') || text.includes('medicine')) {
    return 'Medical'
  }

  return existingCategories.includes('Other') ? 'Other' : (existingCategories[0] || 'Renovation')
}

export interface ParsedCsvResult {
  expenses: Omit<Expense, 'id' | 'created_at'>[]
  workers: string[]
  totalAmount: number
  errors: string[]
}

/**
 * Parse any CSV format with intelligent column matching and auto-correction
 */
export function parseAndCleanCsv(rawCsv: string, existingCategories: string[] = []): ParsedCsvResult {
  const rows = parseCsvText(rawCsv)
  const errors: string[] = []
  const parsedExpenses: Omit<Expense, 'id' | 'created_at'>[] = []
  const foundWorkers = new Set<string>()

  if (rows.length < 2) {
    return {
      expenses: [],
      workers: [],
      totalAmount: 0,
      errors: ['CSV must have a header line and at least one data row.'],
    }
  }

  // Map header row
  const rawHeaders = rows[0].map((h) => h.toLowerCase().trim().replace(/^"|"$/g, ''))
  const fieldMapping: Record<string, number> = {}

  rawHeaders.forEach((colHeader, index) => {
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (!fieldMapping[field] && aliases.some((a) => a === colHeader || colHeader.includes(a))) {
        fieldMapping[field] = index
        break
      }
    }
  })

  let lastDate: string | undefined

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length === 0 || row.every((c) => !c.trim())) continue

    const getVal = (field: string) => {
      const idx = fieldMapping[field]
      return idx !== undefined && idx < row.length ? row[idx].trim() : ''
    }

    const rawDate = getVal('date')
    const rawCategory = getVal('category')
    const rawProduct = getVal('product_name')
    const rawAmount = getVal('amount')
    const rawWorker = getVal('worker_name')
    const rawMode = getVal('payment_mode')
    const rawDesc = getVal('description')
    const rawNotes = getVal('notes')

    const amount = cleanAmount(rawAmount)
    if (amount <= 0) {
      errors.push(`Row ${i + 1}: Amount is missing or zero ("${rawAmount}")`)
      continue
    }

    const date = normalizeDate(rawDate, lastDate)
    if (date) lastDate = date

    const category = rawCategory || inferCategory(rawProduct || rawDesc, existingCategories)
    const product = rawProduct || rawDesc || category || 'Expense'
    const worker = rawWorker || null
    const mode = rawMode || 'Cash'
    const description = rawDesc || (rawProduct && rawDesc !== rawProduct ? rawProduct : null)
    const notes = rawNotes || null

    if (worker) {
      foundWorkers.add(worker)
    }

    parsedExpenses.push({
      date,
      category,
      product_name: product,
      amount,
      worker_name: worker,
      payment_mode: mode,
      description,
      notes,
    })
  }

  const totalAmount = parsedExpenses.reduce((sum, item) => sum + item.amount, 0)

  return {
    expenses: parsedExpenses,
    workers: Array.from(foundWorkers),
    totalAmount,
    errors,
  }
}
