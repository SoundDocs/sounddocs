-- Add labor_schedule_items column to production_schedules table
ALTER TABLE production_schedules
ADD COLUMN IF NOT EXISTS labor_schedule_items JSONB DEFAULT '[]'::jsonb;

-- Ensure the RLS policies and trigger are still in place or re-apply if necessary
-- (Usually, ALTER TABLE doesn't remove them, but good to be mindful)

-- Re-run if needed: Enable RLS
-- ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;

-- Re-run if needed: Policies for production_schedules
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own production schedules' AND tablename = 'production_schedules') THEN
    CREATE POLICY "Users can view their own production schedules"
      ON production_schedules FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own production schedules' AND tablename = 'production_schedules') THEN
    CREATE POLICY "Users can insert their own production schedules"
      ON production_schedules FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own production schedules' AND tablename = 'production_schedules') THEN
    CREATE POLICY "Users can update their own production schedules"
      ON production_schedules FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own production schedules' AND tablename = 'production_schedules') THEN
    CREATE POLICY "Users can delete their own production schedules"
      ON production_schedules FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Re-run if needed: Add last_edited trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_production_schedules_last_edited') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_last_edited_column') THEN
      CREATE OR REPLACE FUNCTION update_last_edited_column()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.last_edited = NOW();
        RETURN NEW;
      END;
      $func$ language 'plpgsql';
    END IF;

    CREATE TRIGGER update_production_schedules_last_edited
      BEFORE UPDATE ON production_schedules
      FOR EACH ROW EXECUTE PROCEDURE update_last_edited_column();
  END IF;
END
$$;
