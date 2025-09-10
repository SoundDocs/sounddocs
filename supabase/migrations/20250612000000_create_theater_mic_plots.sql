/*
      # Create theater_mic_plots table

      This migration creates a new table to store theater mic plot documents.
      Each document can contain multiple actor entries, each with detailed microphone,
      costume, wig/hair, and scene information, including an optional Base64 photo.

      1. New Tables
        - `theater_mic_plots`
          - `id` (uuid, primary key): Unique identifier for the mic plot.
          - `user_id` (uuid, foreign key): Links to the user who owns the mic plot.
          - `name` (text): Name of the mic plot document (e.g., "Hamlet - Act I Mic Plot").
          - `created_at` (timestamptz): Timestamp of creation.
          - `last_edited` (timestamptz): Timestamp of the last modification.
          - `actors` (jsonb): An array of objects, where each object represents an actor and their setup.
            - `id` (text): Unique ID for the actor entry within the plot.
            - `photo_url` (text, nullable): Base64 encoded string of the actor's photo.
            - `actor_name` (text): Name of the actor.
            - `character_names` (text): Name(s) of the character(s) played by the actor.
            - `element_channel_number` (text): Element or channel number for the mic.
            - `element_color` (text): Color code/label for the mic element.
            - `transmitter_location` (text): Location of the transmitter pack (e.g., "waist pack R", "in wig").
            - `element_location` (text): Location of the mic element (e.g., "forehead", "cheek L").
            - `backup_element` (text): Details of the backup element/channel.
            - `scene_numbers` (text): Scene numbers when the actor is on/off stage (e.g., "1, 3, 5-7").
            - `costume_notes` (text): Notes related to costume affecting mic placement.
            - `wig_hair_notes` (text): Notes related to wig or hair affecting mic placement.

      2. Security
        - Enable Row Level Security (RLS) on the `theater_mic_plots` table.
        - Add policies for:
          - Users to create mic plots.
          - Users to view their own mic plots.
          - Users to update their own mic plots.
          - Users to delete their own mic plots.

      3. Indexes
        - Create an index on `user_id` for efficient querying of user-specific mic plots.
    */

CREATE TABLE IF NOT EXISTS theater_mic_plots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL DEFAULT 'Untitled Theater Mic Plot',
    created_at timestamptz DEFAULT now() NOT NULL,
    last_edited timestamptz DEFAULT now() NOT NULL,
    actors jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

CREATE INDEX IF NOT EXISTS idx_theater_mic_plots_user_id ON theater_mic_plots(user_id);

ALTER TABLE theater_mic_plots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own theater mic plots"
ON theater_mic_plots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own theater mic plots"
ON theater_mic_plots
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own theater mic plots"
ON theater_mic_plots
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own theater mic plots"
ON theater_mic_plots
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
