-- Create technical_riders table
CREATE TABLE IF NOT EXISTS technical_riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_edited TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,

  -- Artist Information
  artist_name TEXT,
  band_members JSONB DEFAULT '[]'::jsonb,
  genre TEXT,

  -- Contact Information
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Stage Requirements
  stage_plot_url TEXT,

  -- Input/Channel List
  input_list JSONB DEFAULT '[]'::jsonb,

  -- Equipment Requirements
  pa_requirements TEXT,
  monitor_requirements TEXT,
  console_requirements TEXT,
  backline_requirements JSONB DEFAULT '[]'::jsonb,
  artist_provided_gear JSONB DEFAULT '[]'::jsonb,

  -- Technical Staff
  required_staff JSONB DEFAULT '[]'::jsonb,

  -- Special Requirements
  special_requirements TEXT,
  power_requirements TEXT,
  lighting_notes TEXT,

  -- Hospitality
  hospitality_notes TEXT,

  -- Additional
  additional_notes TEXT
);

-- Enable RLS
ALTER TABLE technical_riders ENABLE ROW LEVEL SECURITY;

-- Policies for technical_riders

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view their own technical riders" ON technical_riders;
CREATE POLICY "Users can view their own technical riders"
  ON technical_riders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own technical riders" ON technical_riders;
CREATE POLICY "Users can insert their own technical riders"
  ON technical_riders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own technical riders" ON technical_riders;
CREATE POLICY "Users can update their own technical riders"
  ON technical_riders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own technical riders" ON technical_riders;
CREATE POLICY "Users can delete their own technical riders"
  ON technical_riders FOR DELETE
  USING (auth.uid() = user_id);

-- Add last_edited trigger
DROP TRIGGER IF EXISTS update_technical_riders_last_edited ON technical_riders;
CREATE TRIGGER update_technical_riders_last_edited
  BEFORE UPDATE ON technical_riders
  FOR EACH ROW EXECUTE PROCEDURE update_last_edited_column();
