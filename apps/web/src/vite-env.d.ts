/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Supabase project URL. Baked in at build time by Vite / Netlify / the
   * Dockerfile build args. On self-hosted Docker the runtime value from
   * window.__SOUNDDOCS_CONFIG__ takes precedence (see runtimeConfig.ts).
   */
  readonly VITE_SUPABASE_URL?: string;

  /**
   * Supabase anon (public) key. Baked in at build time. On self-hosted Docker
   * the runtime value from window.__SOUNDDOCS_CONFIG__ takes precedence.
   */
  readonly VITE_SUPABASE_ANON_KEY?: string;

  /**
   * Set to "true" only on self-hosted instances. Baked in by the Dockerfile
   * via the VITE_SELF_HOSTED build arg, or injected at runtime via config.js
   * by docker-entrypoint.sh. Gates the first-run setup wizard so it NEVER
   * appears on the hosted SaaS build. See useFirstRunSetup.ts / runtimeConfig.ts.
   */
  readonly VITE_SELF_HOSTED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Optional runtime configuration object written by docker-entrypoint.sh into
 * /usr/share/nginx/html/config.js and loaded via <script src="/config.js"> in
 * index.html before the app bundle. When present, values here WIN over the
 * baked-in import.meta.env values, enabling a single prebuilt GHCR image to be
 * configured at container start time without a rebuild.
 *
 * On dev and Netlify, public/config.js sets this to an empty object so the
 * app safely falls back to import.meta.env.
 */
interface SoundDocsRuntimeConfig {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SELF_HOSTED?: string;
}

// vite-env.d.ts is an ambient (non-module) script, so the global `Window` is
// augmented with a top-level interface declaration (a `declare global` block is
// only valid inside a module).
interface Window {
  __SOUNDDOCS_CONFIG__?: SoundDocsRuntimeConfig;
}
