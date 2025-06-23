/*
      # Create corporate_mic_plots table

      This migration creates a new table to store corporate mic plot documents.
      Each document can contain multiple presenter entries, each with detailed microphone
      and presentation information, including an optional photo URL.

      1. New Tables
        - `corporate_mic_plots`
          - `id` (uuid, primary key): Unique identifier for the mic plot.
          - `user_id` (uuid, foreign key): Links to the user who owns the mic plot.
          - `name` (text): Name of the mic plot document (e.g., "Q3 All-Hands Mic Plot").
          - `created_at` (timestamptz): Timestamp of creation.
          - `last_edited` (timestamptz): Timestamp of the last modification.
          - `presenters` (jsonb): An array of objects, where each object represents a presenter and their mic setup.
            - `id` (text): Unique ID for the presenter entry within the plot.
            - `presenter_name` (text): Name of the presenter/speaker.
            - `session_segment` (text): The part of the event the presenter is in.
            - `mic_type` (text): Type of microphone (e.g., 'lapel', 'handheld').
            - `element_channel_number` (text): Element or channel number.
            - `tx_pack_location` (text): Location of the transmitter pack.
            - `backup_element` (text): Details of the backup element/channel.
            - `sound_check_time` (text): Scheduled time for sound check (e.g., "HH:MM").
            - `notes` (text): Any special notes or requirements.
            - `presentation_type` (text): Type of presentation (e.g., 'keynote', 'panel').
            - `remote_participation` (boolean): Whether the presenter is participating remotely.
            - `photo_url` (text, nullable): URL of the presenter's photo stored in Supabase Storage.

      2. Security
        - Enable Row Level Security (RLS) on the `corporate_mic_plots` table.
        - Add policies for:
          - Users to create mic plots.
          - Users to view their own mic plots.
          - Users to update their own mic plots.
          - Users to delete their own mic plots.

      3. Indexes
        - Create an index on `user_id` for efficient querying of user-specific mic plots.
    */

    CREATE TABLE IF NOT EXISTS corporate_mic_plots (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL DEFAULT 'Untitled Corporate Mic Plot',
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      last_edited TIMESTAMPTZ DEFAULT now() NOT NULL,
      presenters JSONB DEFAULT '[]'::jsonb,
      CONSTRAINT user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users (id)
    );

    CREATE INDEX IF NOT EXISTS idx_corporate_mic_plots_user_id ON corporate_mic_plots(user_id);

    ALTER TABLE corporate_mic_plots ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can create their own corporate mic plots"
      ON corporate_mic_plots
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can view their own corporate mic plots"
      ON corporate_mic_plots
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own corporate mic plots"
      ON corporate_mic_plots
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own corporate mic plots"
      ON corporate_mic_plots
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
