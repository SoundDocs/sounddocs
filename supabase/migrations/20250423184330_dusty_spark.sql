/*
  # Create patch sheets table

  1. New Tables
    - `patch_sheets`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid, foreign key)
      - `info` (jsonb): Stores general information like venue, date, FOH, etc.
      - `created_at` (timestamp)
      - `last_edited` (timestamp)
  
  2. Security
    - Enable RLS on `patch_sheets` table
    - Add policy for authenticated users to perform CRUD operations on their own patch sheets
*/

-- Create the patch_sheets table
CREATE TABLE IF NOT EXISTS patch_sheets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    info jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    last_edited timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE patch_sheets ENABLE ROW LEVEL SECURITY;

-- Create policies for patch_sheets
-- Users can select their own patch sheets
CREATE POLICY "Users can view their own patch sheets"
ON patch_sheets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own patch sheets
CREATE POLICY "Users can create their own patch sheets"
ON patch_sheets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own patch sheets
CREATE POLICY "Users can update their own patch sheets"
ON patch_sheets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own patch sheets
CREATE POLICY "Users can delete their own patch sheets"
ON patch_sheets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
