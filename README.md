# Home Expense — Family Expense Manager Web App

> A mobile-first, installable (PWA) family expense manager built for modern households. Seamlessly replace messy paper and PDF records for grocery shopping, home renovation, painting, fuel, and contractor work with a shared, PIN-protected financial ledger.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React 18](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Supabase](https://img.shields.io/badge/Database-Supabase%20Postgres-3ecf8e)
![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple)

---

## 📸 Screenshots & Previews

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│     4-DIGIT PIN GATE    │  │     DASHBOARD (HOME)    │  │    WORKER LEDGER        │
│                         │  │                         │  │                         │
│       [  ₹  ]           │  │   TOTAL SPENT           │  │   [ A ] Athafund        │
│     Home Expense        │  │   ₹1,50,000             │  │   Total: ₹48,000        │
│                         │  │   All-Time Logged       │  │   4 transactions        │
│       ● ● ● ●           │  │                         │  │                         │
│                         │  │  [Month] [Week] [Today] │  │  Filter by Date/Product │
│    [1]   [2]   [3]      │  │  ₹84,500 ₹19,550 ₹850   │  │  18mm Teak Plywood      │
│    [4]   [5]   [6]      │  │                         │  │  Date: 28 Sep 2026      │
│    [7]   [8]   [9]      │  │   Category Pie Chart    │  │  ₹48,000 [Bank Transfer]│
│    [C]   [0]   [⌫]      │  │   Recent 5 Expenses     │  │                         │
│                         │  │                         │  │  [ Export CSV ]         │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## 🌟 Key Features

- **Mobile-First Fintech UX**: Clean cards, subtle elevation shadows, blue & slate color palette, and instant dark mode toggle.
- **Shared Family Access**: Protected by a 4-digit PIN gate (`3735`), session-cached locally without complex passwords or email verification.
- **Worker & Vendor Ledgers**: Assign expenses to specific contractors (e.g. *Athafund*, *Period Painting*, *Marvel Tiles*) with dedicated ledgers, date ranges, and individual CSV exports.
- **Inline Worker Creation**: Add new workers and contractors directly from within the expense entry form dropdown without losing draft progress.
- **Real-Time Synchronization**: Connects to Supabase Postgres real-time replication (`supabase_realtime`) to broadcast expense updates to all family members' devices in < 3 seconds.
- **Smart Filtering & Running Totals**: Filter by search terms, date ranges, multi-select category chips, worker, and payment mode with real-time matching count and sticky running total.
- **Interactive Financial Visualizations**: Recharts-powered category pie chart, payment mode distribution, top 10 worker bar chart, and month-over-month percentage change.
- **Bulk CSV / JSON Backup**: Bulk paste or upload CSV files with row-by-row validation, download complete JSON backups, or export filtered sheets.
- **Installable PWA**: Works offline using service workers and can be installed directly to home screens on iOS and Android devices.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript (Strict Mode) + Vite |
| **Styling** | Tailwind CSS + shadcn/ui design patterns |
| **Icons** | Lucide React |
| **Routing** | React Router v7 |
| **Charts** | Recharts (Lazy loaded) |
| **Forms** | React Hook Form + Zod |
| **Database & Realtime** | Supabase (PostgreSQL with Realtime publications & RLS) |
| **Offline & PWA** | `vite-plugin-pwa` + Workbox service workers |
| **Notifications** | Sonner |

---

## 🚀 Local Development Setup

### 1. Clone & Install Dependencies

```bash
cd home-expense
npm install
```

### 2. Configure Supabase (Free Database)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/001_init.sql` and run the script. This creates:
   - `workers` table (pre-seeded with default household workers)
   - `expenses` table with indexes
   - `settings` table (pre-seeded with categories and payment modes)
   - Open Row Level Security policies (client-side PIN gate)
   - Real-time replication publication
4. Copy your project URL and `anon` public key from **Project Settings → API**.

### 3. Set Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Note**: If you run without Supabase credentials, the app will seamlessly run in **Local Demo Mode** using browser `localStorage` and demo fixtures.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser or phone.

---

## 🔐 Default PIN & Security

- **Default PIN**: `3735`
- **To Change the PIN**: Go to **Settings → Security & 4-Digit PIN**, enter a new 4-digit code, and confirm.
- Sessions are saved locally under `localStorage.getItem("home_expense_auth")`.
- Clicking **Logout** immediately clears the session key and redirects to the PIN pad.

---

## 📦 Deployment Guide

### Build for Production

```bash
npm run build
```

This compiles optimized bundles to `dist/`, including service workers, Web App Manifest, and code-split chunks.

### Deploy to Vercel

```bash
npx vercel
```
- Set Root Directory: `home-expense` (or `./`)
- Build Command: `npm run build`
- Output Directory: `dist`
- Add Environment Variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Deploy to Netlify

1. Link your repository on Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. In **Site Configuration → Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Deploy to Cloudflare Pages

1. Create a new Cloudflare Pages project linked to your Git repo.
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`

---

## 📱 PWA Mobile Installation

1. Open the deployed web app on Chrome (Android) or Safari (iOS).
2. **Android**: Tap the **Install App** button in Dashboard/Settings or choose **Add to Home screen** from Chrome menu (⋮).
3. **iOS**: Tap the Share button in Safari and select **Add to Home Screen**.
4. The app will launch fullscreen with offline shell support!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
