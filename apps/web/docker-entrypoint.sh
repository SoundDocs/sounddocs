#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — runtime config injection for the SoundDocs web image.
#
# Runs at container start BEFORE nginx begins serving. Writes config.js into
# the nginx document root with the values of the runtime env vars so the SPA
# can read them via window.__SOUNDDOCS_CONFIG__ (see src/lib/runtimeConfig.ts).
#
# Only env vars that are non-empty are included in the output object, so
# missing vars cleanly fall back to import.meta.env (the baked-in build-time
# values). This means:
#
#   - Self-hosted Docker: pass VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY /
#     VITE_SELF_HOSTED as container env vars and they will be injected.
#   - Local build test (no runtime vars): config.js stays as the empty-object
#     stub, and the app falls back to baked-in values — same as Netlify.
#
# Values are written as JSON string literals (double quotes, special characters
# escaped) so the generated JS is always syntactically valid.
# =============================================================================

set -e

CONFIG_JS=/usr/share/nginx/html/config.js

# ---------------------------------------------------------------------------
# json_string <value>
# Emits the value as a JSON-safe double-quoted string literal, escaping the
# characters that would otherwise break the JS: backslash, double-quote,
# newline, carriage-return, tab.
# ---------------------------------------------------------------------------
json_string() {
  printf '%s' "$1" \
    | sed 's/\\/\\\\/g' \
    | sed 's/"/\\"/g' \
    | sed 's/$/\\n/' \
    | tr -d '\n' \
    | sed 's/\\n$//' \
    | sed 's/\r/\\r/g' \
    | sed 's/	/\\t/g'
}

# ---------------------------------------------------------------------------
# Build the config object — only include keys whose env var is non-empty so
# the fallback to import.meta.env works correctly for unset vars.
# ---------------------------------------------------------------------------
ENTRIES=""

append_entry() {
  KEY="$1"
  VAL="$2"
  if [ -n "$VAL" ]; then
    ESCAPED=$(json_string "$VAL")
    if [ -n "$ENTRIES" ]; then
      ENTRIES="${ENTRIES}, "
    fi
    ENTRIES="${ENTRIES}\"${KEY}\": \"${ESCAPED}\""
  fi
}

append_entry "VITE_SUPABASE_URL"      "${VITE_SUPABASE_URL:-}"
append_entry "VITE_SUPABASE_ANON_KEY" "${VITE_SUPABASE_ANON_KEY:-}"
append_entry "VITE_SELF_HOSTED"       "${VITE_SELF_HOSTED:-}"

# ---------------------------------------------------------------------------
# Write config.js — overwrites the empty-stub file built into the image.
# ---------------------------------------------------------------------------
cat > "$CONFIG_JS" <<EOF
// Runtime configuration injected by docker-entrypoint.sh at container start.
// Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
window.__SOUNDDOCS_CONFIG__ = { ${ENTRIES} };
EOF

echo "[entrypoint] config.js written to ${CONFIG_JS}"

# Hand off to nginx.
exec nginx -g 'daemon off;'
