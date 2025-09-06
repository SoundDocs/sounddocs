-- Table for individual beltpacks
CREATE TABLE comms_beltpacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES comms_plans(id) ON DELETE CASCADE,
    label TEXT,
    x NUMERIC,
    y NUMERIC,
    "assignedTo" TEXT, -- Quoted to preserve camelCase
    "batteryLevel" INTEGER,
    "transceiverRef" UUID
);
ALTER TABLE comms_beltpacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to comms_beltpacks for plan owners" ON comms_beltpacks FOR ALL USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM comms_plans p
    WHERE p.id = plan_id
      AND p.user_id = auth.uid()
  )
);
