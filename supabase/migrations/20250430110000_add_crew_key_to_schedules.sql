-- Add crew_key column to production_schedules table
ALTER TABLE production_schedules
ADD COLUMN crew_key JSONB DEFAULT '[]'::JSONB;

-- No need to re-run the last_edited trigger function if it's already correct.
-- If you need to update it for any reason, you would drop and recreate.
-- For now, we assume the existing trigger is fine.

-- Note: If you want existing rows to have a non-null default that isn't an empty array,
-- you might want to update them separately. For new rows, '[]'::jsonb is a good default.
