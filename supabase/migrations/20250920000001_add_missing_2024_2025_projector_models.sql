-- Add missing 2024-2025 professional projector models
-- This migration adds the latest professional projector models identified as missing from the database

-- Insert missing Barco I600 Series (2024 releases)
INSERT INTO projector_database (manufacturer, series, model, brightness_ansi, brightness_center, native_resolution, technology_type, lens_mount_system, specifications) VALUES
('Barco', 'I600', 'I600-4K15', 14000, 15000, '4K', 'Laser Phosphor', 'ILD', '{"weight": 22, "power": 1500, "cooling": "air", "year": 2024, "features": ["single_chip_dlp", "supershift_pixel_shifting", "20000_hour_laser"], "dimensions": {"width": 502, "height": 206, "depth": 524}}'),
('Barco', 'I600', 'I600-4K10', 10000, 10800, '4K', 'Laser Phosphor', 'ILD', '{"weight": 22, "power": 1200, "cooling": "air", "year": 2024, "features": ["single_chip_dlp", "supershift_pixel_shifting", "20000_hour_laser"], "dimensions": {"width": 502, "height": 206, "depth": 524}}'),
('Barco', 'I600', 'I600-4K8', 8000, 8600, '4K', 'Laser Phosphor', 'ILD', '{"weight": 22, "power": 1000, "cooling": "air", "year": 2024, "features": ["single_chip_dlp", "supershift_pixel_shifting", "20000_hour_laser"], "dimensions": {"width": 502, "height": 206, "depth": 524}}'),

-- Insert missing Christie M 4K RGB Series (2024 updates)
('Christie', 'M Series', 'M 4K15 RGB', 15750, 16500, '4K', 'RGB Laser', 'ILS', '{"weight": 42, "power": 1650, "cooling": "air", "year": 2024, "features": ["3dlp", "rgb_pure_laser", "25000_hour_laser", "omnidirectional"], "operates_on_120V": true}'),
('Christie', 'M Series', 'M 4K+25 RGB', 26800, 28000, '4K+', 'RGB Laser', 'ILS', '{"weight": 58, "power": 2900, "cooling": "liquid", "year": 2024, "features": ["3dlp", "rgb_pure_laser", "50000_hour_laser", "omnidirectional"]}'),

-- Insert missing Panasonic PT-RQ7 Series (Q4 2024)
('Panasonic', 'PT-RQ', 'PT-RQ7L', 7500, 8000, '4K', 'Laser Phosphor', 'ET-D3LE', '{"weight": 18, "power": 900, "cooling": "air", "year": 2024, "features": ["quad_pixel_drive", "20000_hour_laser", "intel_sdm"], "dimensions": {"width": 498, "height": 161, "depth": 440}}'),
('Panasonic', 'PT-RQ', 'PT-RQ6L', 6500, 7000, '4K', 'Laser Phosphor', 'ET-D3LE', '{"weight": 18, "power": 800, "cooling": "air", "year": 2024, "features": ["quad_pixel_drive", "20000_hour_laser", "intel_sdm"], "dimensions": {"width": 498, "height": 161, "depth": 440}}'),
('Panasonic', 'PT-RZ', 'PT-RZ7L', 7500, 8000, 'WUXGA', 'Laser Phosphor', 'ET-D3LE', '{"weight": 18, "power": 900, "cooling": "air", "year": 2024, "features": ["quad_pixel_drive", "20000_hour_laser", "intel_sdm"], "dimensions": {"width": 498, "height": 161, "depth": 440}}'),
('Panasonic', 'PT-RZ', 'PT-RZ6L', 6500, 7000, 'WUXGA', 'Laser Phosphor', 'ET-D3LE', '{"weight": 18, "power": 800, "cooling": "air", "year": 2024, "features": ["quad_pixel_drive", "20000_hour_laser", "intel_sdm"], "dimensions": {"width": 498, "height": 161, "depth": 440}}'),

