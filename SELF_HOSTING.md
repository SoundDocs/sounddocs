# Self-Hosting SoundDocs

> 👉 **Not a developer?** Start with the **[EASY-START guide](self-host/EASY-START.md)**.
> It walks you through running your own SoundDocs with plain-language steps — the
> only thing you install is Docker Desktop, then you double-click one file. This
> page below is the deeper, developer-oriented reference.

The hosted SoundDocs service is **retiring on 2026-09-01**. SoundDocs is free and
open source (**AGPL v3**), so you can keep using it by running it yourself. This
guide gets you a complete SoundDocs instance — the web app **and** a
self-hosted Supabase backend — on your own machine or server.

You export your data from the hosted app (Profile → export, a
`sounddocs-backup-*.json` file) and import it into your self-hosted instance
using the in-app first-run wizard.

---

## What you get

A single `docker compose up` brings up:

| Service            | Image                             | Purpose                                              |
| ------------------ | --------------------------------- | ---------------------------------------------------- |
| `db`               | `supabase/postgres`               | PostgreSQL + Supabase bootstrap                      |
| `auth`             | `supabase/gotrue`                 | Authentication (creates the `auth` schema)           |
| `rest`             | `postgrest/postgrest`             | Database REST API (`/rest/v1`, `/graphql/v1`)        |
| `realtime`         | `supabase/realtime`               | Realtime websockets                                  |
| `storage`          | `supabase/storage-api`            | Object storage                                       |
| `imgproxy`         | `darthsim/imgproxy`               | Image transforms for storage                         |
| `meta`             | `supabase/postgres-meta`          | Powers Studio                                        |
| `functions`        | `supabase/edge-runtime`           | Edge functions (`ai-align-systems`, PNG exporters)   |
| `studio`           | `supabase/studio`                 | Supabase admin dashboard                             |
| `kong`             | `kong`                            | API gateway — the **public Supabase URL**            |
| `supabase-migrate` | `postgres:15-alpine`              | One-shot: applies the 74 SoundDocs migrations + seed |
| `web`              | `ghcr.io/sounddocs/sounddocs-web` | The SoundDocs React app (nginx, with COOP/COEP)      |

> **Note on the stack footprint.** This is a _leaner_ stack than the upstream
> Supabase self-host compose: it omits the Logflare `analytics`, `vector`, and
> `supavisor` (connection pooler) services, because no core service depends on
> them in the current Supabase compose. The web app and edge functions talk to
> Postgres directly. If you specifically need the pooler or log analytics, copy
> those services back from the
> [official compose](https://github.com/supabase/supabase/tree/master/docker).

All files live in [`self-host/`](self-host/):

```
self-host/
  docker-compose.yml          # the whole stack
  .env.example                # every config var, documented
  setup.sh                    # generates a working .env with strong secrets + JWT keys
  volumes/
    api/kong.yml              # Kong gateway routes (auth/rest/realtime/storage/functions/studio)
    db/roles.sql              # sets passwords for Supabase Postgres roles
    db/jwt.sql                # exposes JWT secret to the DB
    db/realtime.sql           # creates the _realtime schema
    db/run-migrations.sh      # the migrate runner (waits for auth schema, applies migrations)
    functions/main/index.ts   # edge-runtime router for /functions/v1/*
```

The web image lives at [`apps/web/Dockerfile`](apps/web/Dockerfile) +
[`apps/web/nginx.conf`](apps/web/nginx.conf), with a repo-root
[`.dockerignore`](.dockerignore).

---

## Prerequisites

**Main path (Docker):**

- **Docker** with **Docker Compose v2** (`docker compose`, not the old
  `docker-compose`).
- ~**4 GB RAM** free (the stack is ~11 containers) and a few GB of disk.
- `openssl` (used by `setup.sh` to generate keys — present on macOS/Linux by
  default).

**Alternative path (Supabase CLI), for developers:**

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- **Node 20** and **pnpm 10** (the versions the project builds with).

---

## Quick start (happy path)

```bash
# 1. Get the code
git clone https://github.com/SoundDocs/sounddocs.git
cd sounddocs/self-host

# 2. Generate a .env with strong secrets and derived API keys
./setup.sh
#    -> prints your Studio username/password. Note it down.

# 3. Start everything (first run builds the web image + applies migrations)
docker compose up -d

# 4. Watch the migrations apply (optional)
docker compose logs -f supabase-migrate
#    -> wait for "All migrations applied successfully." then Ctrl-C

# 5. Check everything is healthy
docker compose ps
```

Then open:

- **SoundDocs app:** <http://localhost:3000>
- **Supabase Studio:** <http://localhost:8000> (log in with the
  `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` from `setup.sh`)

