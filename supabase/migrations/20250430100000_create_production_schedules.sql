-- Create production_schedules table
CREATE TABLE IF NOT EXISTS production_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_edited TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL, -- Name for the schedule list, e.g., "My Band Tour Schedule"
  show_name TEXT,
  job_number TEXT,
  facility_name TEXT,
  project_manager TEXT,
  production_manager TEXT,
  account_manager TEXT,
  set_datetime TIMESTAMPTZ,
  strike_datetime TIMESTAMPTZ,
  schedule_items JSONB DEFAULT '[]'::jsonb -- For future schedule items
);

-- Enable RLS
ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for production_schedules
CREATE POLICY "Users can view their own production schedules"
  ON production_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own production schedules"
  ON production_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own production schedules"
  ON production_schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own production schedules"
  ON production_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Add last_edited trigger
CREATE OR REPLACE FUNCTION update_last_edited_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_edited = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_production_schedules_last_edited
  BEFORE UPDATE ON production_schedules
  FOR EACH ROW EXECUTE PROCEDURE update_last_edited_column();
