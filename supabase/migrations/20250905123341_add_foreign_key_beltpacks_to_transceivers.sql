-- Add foreign key constraint from beltpacks to transceivers for proper relationship
ALTER TABLE comms_beltpacks
ADD CONSTRAINT fk_beltpacks_transceiver
FOREIGN KEY ("transceiverRef") REFERENCES comms_transceivers(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_comms_beltpacks_transceiver_ref ON comms_beltpacks("transceiverRef");

-- Update RLS policy to ensure proper access control
DROP POLICY "Allow all access to comms_beltpacks based on plan" ON comms_beltpacks;
CREATE POLICY "Allow all access to comms_beltpacks based on plan" ON comms_beltpacks FOR ALL USING (
    (SELECT auth.uid() FROM comms_plans WHERE comms_plans.id = plan_id) = auth.uid()
);
