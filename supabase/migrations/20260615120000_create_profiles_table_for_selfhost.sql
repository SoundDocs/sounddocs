-- =============================================================================
-- SELF-HOST ONLY: Recreate the out-of-band `public.profiles` table.
-- =============================================================================
--
-- The production hosted Supabase instance has a `public.profiles` table that was
-- created out-of-band (via the Supabase dashboard, NOT via a SQL migration). As
-- a result, NO migration in supabase/migrations/ creates it. A fresh self-hosted
-- instance applies every migration on first boot (self-host/volumes/db/
-- run-migrations.sh applies supabase/migrations/*.sql in sorted filename order),
-- so without this file `public.profiles` is missing on self-host -- which breaks
-- the editor pages that read user emails (`from("profiles").select("email")` in
-- RiderEditor, ProductionScheduleEditor, SharedProductionSchedule,
-- CommsPlannerEditor, CorporateMicPlotEditor) and the data import/export wizard
-- (apps/web/src/lib/dataBackup.ts registers `profiles` with PK `id` == auth user
-- id, ownership kind "self").
--
-- This migration is intended for the SELF-HOST migration runner only. It will
-- NOT be applied to the retiring production hosted instance (account access lost;
-- retirement 2026-09-01). Therefore every statement below is written to be
-- IDEMPOTENT and re-runnable, and harmless if it ever runs against a DB that
-- already has `profiles` (e.g. the hosted instance):
--   * CREATE TABLE IF NOT EXISTS          -- no-op if the table already exists
--   * ENABLE ROW LEVEL SECURITY           -- no-op if RLS already enabled
--   * DROP POLICY IF EXISTS + CREATE POLICY for each policy
--   * CREATE OR REPLACE FUNCTION
--   * DROP TRIGGER IF EXISTS + CREATE TRIGGER
--   * INSERT ... ON CONFLICT (id) DO NOTHING for the backfill
--
-- Columns are limited to what the application actually reads/writes:
--   * `id`         -- PK == auth.users(id); queried via .eq("id", created_by)
--                     and used as the "self" ownership PK in dataBackup.ts.
--   * `email`      -- the only column selected by the app
--                     (.from("profiles").select("email")).
--   * `created_at` -- standard audit timestamp (matches repo convention for all
--                     other tables); not read by the app but kept for parity and
--                     so backfilled/imported rows have a sane timestamp.
-- No other `profiles` columns are referenced anywhere in apps/web/src.
-- =============================================================================

-- 1. Table -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Per-user profile mirror of auth.users (id, email). Recreated for self-host parity with the hosted instance; populated by the handle_new_user() trigger on auth.users.';

-- 2. Row Level Security ------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies: a user may read/insert/update only their own profile row.
--    auth.uid() = id (the PK is the auth user id; there is no user_id column).
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Auto-create a profile row whenever a new auth.users row is inserted.
--    SECURITY DEFINER so it can write to public.profiles regardless of the
--    inserting role; search_path pinned to public to avoid search_path hijacking.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Trigger on auth.users (re-runnable: drop first, then create).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill profiles for any users that already exist (e.g. created before
--    this trigger). Harmless on a fresh DB (no users yet -> inserts nothing);
--    ON CONFLICT keeps it safe to re-run.
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. Grants. RLS still governs row visibility; these grants match the repo
--    convention of granting table privileges to the authenticated/anon roles
--    while relying on RLS policies for actual row-level access control.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
