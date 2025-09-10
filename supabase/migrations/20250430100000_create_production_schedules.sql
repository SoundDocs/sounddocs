-- Create production_schedules table
CREATE TABLE IF NOT EXISTS production_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_edited TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL, -- Name for the schedule list, e.g., "My Band Tour Schedule"
    show_name TEXT,
    job_number TEXT,
    facility_name TEXT,
    project_manager TEXT,
    production_manager TEXT,
    account_manager TEXT,
    set_datetime TIMESTAMPTZ,
    strike_datetime TIMESTAMPTZ,
    -- schedule_items JSONB DEFAULT '[]'::jsonb, -- Removed: This column stored detailed schedule items.
    crew_key JSONB DEFAULT '[]'::JSONB, 
    -- Items use snake_case: id, name, position, date, time_in, time_out, notes
    labor_schedule_items JSONB DEFAULT '[]'::JSONB
);

-- Enable RLS
ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for production_schedules

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view their own production schedules" ON production_schedules;
CREATE POLICY "Users can view their own production schedules"
ON production_schedules FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own production schedules" ON production_schedules;
CREATE POLICY "Users can insert their own production schedules"
ON production_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own production schedules" ON production_schedules;
CREATE POLICY "Users can update their own production schedules"
ON production_schedules FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own production schedules" ON production_schedules;
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
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then recreate it
DROP TRIGGER IF EXISTS update_production_schedules_last_edited ON production_schedules;
CREATE TRIGGER update_production_schedules_last_edited
BEFORE UPDATE ON production_schedules
FOR EACH ROW EXECUTE PROCEDURE update_last_edited_column();
