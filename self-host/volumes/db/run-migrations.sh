#!/usr/bin/env bash
#
# SoundDocs self-host migration runner (one-shot `supabase-migrate` service).
#
# Applies every SQL file in /migrations (the repo's supabase/migrations dir,
# mounted read-only) in filename-sorted order. The newest SoundDocs migration
# also seeds projector/lens data, so a single sorted pass applies SCHEMA + SEED.
#
# WHY a wait/retry loop instead of mounting into /docker-entrypoint-initdb.d:
#   Many SoundDocs migrations reference auth.users (FK), auth.uid(), the storage
#   schema, and CREATE EXTENSION. Those objects are created by the GoTrue and
#   Storage containers running THEIR OWN migrations on boot -- which happens
#   AFTER raw Postgres init. So we must wait until the Supabase stack has
#   provisioned auth/storage before applying app migrations. This script blocks
#   until `auth.users` exists, then applies the migrations.
#
# IDEMPOTENCY: Many SoundDocs migrations use IF NOT EXISTS / CREATE OR REPLACE,
# but not all are safe to re-run. Run this on a FRESH database. Re-running
# against an already-migrated DB may error on non-idempotent statements.
# See SELF_HOSTING.md ("How migrations are applied" + "Updating").

set -euo pipefail

PGHOST="${POSTGRES_HOST:-db}"
PGPORT="${POSTGRES_PORT:-5432}"
PGDATABASE="${POSTGRES_DB:-postgres}"
PGUSER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}"

MIGRATIONS_DIR="/migrations"
MAX_WAIT_SECONDS="${MIGRATE_MAX_WAIT_SECONDS:-300}"

psql_q() {
  psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "$1"
}

echo "[migrate] Waiting for Postgres at ${PGHOST}:${PGPORT} ..."
elapsed=0
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" >/dev/null 2>&1; do
  sleep 2
  elapsed=$((elapsed + 2))
  if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
    echo "[migrate] ERROR: Postgres not ready after ${MAX_WAIT_SECONDS}s" >&2
    exit 1
  fi
done
echo "[migrate] Postgres is accepting connections."

# Wait for GoTrue to have created the auth schema + auth.users table.
echo "[migrate] Waiting for the auth.users table (created by the auth container) ..."
elapsed=0
until [ "$(psql_q "SELECT to_regclass('auth.users') IS NOT NULL;")" = "t" ]; do
  sleep 3
  elapsed=$((elapsed + 3))
  if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
    echo "[migrate] ERROR: auth.users did not appear after ${MAX_WAIT_SECONDS}s." >&2
    echo "[migrate]        Is the 'auth' (gotrue) container healthy? Check: docker compose logs auth" >&2
    exit 1
  fi
done
echo "[migrate] auth.users exists. Auth/storage schemas are provisioned."

# Idempotency guard: skip if SoundDocs migrations already applied.
# We treat the presence of a known SoundDocs table as the marker.
if [ "$(psql_q "SELECT to_regclass('public.patch_sheets') IS NOT NULL;")" = "t" ]; then
  echo "[migrate] Detected existing SoundDocs schema (public.patch_sheets exists)."
  echo "[migrate] Skipping migration run to avoid re-applying non-idempotent statements."
  echo "[migrate] To force a clean re-apply, wipe the DB volume (see SELF_HOSTING.md)."
  exit 0
fi

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
if [ "${#files[@]}" -eq 0 ]; then
  echo "[migrate] ERROR: no .sql files found in ${MIGRATIONS_DIR}." >&2
  exit 1
fi

# Apply in sorted filename order (== `ls supabase/migrations/*.sql | sort`).
IFS=$'\n' sorted=($(printf '%s\n' "${files[@]}" | sort)); unset IFS

echo "[migrate] Applying ${#sorted[@]} SoundDocs migrations (schema + seed) ..."
for f in "${sorted[@]}"; do
  echo "[migrate]   -> $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$f"
done

echo "[migrate] All migrations applied successfully."
