-- supabase/migrations/20250909063900_create_math_measurements.sql

CREATE TABLE public.math_measurements (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    operation text NOT NULL,
    source_measurement_ids uuid[] NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT math_measurements_pkey PRIMARY KEY (id),
    CONSTRAINT math_measurements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.math_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own math measurements"
ON public.math_measurements
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
