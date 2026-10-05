-- ===============================================================
-- HOME EXPENSE DATABASE SCHEMA
-- Migration: 001_init.sql
-- ===============================================================

-- 1. WORKERS TABLE
create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  phone text,
  notes text,
  created_at timestamptz default now()
);

-- 2. EXPENSES TABLE
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  category text not null,
  product_name text,
  amount numeric(12,2) not null check (amount > 0),
  worker_name text,
  payment_mode text default 'Cash',
  description text,
  notes text,
  created_at timestamptz default now()
);

-- 3. SETTINGS TABLE
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb,
  updated_at timestamptz default now()
);

-- 4. PERFORMANCE INDEXES
create index if not exists idx_expenses_date on expenses(date desc);
create index if not exists idx_expenses_worker on expenses(worker_name);
create index if not exists idx_expenses_category on expenses(category);

-- 5. ROW LEVEL SECURITY (Open policy — app is PIN-gated)
alter table workers enable row level security;
alter table expenses enable row level security;
alter table settings enable row level security;

drop policy if exists "anon full access workers" on workers;
create policy "anon full access workers"
  on workers for all using (true) with check (true);

drop policy if exists "anon full access expenses" on expenses;
create policy "anon full access expenses"
  on expenses for all using (true) with check (true);

drop policy if exists "anon full access settings" on settings;
create policy "anon full access settings"
  on settings for all using (true) with check (true);

-- 6. REAL-TIME SUBSCRIPTION
alter publication supabase_realtime add table expenses;

-- 7. SEED WORKERS
insert into workers (name) values
  ('Athafund'), ('Chundhar'), ('Glass'), ('Marvel'),
  ('Period'), ('Petrol'), ('Other')
on conflict (name) do nothing;

-- 8. SEED SETTINGS
insert into settings (key, value) values
  ('categories', '["Painting","Grocery","Renovation","Petrol","Utilities","Medical","Education","Transport","Other"]'::jsonb),
  ('payment_modes', '["Cash","UPI","Card","Bank Transfer","Cheque","Wallet","Other"]'::jsonb)
on conflict (key) do nothing;
