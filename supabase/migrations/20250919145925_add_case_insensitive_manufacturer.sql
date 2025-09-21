-- Phase D: Query/API Improvements - Add case-insensitive manufacturer comparisons
-- This migration adds case-insensitive manufacturer comparisons using LOWER() function

-- Add indexes for case-insensitive manufacturer lookups
CREATE INDEX idx_projector_manufacturer_lower ON projector_database(LOWER(manufacturer));
CREATE INDEX idx_lens_manufacturer_lower ON lens_database(LOWER(manufacturer));

-- Update the mount family mapping function to use case-insensitive comparisons
CREATE OR REPLACE FUNCTION map_projector_mount_to_lens_family(mount_system TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE mount_system
    -- Barco mappings (case-insensitive)
    WHEN 'TLD+' THEN 'BARCO_TLD+'
    WHEN 'XLD+' THEN 'BARCO_XLD'
    WHEN 'XLD' THEN 'BARCO_XLD'
    WHEN 'FLD+' THEN 'BARCO_FLD+'
    WHEN 'FLD' THEN 'BARCO_FLD'
    WHEN 'G' THEN 'BARCO_G'
    WHEN 'GLD' THEN 'BARCO_G'  -- GLD projectors use G lenses

    -- Christie mappings (case-insensitive)
    WHEN 'ILS' THEN 'CHRISTIE_ILS'
    WHEN 'Manual' THEN 'CHRISTIE_ROADSTER'  -- Most manual are Roadster

    -- Panasonic mappings (case-insensitive)
    WHEN 'ET-D3Q' THEN 'PANA_ET-D3Q'
    WHEN 'ET-D3LE' THEN 'PANA_ET-D3LE'
    WHEN 'ET-D75LE' THEN 'PANA_ET-D75LE'
    WHEN 'ET-DLE' THEN 'PANA_ET-DLE'
    WHEN 'ET-C1' THEN 'PANA_ET-C1'
    WHEN 'ET-D' THEN 'PANA_ET-D'

    -- Other mappings (case-insensitive)
    WHEN 'ELPL' THEN 'EPSON_ELPL'
    WHEN 'VPLL' THEN 'SONY_VPLL'
    WHEN 'NP' THEN 'NEC_NP'

    ELSE 'OTHER'
  END;
END;
$$;

-- Create a helper function to check manufacturer compatibility (case-insensitive)
CREATE OR REPLACE FUNCTION manufacturers_match(manufacturer1 TEXT, manufacturer2 TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LOWER(TRIM(manufacturer1)) = LOWER(TRIM(manufacturer2));
END;
$$;

-- Update the mount family compatibility view to use case-insensitive comparisons
DROP VIEW IF EXISTS lens_compatibility_by_mount;
CREATE VIEW lens_compatibility_by_mount AS
SELECT
  p.manufacturer as projector_manufacturer,
  p.series as projector_series,
  p.model as projector_model,
  p.lens_mount_system,
  map_projector_mount_to_lens_family(p.lens_mount_system) as projector_mount_family,
  l.manufacturer as lens_manufacturer,
  l.model as lens_model,
  l.mount_family as lens_mount_family,
  l.throw_ratio_min,
  l.throw_ratio_max,
  l.lens_type,
  l.motorized,
  plc.compatibility_notes
FROM projector_database p
JOIN projector_lens_compatibility plc ON p.id = plc.projector_id
JOIN lens_database l ON plc.lens_id = l.id
WHERE manufacturers_match(p.manufacturer, l.manufacturer)  -- Case-insensitive manufacturer check
ORDER BY p.manufacturer, p.series, p.model, l.throw_ratio_min;

-- Add comments for documentation
COMMENT ON FUNCTION manufacturers_match(TEXT, TEXT) IS 'Case-insensitive manufacturer name comparison with trimming';
COMMENT ON INDEX idx_projector_manufacturer_lower IS 'Case-insensitive index for projector manufacturer lookups';
COMMENT ON INDEX idx_lens_manufacturer_lower IS 'Case-insensitive index for lens manufacturer lookups';

-- Create a function to find lenses by manufacturer (case-insensitive)
CREATE OR REPLACE FUNCTION find_lenses_by_manufacturer(target_manufacturer TEXT)
RETURNS TABLE(
  id UUID,
  manufacturer TEXT,
  model TEXT,
  part_number TEXT,
  throw_ratio_min NUMERIC(5,3),
  throw_ratio_max NUMERIC(5,3),
  lens_type TEXT,
  zoom_type TEXT,
  motorized BOOLEAN,
  lens_shift_v_max NUMERIC(5,1),
  lens_shift_h_max NUMERIC(5,1),
  optical_features JSONB,
  mount_family TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.manufacturer,
    l.model,
    l.part_number,
    l.throw_ratio_min,
    l.throw_ratio_max,
    l.lens_type,
    l.zoom_type,
    l.motorized,
    l.lens_shift_v_max,
    l.lens_shift_h_max,
    l.optical_features,
    l.mount_family,
    l.created_at
  FROM lens_database l
  WHERE LOWER(TRIM(l.manufacturer)) = LOWER(TRIM(target_manufacturer))
  ORDER BY l.throw_ratio_min;
END;
$$;

-- Create a function to find projectors by manufacturer (case-insensitive)
CREATE OR REPLACE FUNCTION find_projectors_by_manufacturer(target_manufacturer TEXT)
RETURNS TABLE(
  id UUID,
  manufacturer TEXT,
  series TEXT,
  model TEXT,
  brightness_ansi INTEGER,
  brightness_center INTEGER,
  native_resolution TEXT,
  technology_type TEXT,
  lens_mount_system TEXT,
  specifications JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.manufacturer,
    p.series,
    p.model,
    p.brightness_ansi,
    p.brightness_center,
    p.native_resolution,
    p.technology_type,
    p.lens_mount_system,
    p.specifications,
    p.created_at
  FROM projector_database p
  WHERE LOWER(TRIM(p.manufacturer)) = LOWER(TRIM(target_manufacturer))
  ORDER BY p.manufacturer, p.series, p.model;
END;
$$;

COMMENT ON FUNCTION find_lenses_by_manufacturer(TEXT) IS 'Find lenses by manufacturer name (case-insensitive)';
COMMENT ON FUNCTION find_projectors_by_manufacturer(TEXT) IS 'Find projectors by manufacturer name (case-insensitive)';