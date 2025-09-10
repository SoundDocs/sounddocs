-- Main table for comms plans
CREATE TABLE comms_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_edited TIMESTAMPTZ,
    venue_geometry JSONB, -- Store venue dimensions, polygons, etc.
    zones JSONB, -- Store zone definitions
    system_type TEXT, -- e.g., 'FreeSpeak II', 'FreeSpeak Edge'
    dfs_enabled BOOLEAN DEFAULT false,
    poe_budget_total INTEGER -- in watts
);
ALTER TABLE comms_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to own comms_plans" ON comms_plans FOR ALL USING (auth.uid() = user_id);

-- Table for individual transceivers/antennas
CREATE TABLE comms_transceivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES comms_plans(id) ON DELETE CASCADE,
    zone_id TEXT, -- Reference to a zone key in comms_plans.zones
    system_type TEXT,
    model TEXT,
    x NUMERIC,
    y NUMERIC,
    z NUMERIC,
    rotation NUMERIC,
    channel_set JSONB,
    dfs_enabled BOOLEAN,
    poe_class INTEGER,
    coverage_radius NUMERIC
);
ALTER TABLE comms_transceivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to comms_transceivers based on plan" ON comms_transceivers;
DROP POLICY IF EXISTS "Allow insert transceivers for own plans" ON comms_transceivers;

-- Allow access to transceivers for authenticated users who own the plan
CREATE POLICY "Allow access to comms_transceivers for plan owners" ON comms_transceivers FOR ALL USING (
    auth.uid() IS NOT null
    AND EXISTS (
        SELECT 1
        FROM comms_plans AS p
        WHERE
            p.id = p.plan_id
            AND p.user_id = auth.uid()
    )
);

-- Table for network switch configurations
CREATE TABLE comms_network_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES comms_plans(id) ON DELETE CASCADE,
    switch_id TEXT,
    switch_name TEXT,
    poe_budget_watts INTEGER,
    ports_config JSONB
);
ALTER TABLE comms_network_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to comms_network_configs for plan owners" ON comms_network_configs FOR ALL USING (
    auth.uid() IS NOT null
    AND EXISTS (
        SELECT 1
        FROM comms_plans AS p
        WHERE
            p.id = p.plan_id
            AND p.user_id = auth.uid()
    )
);

-- Table for interop configurations
CREATE TABLE comms_interop_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES comms_plans(id) ON DELETE CASCADE,
    system_type TEXT, -- 'Arcadia', 'ODIN', 'Bolero'
    config_json JSONB -- Dante ports, OMNEO settings, etc.
);
ALTER TABLE comms_interop_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to comms_interop_configs for plan owners" ON comms_interop_configs FOR ALL USING (
    auth.uid() IS NOT null
    AND EXISTS (
        SELECT 1
        FROM comms_plans AS p
        WHERE
            p.id = p.plan_id
            AND p.user_id = auth.uid()
    )
);

-- Table for roles and channel assignments
CREATE TABLE comms_roles_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES comms_plans(id) ON DELETE CASCADE,
    role_name TEXT,
    channel_assignments JSONB,
    ifb_pgm_routing JSONB,
    gpio_config JSONB
);
ALTER TABLE comms_roles_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to comms_roles_channels for plan owners" ON comms_roles_channels FOR ALL USING (
    auth.uid() IS NOT null
    AND EXISTS (
        SELECT 1
        FROM comms_plans AS p
        WHERE
            p.id = p.plan_id
            AND p.user_id = auth.uid()
    )
);
