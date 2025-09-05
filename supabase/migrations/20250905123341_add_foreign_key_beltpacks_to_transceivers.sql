-- Add foreign key constraint from beltpacks to transceivers for proper relationship
ALTER TABLE comms_beltpacks
ADD CONSTRAINT fk_beltpacks_transceiver
FOREIGN KEY ("transceiverRef") REFERENCES comms_transceivers(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_comms_beltpacks_transceiver_ref ON comms_beltpacks("transceiverRef");

-- Update RLS policy to ensure proper access control
DROP POLICY IF EXISTS "Allow access to comms_beltpacks for plan owners" ON comms_beltpacks;
CREATE POLICY "Allow access to comms_beltpacks for plan owners" ON comms_beltpacks FOR ALL USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM comms_plans p
    WHERE p.id = plan_id
      AND p.user_id = auth.uid()
  )
);