> Ports come from `self-host/.env`: `WEB_PORT=3000`, `KONG_HTTP_PORT=8000`.
> Change them there if those ports are taken. If you change the Kong port,
> also update `VITE_SUPABASE_URL` in `.env`, then `docker compose up -d web`
> (the entrypoint re-injects the new URL at runtime — no rebuild needed).

### What the first `docker compose up` actually does

1. **Postgres starts** and runs its bundled bootstrap (creates Supabase roles,
   applies `roles.sql` / `jwt.sql` / `realtime.sql` as init scripts on the fresh
   data volume).
2. **`auth` (GoTrue) starts** and runs **its own** migrations, creating the
   `auth` schema and `auth.users`. **`storage` does the same** for the `storage`
   schema. This is why we can't just dump the SoundDocs SQL into Postgres at raw
   init — those schemas don't exist yet at that point.
3. **`supabase-migrate` runs** once `db`, `auth`, and `storage` are healthy. It
   waits until `auth.users` actually exists, then applies the 74 SoundDocs
   migrations (schema **and** seed) in filename order, then exits.
4. **`web` pulls the prebuilt image** from GHCR and starts. The
   `docker-entrypoint.sh` script writes your `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY` / `VITE_SELF_HOSTED` into `config.js` at runtime,
   then nginx serves the SPA on `WEB_PORT`. No local build is needed.

---

## How migrations (and the seed) are applied

The `supabase-migrate` one-shot service runs
[`self-host/volumes/db/run-migrations.sh`](self-host/volumes/db/run-migrations.sh).
It bind-mounts the repo's `supabase/migrations` directory read-only and applies
every `*.sql` file **in sorted filename order** — i.e. exactly:

```bash
ls supabase/migrations/*.sql | sort
```

This is correct because the migrations are timestamp-prefixed
(`20250423184330_...` … `20251008210000_...`). **The projector/lens seed is just
another migration** (`20250919091000_seed_projector_lens_data.sql`), so a single
sorted pass applies **schema + seed** together.

### Ordering / readiness mechanism (the important part)

Many SoundDocs migrations reference `auth.users` (foreign keys), `auth.uid()`,
the `storage` schema, and `CREATE EXTENSION`. Those objects are created by the
`auth`/`storage` containers running **their own** migrations on boot — which
happens _after_ raw Postgres init. So mounting the SQL into
`/docker-entrypoint-initdb.d` would fail (no `auth` schema yet).

Instead, the migrate runner:

1. `depends_on: { db: healthy, auth: healthy, storage: healthy }`, **and**
2. actively **retries with backoff until `auth.users` exists** before applying
   anything (up to `MIGRATE_MAX_WAIT_SECONDS`, default 300s).

This belt-and-suspenders approach guarantees the auth/storage schemas are in
place first.

### Run on a FRESH database (honest caveat)

The runner is **idempotent at the run level**: if it detects the SoundDocs
schema already exists (it checks for `public.patch_sheets`), it **skips** and
exits 0, so re-running `docker compose up` won't double-apply. But the
individual migration files are **not all** safe to re-run statement-by-statement
(some are not `IF NOT EXISTS`). **Run the migrate service against a fresh
database.** To force a clean re-apply, wipe the data volume:

```bash
docker compose down
docker volume rm sounddocs_sounddocs-db-data   # destroys all data!
docker compose up -d
```

---

## How the web app gets its Supabase URL + anon key

The web app resolves its Supabase connection via a runtime-first, build-fallback
mechanism implemented in
[`apps/web/src/lib/runtimeConfig.ts`](apps/web/src/lib/runtimeConfig.ts):

**Resolution order (highest to lowest priority):**

1. `window.__SOUNDDOCS_CONFIG__` — written into `/usr/share/nginx/html/config.js`
   at container start by `docker-entrypoint.sh` from the container's runtime env
   vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SELF_HOSTED`).
2. `import.meta.env` — values Vite inlined at build time (used by local builds
   and the Netlify production build as before).
3. Empty string (no connection — app will show an error).

**For the prebuilt GHCR image** (`ghcr.io/sounddocs/sounddocs-web:latest`):

1. `setup.sh` writes `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into
   `self-host/.env`.
2. `docker-compose.yml`'s `web` service passes them as **runtime environment
   variables** (not build args). At container start, `docker-entrypoint.sh`
   writes them into `config.js` before nginx accepts connections.
3. **Changing them does not require a rebuild** — `docker compose up -d web`
   restarts the container and the entrypoint re-writes `config.js` with the new
   values.

**For local source builds** (`docker compose build web`):

The `build.args` block in `docker-compose.yml` still passes the values as Vite
build args so they are also baked into the bundle. Runtime injection additionally
writes them, and runtime values win — so both paths work correctly.

