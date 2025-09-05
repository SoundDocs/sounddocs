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
CREATE POLICY "Allow all access to comms_beltpacks based on plan" ON comms_beltpacks FOR ALL USING (
    (SELECT auth.uid() FROM comms_plans WHERE comms_plans.id = plan_id) = auth.uid()
);
