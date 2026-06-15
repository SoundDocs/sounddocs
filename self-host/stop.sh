#!/usr/bin/env bash
# =============================================================================
# SoundDocs self-host -- STOP (Linux / macOS terminal).
#
# Cleanly stops all SoundDocs containers. Your data is kept safe -- it lives in
# Docker storage volumes and is NOT deleted by this. Start again any time with
# start.sh (or double-click start.command on Mac).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker isn't installed, so there's nothing to stop."
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker isn't running, so SoundDocs is already stopped."
  exit 0
fi

echo "Stopping SoundDocs ..."
docker compose down
echo ""
echo "SoundDocs is stopped. Your data is safe."
echo "Start it again with start.sh (or double-click start.command)."