---

## Accessing Supabase Studio (and security warnings)

Studio is reachable at the Kong public URL (default <http://localhost:8000>),
protected by HTTP basic-auth (`DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`).

> [!WARNING]
>
> - **Do not expose Studio or Kong directly to the public internet.** Bind them
>   to localhost or put them behind a VPN / authenticated reverse proxy.
> - **Change the default dashboard credentials.** `setup.sh` randomizes the
>   password, but rotate it if you shared it.
> - **Rotate `JWT_SECRET` / keys** if they ever leak. The anon key is
>   exposed to browsers — this is normal for Supabase (RLS is what protects your
>   data). With the prebuilt GHCR image you do **not** need to rebuild when you
>   rotate `ANON_KEY`/`JWT_SECRET`: update `self-host/.env` and run
>   `docker compose up -d web` to restart the container with the new values.

---

## Restoring your data (first-run import wizard)

After the stack is up:

1. Open the SoundDocs app (<http://localhost:3000>).
2. The app shows a **first-run setup wizard** — **create your account**.
3. Upload the `sounddocs-backup-*.json` you exported from your **Profile** on
   the hosted app. It imports your documents into your self-hosted instance.

### How the first-run wizard works

- The wizard **only appears on self-hosted instances**. `docker-compose.yml`'s
  `web` service sets `VITE_SELF_HOSTED=true` as a runtime environment variable.
  `docker-entrypoint.sh` injects it into `config.js`, and the app reads it via
  `isSelfHosted()` in `runtimeConfig.ts`. The hosted SaaS build and local dev
  leave the flag unset, so the wizard never shows there.
- It appears on the **Dashboard** the first time you're signed in. You can
  either **import your backup** or **start fresh** — both dismiss it.
- Once completed (or skipped), it won't show again: a flag is stored in the
  browser's `localStorage` (`sounddocs-selfhost-setup-complete`). To see it again
  on the same browser, clear that key (or your site data) and reload.
- Importing requires being **signed in** (it writes documents into your account,
  enforced by Row Level Security). If you open the wizard before creating an
  account, it prompts you to do that first.
- The wizard reads the backup entirely **client-side**, validates it's a real
  SoundDocs backup, shows how many records it will import, and reports a
  per-table summary (including any errors) when it's done. Re-importing the same
  backup is safe — rows are upserted on their primary key.

### Email confirmation — make sure account creation works offline

A fresh self-hosted GoTrue can be configured to **require email confirmation**,
which won't work without an SMTP server. To avoid being locked out on a
single-user / offline instance, the generated `.env` sets:

```env
ENABLE_EMAIL_AUTOCONFIRM=true
```

This maps to GoTrue's `GOTRUE_MAILER_AUTOCONFIRM` and makes new sign-ups
confirmed immediately (no email needed). If you instead **want** real
confirmation/recovery emails, set `ENABLE_EMAIL_AUTOCONFIRM=false` and fill in
the `SMTP_*` variables in `.env`, then `docker compose up -d` again.

---

## Edge functions (PNG export + AI align)

The three edge functions ship in `supabase/functions` and run in the bundled
`functions` (edge-runtime) container, reached through Kong at `/functions/v1/*`:

- **`ai-align-systems`** — audio cross-correlation alignment
  (`supabase.functions.invoke("ai-align-systems", ...)`).
- **`led-map-to-png`** and **`svg-to-png`** — image generation for exports
  (called as `${VITE_SUPABASE_URL}/functions/v1/<name>` with the anon key).

**None require external API keys or secrets** — they work out of the box. The
default `FUNCTIONS_VERIFY_JWT=false` lets them run with the anon key
straightforwardly. (The repo doesn't ship the edge-runtime "main" router that
the Supabase CLI normally provides, so we vendor one at
`self-host/volumes/functions/main/index.ts`.)

---

## Updating Supabase credentials without a rebuild

Because the prebuilt GHCR image uses runtime injection, changing
`VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` in `self-host/.env` only
requires restarting the `web` container — no rebuild:

```bash
# Edit self-host/.env, then:
cd self-host
docker compose up -d web
```

The `docker-entrypoint.sh` re-writes `config.js` with the new values on every
container start.

## Rebuilding the web app from source

To build the image locally (e.g. for a code change or a fork):

```bash
cd self-host
docker compose build web --no-cache
docker compose up -d web
```

---

## Updating SoundDocs

```bash
git pull
cd self-host
docker compose pull web         # pull the latest prebuilt GHCR image
docker compose up -d
```

If you are building from source instead of using the prebuilt image:

```bash
git pull
cd self-host
docker compose build web        # rebuild web from source
docker compose up -d
```

> [!IMPORTANT] > **New migrations on an existing database.** The simple `supabase-migrate`
> service only safely runs on a **fresh** DB — on an already-migrated database
> it detects existing tables and **skips** (it will _not_ apply newly added
> migration files). For updates that ship new migrations, either:
>
> - apply just the **new** migration files manually with `psql`, or
> - use the **Supabase CLI** path below (`supabase db push`), which tracks
>   applied migrations properly.
>
> This is a deliberate trade-off to keep first-run turnkey; we're being honest
> that incremental migration management is not automated by the one-shot
> service.

---

## Backups

Back up the Postgres database with `pg_dump` against the `db` container:

```bash
cd self-host
# Dump (reads POSTGRES_PASSWORD from the container env)
docker compose exec db sh -c \
  'pg_dump -U postgres -d postgres' > sounddocs-backup.sql

# Restore into a running (fresh) db
cat sounddocs-backup.sql | docker compose exec -T db sh -c \
  'psql -U postgres -d postgres'
```

Also back up uploaded files — they live in the `sounddocs-storage-data` Docker
volume (mounted at `/var/lib/storage` in the `storage` container). For an
app-level backup, keep using the in-app export (`sounddocs-backup-*.json`).

---

## Troubleshooting

- **Ports already in use** (`bind: address already in use`): change `WEB_PORT`,
  `KONG_HTTP_PORT`, or `KONG_HTTPS_PORT` in `self-host/.env`. If you change the
  Kong port, update `SUPABASE_PUBLIC_URL` / `API_EXTERNAL_URL` / `VITE_SUPABASE_URL`
  to match, then `docker compose up -d` (the entrypoint injects the new URL at
  runtime — no rebuild needed for the prebuilt image).
- **A container is unhealthy:** `docker compose ps` then
  `docker compose logs <service>` (e.g. `auth`, `db`, `kong`).
- **`supabase-migrate` errors with "auth.users did not appear":** the `auth`
  container isn't healthy. Check `docker compose logs auth`.
- **Web app shows a blank page / "Invalid API key":** the runtime
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` don't match the running stack.
  Confirm `self-host/.env`, then `docker compose up -d web` to restart the
  container (the entrypoint re-injects `config.js` on every start). If you
  built the image from source, also run `docker compose build web --no-cache`.
- **Analyzer / SharedArrayBuffer not working:** the page must be served with the
  COOP (`same-origin`) + COEP (`require-corp`) headers. nginx sends them (see
  `apps/web/nginx.conf`); if you put a reverse proxy in front, **it must
  preserve these two headers**.
- **Login never completes / "email not confirmed":** set
  `ENABLE_EMAIL_AUTOCONFIRM=true` (default) or configure SMTP, then restart.

---

## Security notes (production)

- **Change all default passwords** (`DASHBOARD_PASSWORD`, and ideally per-role
  DB passwords in `volumes/db/roles.sql`).
- **Keep `.env` out of git** — it's already gitignored. Treat `JWT_SECRET` and
  `SERVICE_ROLE_KEY` as highly sensitive.
- **Don't expose Studio/Kong publicly.** Front the stack with HTTPS via a
  reverse proxy (Caddy / Traefik / nginx). The proxy **must preserve the
  COOP/COEP headers**.
- The **Pro audio capture agent uses secure WebSockets and needs HTTPS** — serve
  SoundDocs over HTTPS in production so the analyzer can connect.

---

## Alternative: Supabase CLI path (for developers)

If you'd rather use the Supabase CLI than Docker Compose, the repo includes
[`supabase/config.toml`](supabase/config.toml) (project_id `sounddocs`).

```bash
# From the repo root
supabase start
#   -> boots local Supabase, applies supabase/migrations (schema + seed),
#      and serves the edge functions. Note the printed API URL + anon key:
supabase status
#   API URL:  http://localhost:54321
#   anon key: eyJ...   (copy this)

# In another shell, run the web app pointing at local Supabase:
cd apps/web
echo "VITE_SUPABASE_URL=http://localhost:54321"        >  .env
echo "VITE_SUPABASE_ANON_KEY=<anon key from status>"   >> .env
cd ../..
pnpm install
pnpm dev
#   -> https://localhost:5173 (or http if no local cert)
```

The CLI path also handles **incremental migrations** properly:

```bash
supabase db push       # apply only new migrations to a linked/remote DB
# or, to fully reset a local DB to the migrations + seed:
supabase db reset
```

> If the PNG/align edge functions return 401 under the CLI, set
> `verify_jwt = false` for that `[functions.<name>]` entry in
> `supabase/config.toml`. They're currently set to `verify_jwt = true` (the
> requests carry the anon JWT, which is valid).
