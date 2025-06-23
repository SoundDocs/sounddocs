/*
      # Create run_of_shows table

      This migration creates the `run_of_shows` table to store run of show documents.

      1. New Tables
        - `run_of_shows`
          - `id` (uuid, primary key, default: gen_random_uuid()) - Unique identifier for the run of show.
          - `user_id` (uuid, foreign key to auth.users.id, not null) - The user who owns this run of show.
          - `name` (text, not null, default: 'Untitled Run of Show') - The name of the run of show.
          - `items` (jsonb, default: '[]'::jsonb) - Array of items in the run of show.
          - `custom_column_definitions` (jsonb, default: '[]'::jsonb) - Definitions for custom columns.
          - `created_at` (timestamptz, default: now()) - Timestamp of creation.
          - `last_edited` (timestamptz, default: now()) - Timestamp of last edit.

      2. Indexes
        - `idx_run_of_shows_user_id` on `run_of_shows(user_id)` for faster lookups by user.

      3. Security
        - Enable Row Level Security (RLS) on the `run_of_shows` table.
        - Policies:
          - Users can select their own run of shows.
          - Users can insert their own run of shows.
          - Users can update their own run of shows.
          - Users can delete their own run of shows.
    */

    CREATE TABLE IF NOT EXISTS run_of_shows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL DEFAULT 'Untitled Run of Show',
      items JSONB DEFAULT '[]'::jsonb,
      custom_column_definitions JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      last_edited TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_run_of_shows_user_id ON run_of_shows(user_id);

    ALTER TABLE run_of_shows ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can select their own run of shows"
      ON run_of_shows
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own run of shows"
      ON run_of_shows
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own run of shows"
      ON run_of_shows
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own run of shows"
      ON run_of_shows
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);