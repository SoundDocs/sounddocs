-- Create tables for projection lens calculator

-- Core projector manufacturer database (global, read-only)
CREATE TABLE projector_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer TEXT NOT NULL,
    series TEXT NOT NULL,
    model TEXT NOT NULL,
    brightness_ansi INTEGER,
    brightness_center INTEGER,
    native_resolution TEXT,
    technology_type TEXT,
    lens_mount_system TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_projector_manufacturer ON projector_database(manufacturer);
CREATE INDEX idx_projector_model ON projector_database(model);
CREATE INDEX idx_projector_specifications ON projector_database USING GIN(specifications);

-- Lens database (global, read-only)
CREATE TABLE lens_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    part_number TEXT,
    throw_ratio_min NUMERIC(5,3),
    throw_ratio_max NUMERIC(5,3),
    lens_type TEXT,
    zoom_type TEXT,
    motorized BOOLEAN DEFAULT false,
    lens_shift_v_max NUMERIC(5,1),
    lens_shift_h_max NUMERIC(5,1),
    optical_features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for lens lookups
CREATE INDEX idx_lens_manufacturer ON lens_database(manufacturer);
CREATE INDEX idx_lens_model ON lens_database(model);
CREATE INDEX idx_lens_throw_ratio ON lens_database(throw_ratio_min, throw_ratio_max);
CREATE INDEX idx_lens_features ON lens_database USING GIN(optical_features);

-- Projector-lens compatibility matrix
CREATE TABLE projector_lens_compatibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projector_id UUID REFERENCES projector_database(id) ON DELETE CASCADE,
    lens_id UUID REFERENCES lens_database(id) ON DELETE CASCADE,
    compatibility_notes TEXT,
    performance_limitations TEXT,
    CONSTRAINT unique_projector_lens UNIQUE(projector_id, lens_id)
);

-- Create indexes for compatibility lookups
CREATE INDEX idx_compatibility_projector ON projector_lens_compatibility(projector_id);
CREATE INDEX idx_compatibility_lens ON projector_lens_compatibility(lens_id);

-- User lens calculations (user-scoped)
CREATE TABLE lens_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    calculation_name TEXT NOT NULL DEFAULT 'Untitled Calculation',
    screen_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    projector_requirements JSONB DEFAULT '{}'::jsonb,
    installation_constraints JSONB DEFAULT '{}'::jsonb,
    calculation_results JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_edited TIMESTAMPTZ DEFAULT now()
);

-- Create index for user calculations
CREATE INDEX idx_lens_calculations_user ON lens_calculations(user_id);

-- Enable RLS for user-scoped table
ALTER TABLE lens_calculations ENABLE ROW LEVEL SECURITY;

-- RLS policy for lens calculations
CREATE POLICY "Users can manage their own lens calculations"
ON lens_calculations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE projector_database IS 'Global database of projector specifications';
COMMENT ON TABLE lens_database IS 'Global database of projection lens specifications';
COMMENT ON TABLE projector_lens_compatibility IS 'Compatibility matrix between projectors and lenses';
COMMENT ON TABLE lens_calculations IS 'User-specific projection lens calculations';

COMMENT ON COLUMN lens_calculations.screen_data IS 'Screen dimensions, shape, position, and gain';
COMMENT ON COLUMN lens_calculations.projector_requirements IS 'Required brightness, resolution, and features';
COMMENT ON COLUMN lens_calculations.installation_constraints IS 'Distance limits, mounting requirements, and environment';
COMMENT ON COLUMN lens_calculations.calculation_results IS 'Compatible lenses, throw distances, and recommendations';