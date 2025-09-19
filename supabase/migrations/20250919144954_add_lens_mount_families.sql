-- Phase B: Data Model Hardening - Add normalized mount families
-- This migration adds a normalized mount_family column to avoid brittle string pattern matching

-- 1) Add mount_family column to lens_database
ALTER TABLE lens_database
  ADD COLUMN mount_family TEXT;

-- 2) Backfill mount families from model prefixes
UPDATE lens_database
SET mount_family = CASE
  -- Barco lens families
  WHEN manufacturer='Barco' AND model ILIKE 'TLD+%'   THEN 'BARCO_TLD+'
  WHEN manufacturer='Barco' AND model ILIKE 'XLD%'    THEN 'BARCO_XLD'
  WHEN manufacturer='Barco' AND model ILIKE 'FLD+%'   THEN 'BARCO_FLD+'
  WHEN manufacturer='Barco' AND model ILIKE 'FLD %'   THEN 'BARCO_FLD'
  WHEN manufacturer='Barco' AND model ILIKE 'G %'     THEN 'BARCO_G'

  -- Christie lens families
  WHEN manufacturer='Christie' AND model ILIKE 'ILS1%'     THEN 'CHRISTIE_ILS1'
  WHEN manufacturer='Christie' AND model ILIKE 'ILS%'      THEN 'CHRISTIE_ILS'
  WHEN manufacturer='Christie' AND model ILIKE 'Griffyn%'  THEN 'CHRISTIE_GRIFFYN'
  WHEN manufacturer='Christie' AND model ILIKE 'Roadster%' THEN 'CHRISTIE_ROADSTER'
  WHEN manufacturer='Christie' AND (optical_features->>'manual_lens')::boolean IS TRUE THEN 'CHRISTIE_MANUAL'

  -- Panasonic lens families
  WHEN manufacturer='Panasonic' AND model ILIKE 'ET-D3Q%'   THEN 'PANA_ET-D3Q'
  WHEN manufacturer='Panasonic' AND model ILIKE 'ET-D3LE%'  THEN 'PANA_ET-D3LE'
  WHEN manufacturer='Panasonic' AND model ILIKE 'ET-D75LE%' THEN 'PANA_ET-D75LE'
  WHEN manufacturer='Panasonic' AND model ILIKE 'ET-DLE%'   THEN 'PANA_ET-DLE'
  WHEN manufacturer='Panasonic' AND model ILIKE 'ET-C1%'    THEN 'PANA_ET-C1'
  WHEN manufacturer='Panasonic' AND model ILIKE 'ET-D%'     THEN 'PANA_ET-D'

  -- Other manufacturer families
  WHEN manufacturer='Epson'     AND model ILIKE 'ELPL%'  THEN 'EPSON_ELPL'
  WHEN manufacturer='Sony'      AND model ILIKE 'VPLL%'  THEN 'SONY_VPLL'
  WHEN manufacturer='NEC/Sharp' AND model ILIKE 'NP%'    THEN 'NEC_NP'
  WHEN manufacturer='BenQ'      AND model ILIKE 'LS%'    THEN 'BENQ_LS'
  WHEN manufacturer='Optoma'    AND model ILIKE 'BX%'    THEN 'OPTOMA_BX'
  WHEN manufacturer='Vivitek'   AND model ILIKE 'VL%'    THEN 'VIVITEK_VL'

  -- Default for unmatched patterns
  ELSE 'OTHER'
END;

-- 3) Create indexes for performance
CREATE INDEX idx_lens_mount_family ON lens_database(mount_family);
CREATE INDEX idx_projector_mount ON projector_database(lens_mount_system);

