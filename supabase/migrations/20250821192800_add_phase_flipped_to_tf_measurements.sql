ALTER TABLE public.tf_measurements
ADD COLUMN phase_flipped BOOLEAN NOT NULL DEFAULT FALSE;
