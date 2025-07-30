/*
  # Create pixel_maps table
  1. New Tables:
     - pixel_maps: Stores data for generated pixel maps.
  2. Columns:
     - id, user_id, created_at, last_edited
     - map_type: 'standard' or 'led'
     - project_name, screen_name
     - aspect_ratio_w, aspect_ratio_h
     - resolution_w, resolution_h
     - settings: JSONB for additional data
  3. Security:
     - Enable RLS for the pixel_maps table.
     - Add policies for SELECT, INSERT, UPDATE, DELETE for authenticated users based on user_id.
  4. Indexes:
     - Add index on user_id for faster lookups.
*/
CREATE TABLE IF NOT EXISTS public.pixel_maps (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    last_edited timestamp with time zone NOT NULL DEFAULT now(),
    map_type text NOT NULL,
    project_name text NOT NULL DEFAULT 'Untitled Project'::text,
    screen_name text NOT NULL DEFAULT 'Screen 1'::text,
    aspect_ratio_w integer NOT NULL DEFAULT 16,
    aspect_ratio_h integer NOT NULL DEFAULT 9,
    resolution_w integer NOT NULL DEFAULT 1920,
    resolution_h integer NOT NULL DEFAULT 1080,
    settings jsonb,
    CONSTRAINT pixel_maps_pkey PRIMARY KEY (id),
    CONSTRAINT pixel_maps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pixel_maps_user_id ON public.pixel_maps USING btree (user_id);

ALTER TABLE public.pixel_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for own pixel maps"
ON public.pixel_maps
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
