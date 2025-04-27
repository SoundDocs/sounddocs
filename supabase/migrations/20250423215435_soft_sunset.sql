/*
  # Create stage_plots table

  1. New Tables
    - `stage_plots`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid, foreign key)
      - `stage_size` (text): Stores the size of the stage (small, medium, large)
      - `elements` (jsonb): Stores all stage elements (instruments, amps, etc.)
      - `created_at` (timestamp)
      - `last_edited` (timestamp)
  
  2. Security
    - Enable RLS on `stage_plots` table
    - Add policy for authenticated users to perform CRUD operations on their own stage plots
*/

-- Create the stage_plots table
CREATE TABLE IF NOT EXISTS stage_plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  stage_size text DEFAULT 'medium',
  elements jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_edited timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE stage_plots ENABLE ROW LEVEL SECURITY;

-- Create policies for stage_plots
-- Users can select their own stage plots
CREATE POLICY "Users can view their own stage plots"
  ON stage_plots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own stage plots
CREATE POLICY "Users can create their own stage plots"
  ON stage_plots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stage plots
CREATE POLICY "Users can update their own stage plots"
  ON stage_plots
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own stage plots
CREATE POLICY "Users can delete their own stage plots"
  ON stage_plots
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);