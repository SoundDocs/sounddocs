-- tf_measurements
create table if not exists tf_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- versioning and provenance
  schema_version int not null default 1,
  agent_version text,      -- e.g. "capture-agent-py/0.1.0"
  dsp_version text,        -- e.g. "tf/0.1.0"
  -- capture context
  sample_rate int not null check (sample_rate > 0),
  nfft int not null check (nfft > 0),
  "window" text not null default 'hann',
  smoothing text,          -- e.g. '1/24oct', null = none
  max_delay_ms int,        -- used during capture
  ref_chan int not null check (ref_chan >= 1),
  meas_chan int not null check (meas_chan >= 1),
  device_id text,          -- driver/device identifier
  -- data
  tf_data jsonb not null,  -- {freqs:[], mag_db:[], phase_deg:[], coh:[], ir:[]}
  -- optional: consider client-side compression (e.g., pako.js) before sending
  -- optional: consider storing a decimated version for quick previews
  -- optional quick transforms applied in UI
  default_offset_db real default 0,
  default_offset_ms real default 0,
  notes text,
  -- extended context & organization
  venue text,
  temperature_c real,
  humidity_percent real,
  tags text[],
  parent_id uuid references tf_measurements(id), -- For measurement chains/versions
  is_reference boolean default false,
  color_preference text
);

-- keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_tf_measurements_updated on tf_measurements;
create trigger trg_tf_measurements_updated
before update on tf_measurements
for each row execute procedure set_updated_at();

-- RLS
alter table tf_measurements enable row level security;

create policy "tf_select_own"
  on tf_measurements for select
  using (user_id = auth.uid());

create policy "tf_insert_own"
  on tf_measurements for insert
  with check (user_id = auth.uid());

create policy "tf_update_own"
  on tf_measurements for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "tf_delete_own"
  on tf_measurements for delete
  using (user_id = auth.uid());

-- indexes
create index if not exists tf_user_created_idx
  on tf_measurements (user_id, created_at desc);

-- trigram search on name (enable pg_trgm extension)
create extension if not exists pg_trgm;
create index if not exists tf_name_trgm_idx
  on tf_measurements using gin (name gin_trgm_ops);
