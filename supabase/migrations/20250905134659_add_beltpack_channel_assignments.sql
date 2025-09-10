-- Add channel assignments to comms_beltpacks table
ALTER TABLE comms_beltpacks
ADD COLUMN "channelAssignments" JSONB DEFAULT '[]'::JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN comms_beltpacks."channelAssignments" IS 'Array of channel assignments in format: [{"channel": "A", "assignment": "Production"}, {"channel": "B", "assignment": "Audio"}]';

-- Enable RLS for the new column (already covered by existing policy)
