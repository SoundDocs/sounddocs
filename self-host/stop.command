#!/usr/bin/env bash
# =============================================================================
# SoundDocs self-host -- STOP (macOS, double-clickable in Finder).
#
# Double-click to stop SoundDocs. Your data is kept safe. The first time, macOS
# may say it's from an "unidentified developer" -- if so, right-click this file
# and choose "Open", then click "Open" again. You only need to do that once.
# =============================================================================

# Finder launches double-clicked scripts from "/", so move into THIS script's
# own folder (self-host/) first.
cd "$(dirname "$0")" || exit 1

bash "./stop.sh"
STATUS=$?

echo ""
read -r -p "Press Return to close." _ 2>/dev/null || true
exit $STATUS
