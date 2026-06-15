-- SoundDocs self-host: create the schema the Realtime service stores its state in.
--
-- Vendored from the official Supabase self-hosting repo:
--   https://github.com/supabase/supabase/blob/master/docker/volumes/db/realtime.sql
\set pguser `echo "$POSTGRES_USER"`

create schema if not exists _realtime;
alter schema _realtime owner to :pguser;
