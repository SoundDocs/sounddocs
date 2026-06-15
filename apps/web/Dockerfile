# =============================================================================
# SoundDocs web app image (multi-stage).
#
# Build context MUST be the repo root (so the pnpm workspace + lockfile + the
# workspace packages apps/web depends on are available). The compose file sets
#   build: { context: .., dockerfile: apps/web/Dockerfile }
#
# Build it directly with, e.g.:
#   docker build -f apps/web/Dockerfile \
#     --build-arg VITE_SUPABASE_URL=http://localhost:8000 \
#     --build-arg VITE_SUPABASE_ANON_KEY=<anon-key> \
#     -t sounddocs-web .
#
# RUNTIME CONFIG (preferred for the prebuilt GHCR image):
#   Pass VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_SELF_HOSTED as
#   container *runtime* env vars. docker-entrypoint.sh writes them into
#   /usr/share/nginx/html/config.js before nginx starts so the SPA reads them
#   from window.__SOUNDDOCS_CONFIG__ (see apps/web/src/lib/runtimeConfig.ts).
#   This way a single prebuilt image works for any Supabase endpoint — no
#   rebuild needed when credentials change.
#
# BAKED BUILD-ARG PATH (local builds / backward compatibility):
#   The VITE_* build args below are still accepted. If passed, Vite bakes them
#   into the JS bundle. Runtime vars in the container take priority over the
#   baked values, so there is no conflict when both are present.
#   If neither build args nor runtime vars are set, the app falls back to the
#   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from apps/web/.env (dev only).
# =============================================================================

# ---- Stage 1: build the static SPA -----------------------------------------
FROM node:20-bookworm-slim AS build

# Enable pnpm 10 via corepack (the version the project builds with).
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy the whole repo (the root .dockerignore keeps node_modules/dist/.git etc.
# out of the build context). We copy everything before installing because this
# is a pnpm workspace: install needs every workspace package's package.json
# (apps/*, packages/*, agents/*, models/*, tools/*) to satisfy the frozen
# lockfile. Layer caching here is coarser, but the build is reliable.
COPY . .

# Install the entire workspace from the frozen lockfile (pnpm 10).
RUN pnpm install --frozen-lockfile

# Optional build args — accepted for the local-build / backward-compat path.
# The prebuilt GHCR image is built WITHOUT these so the bundle contains no
# baked credentials; runtime injection via docker-entrypoint.sh handles it.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# VITE_SELF_HOSTED: when "true", the in-app first-run setup wizard is enabled.
# The self-host docker-compose can pass this as a build arg (local builds) or
# inject it at runtime via VITE_SELF_HOSTED container env var. Both work.
ARG VITE_SELF_HOSTED
ENV VITE_SELF_HOSTED=${VITE_SELF_HOSTED}

# Build everything. `pnpm -r build` builds the workspace deps that apps/web
# needs (@sounddocs/analyzer-protocol -> tsc, @sounddocs/analyzer-lite -> tsc)
# and then the web app (vite build). Packages without a build script are
# simply skipped.
RUN pnpm -r build

# ---- Stage 2: serve via nginx ----------------------------------------------
FROM nginx:1.27-alpine AS runtime

# COOP/COEP + SPA fallback config (must match vite.config.ts headers so the
# analyzer's SharedArrayBuffer / cross-origin isolation works).
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Static build output.
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Runtime config entrypoint: writes /usr/share/nginx/html/config.js from
# container env vars at start, then exec's nginx. The public/config.js stub
# (already in dist/) provides the empty fallback for builds where no runtime
# vars are passed (identical to the Netlify + local-dev behaviour).
COPY apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
