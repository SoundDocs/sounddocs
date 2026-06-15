/**
 * Runtime configuration — resolves Supabase connection values with a layered
 * priority so the same static SPA bundle works in three contexts:
 *
 *   1. Local dev (`pnpm dev`):
 *      `window.__SOUNDDOCS_CONFIG__` is not set (public/config.js sets an empty
 *      object). The getters fall back to `import.meta.env`, which Vite reads
 *      from `apps/web/.env` at dev-server start time. Behaviour is identical to
 *      before this file was introduced.
 *
 *   2. Hosted Netlify production build:
 *      The bundle is built with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
 *      baked in by Netlify's build environment. `window.__SOUNDDOCS_CONFIG__`
 *      remains the empty default from public/config.js. The getters fall back to
 *      `import.meta.env` — identical to existing behaviour.
 *
 *   3. Self-hosted Docker container:
 *      The docker-entrypoint.sh script overwrites /usr/share/nginx/html/config.js
 *      at container start, injecting the runtime env vars. The browser loads that
 *      script before the app bundle (see index.html), so
 *      `window.__SOUNDDOCS_CONFIG__` is populated. The getters prefer those
 *      runtime values over any baked-in `import.meta.env`.
 *
 * Resolution order (highest to lowest priority):
 *   window.__SOUNDDOCS_CONFIG__.<key>  →  import.meta.env.<key>  →  ""
 */

/** Shape of the optional runtime injection object. */
interface SoundDocsRuntimeConfig {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SELF_HOSTED?: string;
}

/**
 * Returns the runtime config object (or an empty object if the script tag has
 * not set it). Never returns `undefined`.
 */
function getRuntimeConfig(): SoundDocsRuntimeConfig {
  return window.__SOUNDDOCS_CONFIG__ ?? {};
}

/**
 * Resolves a single config key: runtime injection wins if the value is a
 * non-empty string, otherwise falls back to `import.meta.env`.
 */
function resolve(runtimeValue: string | undefined, buildValue: string | undefined): string {
  if (runtimeValue !== undefined && runtimeValue !== "") {
    return runtimeValue;
  }
  return buildValue ?? "";
}

/** The Supabase project URL (e.g. `https://<project>.supabase.co` or the
 *  local Kong gateway URL). */
export function getSupabaseUrl(): string {
  return resolve(getRuntimeConfig().VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_URL);
}

/** The Supabase `anon` public key (JWT). */
export function getSupabaseAnonKey(): string {
  return resolve(getRuntimeConfig().VITE_SUPABASE_ANON_KEY, import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/**
 * Returns `true` when the app is running inside a self-hosted instance.
 * On self-hosted Docker, `VITE_SELF_HOSTED` is injected at runtime via
 * config.js. On the hosted Netlify build the flag is absent (or explicitly
 * `"false"`), so this returns `false`. Local dev also returns `false` unless
 * you manually set `VITE_SELF_HOSTED=true` in `apps/web/.env`.
 */
export function isSelfHosted(): boolean {
  const value = resolve(getRuntimeConfig().VITE_SELF_HOSTED, import.meta.env.VITE_SELF_HOSTED);
  return value === "true";
}