-- Insert missing Digital Projection TITAN updates (2024)
('Digital Projection', 'TITAN', 'Titan Laser 41000 4K-UHD', 41000, 43000, '4K', 'Laser Phosphor', 'High Brightness', '{"weight": 90, "power": 4300, "cooling": "liquid", "year": 2024, "features": ["colorboost_red_laser", "40000_hour_laser", "27_percent_brighter"], "efficiency_improvement": "15_percent"}'),
('Digital Projection', 'TITAN', 'Titan Laser 47000 WUXGA', 47000, 49000, 'WUXGA', 'Laser Phosphor', 'High Brightness', '{"weight": 90, "power": 4700, "cooling": "liquid", "year": 2024, "features": ["colorboost_red_laser", "40000_hour_laser", "13_percent_smaller"], "efficiency_improvement": "15_percent"}'),

-- Insert missing Digital Projection E-Vision 2024 updates
('Digital Projection', 'E-Vision', 'E-Vision 16000i WU', 16000, 17000, 'WUXGA', 'Laser', 'Standard', '{"weight": 22, "power": 1600, "cooling": "air", "year": 2024, "features": ["single_chip_dlp", "hep_dmd"]}'),
('Digital Projection', 'E-Vision', 'E-Vision 10000i WU', 9600, 10200, 'WUXGA', 'Laser', 'Standard', '{"weight": 22, "power": 1100, "cooling": "air", "year": 2024, "features": ["single_chip_dlp", "hep_dmd"]}'),
('Digital Projection', 'E-Vision', 'E-Vision 10000i RGB', 10000, 10500, 'WUXGA', 'RGB Laser', 'Standard', '{"weight": 24, "power": 1200, "cooling": "air", "year": 2024, "features": ["single_chip_dlp", "0.8_inch_hep_dmd", "rgb_laser"]}'),

-- Insert missing Sharp post-NEC acquisition models (2024-2025)
('Sharp', 'XP Series', 'XP-P601Q', 6000, 6500, '4K', 'DLP', 'NP', '{"weight": 20, "power": 750, "cooling": "air", "post_nec_merger": true, "year": 2024, "features": ["4k_uhd", "dlp"]}'),
('Sharp', 'XP Series', 'XP-P721Q', 7200, 7700, '4K', 'DLP', 'NP', '{"weight": 22, "power": 850, "cooling": "air", "post_nec_merger": true, "year": 2024, "features": ["4k_uhd", "dlp"]}'),
('Sharp', 'X Series', 'X141Q', 14000, 14800, '4K+', 'RB Laser', 'NP', '{"weight": 45, "power": 1500, "cooling": "air", "post_nec_merger": true, "year": 2024, "features": ["4k_plus", "rb_laser", "november_2024_release"]}'),
('Sharp', 'X Series', 'X171Q', 17000, 18000, '4K+', 'RB Laser', 'NP', '{"weight": 50, "power": 1800, "cooling": "air", "post_nec_merger": true, "year": 2025, "features": ["4k_plus", "rb_laser", "january_2025_release"]}'),

-- Insert other notable 2024-2025 releases
('Christie', 'Sapphire', 'Sapphire 4K40-RGBH', 40000, 42000, '4K', 'RGB Laser', 'ILS', '{"weight": 75, "power": 4200, "cooling": "liquid", "year": 2024, "features": ["rgb_laser", "high_brightness", "4k_native"]}'),
('Barco', 'QDX', 'QDX-4K45', 41000, 45000, '4K', 'Laser Phosphor', 'TLD+', '{"weight": 52, "power": 4500, "cooling": "liquid", "year": 2024, "features": ["variable_brightness", "33000_to_41000_lumens"]}');

-- Add index for year-based queries
CREATE INDEX IF NOT EXISTS idx_projector_year ON projector_database((specifications->>'year'));

-- Add comment documenting the update
COMMENT ON TABLE projector_database IS 'Global database of projector specifications - Updated with 2024-2025 models on 2025-01-20';