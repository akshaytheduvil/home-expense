-- ===============================================================
-- MULTI-ACCOUNT ISOLATION SCHEMA
-- Migration: 002_multi_account.sql
-- ===============================================================

-- 1. Add account_id to expenses (defaulting to 'primary' for all existing data)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_id text DEFAULT 'primary';

-- 2. Add account_id to workers (defaulting to 'primary' for all existing data)
ALTER TABLE workers ADD COLUMN IF NOT EXISTS account_id text DEFAULT 'primary';

-- 3. Indexes for fast account filtering
CREATE INDEX IF NOT EXISTS idx_expenses_account ON expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_workers_account ON workers(account_id);

-- 4. Scope worker names to account (so different accounts can have workers with same name)
ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_account_name ON workers(account_id, name);
