
-- Run these commands in your Supabase SQL Editor to add the 'deleted_at' column
-- and ensure the Recycle Bin feature works correctly.

-- 1. Add deleted_at column to shopkeepers table
ALTER TABLE public.shopkeepers
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add deleted_at column to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 3. (Optional) Create an index on deleted_at for better query performance if you have many records
CREATE INDEX IF NOT EXISTS idx_shopkeepers_deleted_at ON public.shopkeepers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions(deleted_at);

-- 4. Update your RLS (Row Level Security) policies if needed.
-- If you have policies that restrict access based on 'deleted_at', verify them.
-- Typically, standard SELECT policies will now return deleted items too unless filtered.
-- The application code handles filtering, but for security, you might want to update policies.
-- Example (if you wanted to hide deleted items from general queries at DB level, but we are handling it in app):
-- create policy "Hide deleted shopkeepers" on shopkeepers for select using (deleted_at is null);
-- (NOTE: The current app logic requests ALL items and filters on the client side or via explicit queries,
-- so you don't strictly need to change RLS unless you want to enforce it).
