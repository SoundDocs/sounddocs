#!/usr/bin/env bash
# =============================================================================
# SoundDocs self-host -- one-action START (Linux / macOS terminal).
#
# What this does, in order:
#   1. Checks Docker is installed AND running (friendly message + link if not).
#   2. If self-host/.env doesn't exist yet, generates one with strong random
#      secrets by running setup.sh (which derives the Supabase ANON_KEY /
#      SERVICE_ROLE_KEY). It NEVER overwrites an existing .env.
#   3. Starts the whole stack: docker compose up -d --build
#   4. Waits until the one-shot `supabase-migrate` service finishes applying
#      the database migrations (first run can take a few minutes).
#   5. Opens your browser to the SoundDocs app.
#   6. Prints the Studio URL + dashboard username/password.
#
# Safe to run more than once. Mac users can double-click start.command instead.
# =============================================================================
set -euo pipefail

# --- Always operate from THIS script's own directory (self-host/) ------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOCKER_DESKTOP_URL="https://www.docker.com/products/docker-desktop/"

say()  { printf '%s\n' "$*"; }
hr()   { printf '%s\n' "------------------------------------------------------------"; }

# --- 1. Docker checks --------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  hr
  say "Docker is not installed."
  say ""
  say "SoundDocs self-hosting needs Docker Desktop. It's a free download:"
  say "  ${DOCKER_DESKTOP_URL}"
  say ""
  say "Install it, open it (wait for the whale icon to say it's running),"
  say "then run this again."
  hr
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  hr
  say "Docker is installed, but it doesn't look like it's running."
  say ""
  say "Please OPEN Docker Desktop and wait until it says it's running"
  say "(the whale icon stops animating), then run this again."
  say ""
  say "Don't have it? Get it here: ${DOCKER_DESKTOP_URL}"
  hr
  exit 1
fi

# `docker compose` (v2) is required; the old `docker-compose` is not enough.
if ! docker compose version >/dev/null 2>&1; then
  hr
  say "Your Docker is missing 'docker compose' (v2)."
  say ""
  say "Update Docker Desktop to the latest version, then run this again:"
  say "  ${DOCKER_DESKTOP_URL}"
  hr
  exit 1
fi

# --- 2. Generate .env once (idempotent) --------------------------------------
if [ -f "${SCRIPT_DIR}/.env" ]; then
  say "Found your existing settings (.env) -- keeping them as-is."
else
  say "First time here -- creating your settings with strong random passwords ..."
  # setup.sh refuses to overwrite an existing .env, so this only runs once.
  bash "${SCRIPT_DIR}/setup.sh"
fi

# --- 3. Start everything -----------------------------------------------------
hr
say "Starting SoundDocs ..."
say "The FIRST run downloads images and builds the app -- this can take a few"
say "minutes. Later runs are much faster. Please be patient."
hr
docker compose up -d --build

# --- 4. Wait for the migrations to finish ------------------------------------
# The `supabase-migrate` service is a one-shot: it applies the database
# migrations and then exits 0. We poll its container state until it has exited,
# then check the exit code.
say ""
say "Setting up the database (this part can take a few minutes on first run) ..."

MIGRATE_CONTAINER="supabase-migrate"
WAITED=0
MAX_WAIT=900   # 15 minutes; first-run image pulls + build can be slow.
EXIT_CODE=""

while true; do
  # State is one of: created, running, restarting, exited, dead, (empty if gone)
  STATE="$(docker inspect -f '{{.State.Status}}' "$MIGRATE_CONTAINER" 2>/dev/null || true)"

  if [ "$STATE" = "exited" ] || [ "$STATE" = "dead" ]; then
    EXIT_CODE="$(docker inspect -f '{{.State.ExitCode}}' "$MIGRATE_CONTAINER" 2>/dev/null || echo "")"
    break
  fi

  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    say ""
    say "The database setup is taking longer than expected."
    say "It may still finish on its own. You can watch progress with:"
    say "  docker compose logs -f supabase-migrate"
    break
  fi

  # Simple progress dots so it doesn't look frozen.
  printf '.'
  sleep 5
  WAITED=$((WAITED + 5))
done
printf '\n'

if [ "${EXIT_CODE:-}" = "0" ]; then
  say "Database is ready."
elif [ -n "${EXIT_CODE:-}" ]; then
  say "Note: database setup reported a problem (code ${EXIT_CODE})."
  say "See what happened with:  docker compose logs supabase-migrate"
fi

# --- 5. Read the ports + dashboard login from .env ---------------------------
# Defaults match docker-compose.yml / setup.sh (WEB_PORT=3000, KONG_HTTP_PORT=8000).
WEB_PORT="3000"
KONG_HTTP_PORT="8000"
DASHBOARD_USERNAME="supabase"
DASHBOARD_PASSWORD="(see self-host/.env)"

if [ -f "${SCRIPT_DIR}/.env" ]; then
  # Read values without sourcing the file (values are simple, no spaces).
  while IFS='=' read -r key val; do
    case "$key" in
      WEB_PORT)           [ -n "$val" ] && WEB_PORT="$val" ;;
      KONG_HTTP_PORT)     [ -n "$val" ] && KONG_HTTP_PORT="$val" ;;
      DASHBOARD_USERNAME) [ -n "$val" ] && DASHBOARD_USERNAME="$val" ;;
      DASHBOARD_PASSWORD) [ -n "$val" ] && DASHBOARD_PASSWORD="$val" ;;
    esac
  done < "${SCRIPT_DIR}/.env"
fi

APP_URL="http://localhost:${WEB_PORT}"
STUDIO_URL="http://localhost:${KONG_HTTP_PORT}"

# --- 6. Open the browser -----------------------------------------------------
say ""
say "Opening SoundDocs in your browser: ${APP_URL}"
if command -v open >/dev/null 2>&1; then
  open "$APP_URL" >/dev/null 2>&1 || true        # macOS
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$APP_URL" >/dev/null 2>&1 || true    # Linux
fi

# --- 7. Final summary --------------------------------------------------------
hr
say "SoundDocs is running!"
say ""
say "  SoundDocs app:     ${APP_URL}"
say "  Admin dashboard:   ${STUDIO_URL}"
say "       username:     ${DASHBOARD_USERNAME}"
say "       password:     ${DASHBOARD_PASSWORD}"
say ""
say "If the page is blank, give it another minute (the app may still be"
say "building) and refresh."
say ""
say "To stop SoundDocs later, run stop.sh (or double-click stop.command)."
hr
