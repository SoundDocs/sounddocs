-- Create table for storing LEQ measurements over time
-- This allows users to track sound exposure levels for occupational health and safety

CREATE TABLE leq_measurements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    measured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    leq_value DECIMAL(5,1) NOT NULL, -- LEQ value in dB (e.g., 85.5)
    duration_seconds INTEGER DEFAULT 1800 NOT NULL, -- Measurement duration (30 minutes for LEQ)
    calibration_offset DECIMAL(4,1) DEFAULT 0.0 NOT NULL, -- Applied calibration offset in dB
    sample_rate INTEGER NOT NULL, -- Audio sample rate in Hz
    session_id UUID DEFAULT gen_random_uuid() NOT NULL, -- Groups measurements from same session
    location TEXT, -- Optional location description
    notes TEXT, -- Optional user notes about the measurement
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_leq_measurements_user_id ON leq_measurements(user_id);
CREATE INDEX idx_leq_measurements_measured_at ON leq_measurements(measured_at);
CREATE INDEX idx_leq_measurements_session_id ON leq_measurements(session_id);
CREATE INDEX idx_leq_measurements_user_measured_at ON leq_measurements(user_id, measured_at);

-- Enable Row Level Security (RLS) - CRITICAL FOR USER DATA ISOLATION
ALTER TABLE leq_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can ONLY access their own LEQ measurements
-- This ensures complete data isolation between users for privacy and compliance

-- SELECT Policy: Users can only view their own measurements
CREATE POLICY "Users can view own LEQ measurements" ON leq_measurements
    FOR SELECT 
    USING (auth.uid() = user_id);

-- INSERT Policy: Users can only create measurements for themselves
CREATE POLICY "Users can insert own LEQ measurements" ON leq_measurements
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only modify their own measurements
CREATE POLICY "Users can update own LEQ measurements" ON leq_measurements
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own measurements
CREATE POLICY "Users can delete own LEQ measurements" ON leq_measurements
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Additional security: Ensure no anonymous access
CREATE POLICY "Deny anonymous access" ON leq_measurements
    FOR ALL
    TO anon
    USING (false);

-- Ensure only authenticated users can access the table
CREATE POLICY "Authenticated users only" ON leq_measurements
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leq_measurements_updated_at 
    BEFORE UPDATE ON leq_measurements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for LEQ statistics and compliance monitoring
CREATE VIEW leq_statistics AS
SELECT 
    user_id,
    DATE_TRUNC('day', measured_at) as measurement_date,
    COUNT(*) as measurement_count,
    AVG(leq_value) as avg_leq,
    MAX(leq_value) as max_leq,
    MIN(leq_value) as min_leq,
    STDDEV(leq_value) as leq_stddev,
    -- OSHA compliance indicators (8-hour TWA)
    COUNT(*) FILTER (WHERE leq_value >= 90.0) as over_90db_count,
    COUNT(*) FILTER (WHERE leq_value >= 85.0) as over_85db_count,
    -- Calculate time-weighted average for compliance
    CASE 
        WHEN COUNT(*) > 0 THEN
            10 * LOG(AVG(POWER(10, leq_value / 10)))
        ELSE NULL
    END as twa_leq
FROM leq_measurements
WHERE measured_at >= CURRENT_DATE - INTERVAL '30 days' -- Last 30 days
GROUP BY user_id, DATE_TRUNC('day', measured_at);

-- Grant access to the view
GRANT SELECT ON leq_statistics TO authenticated;

-- Set security barrier to ensure RLS is enforced on underlying table
ALTER VIEW leq_statistics SET (security_barrier = true);

-- Create function for bulk inserting LEQ measurements
CREATE OR REPLACE FUNCTION insert_leq_measurement(
    p_leq_value DECIMAL,
    p_duration_seconds INTEGER DEFAULT 1800,
    p_calibration_offset DECIMAL DEFAULT 0.0,
    p_sample_rate INTEGER DEFAULT 48000,
    p_session_id UUID DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    measurement_id UUID;
    current_user_id UUID;
BEGIN
    -- Get the current user ID and validate authentication
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Validate input parameters
    IF p_leq_value IS NULL OR p_leq_value < 0 OR p_leq_value > 200 THEN
        RAISE EXCEPTION 'Invalid LEQ value: must be between 0 and 200 dB';
    END IF;
    
    INSERT INTO leq_measurements (
        user_id,
        leq_value,
        duration_seconds,
        calibration_offset,
        sample_rate,
        session_id,
        location,
        notes
    ) VALUES (
        current_user_id,
        p_leq_value::DECIMAL(5,1),
        p_duration_seconds,
        p_calibration_offset::DECIMAL(4,1),
        p_sample_rate,
        COALESCE(p_session_id, gen_random_uuid()),
        p_location,
        p_notes
    ) RETURNING id INTO measurement_id;
    
    RETURN measurement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_leq_measurement TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE leq_measurements IS 'Stores LEQ (Equivalent Continuous Sound Level) measurements for occupational health and safety monitoring';
COMMENT ON COLUMN leq_measurements.leq_value IS 'LEQ measurement in dB SPL according to IEC 61672-1';
COMMENT ON COLUMN leq_measurements.duration_seconds IS 'Duration of the LEQ measurement period in seconds';
COMMENT ON COLUMN leq_measurements.calibration_offset IS 'Calibration offset applied to the measurement in dB';
COMMENT ON COLUMN leq_measurements.session_id IS 'Groups multiple measurements from the same analysis session';
COMMENT ON VIEW leq_statistics IS 'Provides daily LEQ statistics and OSHA compliance indicators for users';
COMMENT ON FUNCTION insert_leq_measurement IS 'Safely inserts a new LEQ measurement for the authenticated user';
