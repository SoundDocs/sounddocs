-- SoundDocs self-host: set passwords for the Supabase-managed Postgres roles.
--
-- Vendored from the official Supabase self-hosting repo:
--   https://github.com/supabase/supabase/blob/master/docker/volumes/db/roles.sql
--
-- The `supabase/postgres` image creates these roles itself during its bundled
-- bootstrap (authenticator, pgbouncer, supabase_auth_admin,
-- supabase_functions_admin, supabase_storage_admin). This script only sets
-- their passwords from $POSTGRES_PASSWORD so the GoTrue / Storage / pooler
-- containers can connect. For a single shared password this is fine; for a
-- hardened deployment, give each role its own password.
--
-- NOTE: change to your own per-role passwords for production environments.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
