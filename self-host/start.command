#!/usr/bin/env bash
# =============================================================================
# SoundDocs self-host -- START (macOS, double-clickable in Finder).
#
# Double-click this file in Finder to start SoundDocs. The FIRST time, macOS may
# say it's from an "unidentified developer" -- if so, right-click this file and
# choose "Open", then click "Open" again. You only need to do that once.
#
# This is just a friendly wrapper: it makes sure we're in the right folder and
# then runs start.sh, which does the real work (checks Docker, creates settings,
# starts everything, opens your browser).
# =============================================================================

# Finder launches double-clicked scripts from "/", so move into THIS script's
# own folder (self-host/) before doing anything else.
cd "$(dirname "$0")" || exit 1

bash "./start.sh"
STATUS=$?

# Keep the Terminal window open so the user can read the summary / any errors,
# instead of it vanishing the instant the script finishes.
echo ""
echo "You can close this window now."
# 'read' may not be available in every non-interactive context; ignore failure.
read -r -p "Press Return to close." _ 2>/dev/null || true

exit $STATUS
