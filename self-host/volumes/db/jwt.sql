-- SoundDocs self-host: expose the JWT secret/exp as database settings.
--
-- Vendored from the official Supabase self-hosting repo:
--   https://github.com/supabase/supabase/blob/master/docker/volumes/db/jwt.sql
--
-- These GUCs let SQL functions (and pg_graphql / auth helpers) read the JWT
-- secret. $JWT_SECRET and $JWT_EXP are injected into the db container env.
\set jwt_secret `echo "$JWT_SECRET"`
\set jwt_exp `echo "$JWT_EXP"`

ALTER DATABASE postgres SET "app.settings.jwt_secret" TO :'jwt_secret';
ALTER DATABASE postgres SET "app.settings.jwt_exp" TO :'jwt_exp';
