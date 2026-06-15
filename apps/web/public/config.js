// Runtime configuration for SoundDocs.
//
// On local dev and Netlify production this file is served unchanged, setting
// an empty config object so the app falls back to the values Vite baked in
// at build time (import.meta.env.VITE_SUPABASE_URL etc.).
//
// On self-hosted Docker, docker-entrypoint.sh overwrites this file at
// container start with the actual env-var values before nginx begins serving,
// so the app picks them up at runtime without a rebuild.
//
// The || assignment means: if docker-entrypoint.sh has already populated
// window.__SOUNDDOCS_CONFIG__ from a prior run of this script in the same tab
// (hot-reload edge case), keep the existing values.
window.__SOUNDDOCS_CONFIG__ = window.__SOUNDDOCS_CONFIG__ || {};