-- 4) Add normalized projector mount families mapping function
-- We'll create a mapping from projector lens_mount_system to lens mount_family
CREATE OR REPLACE FUNCTION map_projector_mount_to_lens_family(mount_system TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE mount_system
    -- Barco mappings
    WHEN 'TLD+' THEN 'BARCO_TLD+'
    WHEN 'XLD+' THEN 'BARCO_XLD'
    WHEN 'XLD' THEN 'BARCO_XLD'
    WHEN 'FLD+' THEN 'BARCO_FLD+'
    WHEN 'FLD' THEN 'BARCO_FLD'
    WHEN 'G' THEN 'BARCO_G'
    WHEN 'GLD' THEN 'BARCO_G'  -- GLD projectors use G lenses

    -- Christie mappings
    WHEN 'ILS' THEN 'CHRISTIE_ILS'
    WHEN 'Manual' THEN 'CHRISTIE_ROADSTER'  -- Most manual are Roadster

    -- Panasonic mappings
    WHEN 'ET-D3Q' THEN 'PANA_ET-D3Q'
    WHEN 'ET-D3LE' THEN 'PANA_ET-D3LE'
    WHEN 'ET-D75LE' THEN 'PANA_ET-D75LE'
    WHEN 'ET-DLE' THEN 'PANA_ET-DLE'
    WHEN 'ET-C1' THEN 'PANA_ET-C1'
    WHEN 'ET-D' THEN 'PANA_ET-D'

    -- Other mappings
    WHEN 'ELPL' THEN 'EPSON_ELPL'
    WHEN 'VPLL' THEN 'SONY_VPLL'
    WHEN 'NP' THEN 'NEC_NP'

    ELSE 'OTHER'
  END;
END;
$$;

-- 5) Update compatibility seeding with mount families
-- Remove old pattern-based inserts and replace with mount family mappings

-- Delete existing compatibility data to rebuild with mount families
-- (Keep this commented out for now - we'll run this manually if needed)
-- DELETE FROM projector_lens_compatibility WHERE compatibility_notes LIKE '%Native%';

-- Add new mount family-based compatibility mappings
-- These will be more reliable than string pattern matching

-- Barco TLD+ family
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native TLD+ compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'BARCO_TLD+'
  AND l.mount_family = 'BARCO_TLD+'
  AND p.manufacturer = l.manufacturer
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Barco XLD family
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native XLD compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'BARCO_XLD'
  AND l.mount_family = 'BARCO_XLD'
  AND p.manufacturer = l.manufacturer
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Barco G family (including GLD projectors)
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native G/GLD compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'BARCO_G'
  AND l.mount_family = 'BARCO_G'
  AND p.manufacturer = l.manufacturer
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Christie ILS family
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ILS compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'CHRISTIE_ILS'
  AND l.mount_family IN ('CHRISTIE_ILS', 'CHRISTIE_ILS1')
  AND p.manufacturer = l.manufacturer
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Christie Roadster manual family
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Roadster manual compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'CHRISTIE_ROADSTER'
  AND l.mount_family IN ('CHRISTIE_ROADSTER', 'CHRISTIE_MANUAL')
  AND p.manufacturer = l.manufacturer
  AND p.series LIKE 'Roadster%'
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Panasonic ET-D3LE family
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ET-D3LE compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'PANA_ET-D3LE'
  AND l.mount_family = 'PANA_ET-D3LE'
  AND p.manufacturer = l.manufacturer
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Panasonic ET-D75LE family
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ET-D75LE compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'PANA_ET-D75LE'
  AND l.mount_family = 'PANA_ET-D75LE'
  AND p.manufacturer = l.manufacturer
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Panasonic ET-D3Q family
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ET-D3Q compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'PANA_ET-D3Q'
  AND l.mount_family = 'PANA_ET-D3Q'
  AND p.manufacturer = l.manufacturer
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Panasonic ET-DLE family
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ET-DLE compatibility (mount family)'
FROM projector_database p
CROSS JOIN lens_database l
WHERE map_projector_mount_to_lens_family(p.lens_mount_system) = 'PANA_ET-DLE'
  AND l.mount_family = 'PANA_ET-DLE'
  AND p.manufacturer = l.manufacturer
ON CONFLICT (projector_id, lens_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN lens_database.mount_family IS 'Normalized mount family for reliable compatibility matching without string patterns';
COMMENT ON FUNCTION map_projector_mount_to_lens_family(TEXT) IS 'Maps projector lens_mount_system to normalized lens mount_family';

-- Create view for easy compatibility lookup by mount family
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
ORDER BY p.manufacturer, p.series, p.model, l.throw_ratio_min;

COMMENT ON VIEW lens_compatibility_by_mount IS 'Easy lookup of lens compatibility organized by mount families';