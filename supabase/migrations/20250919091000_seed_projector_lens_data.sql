-- Seed data for projectors and lenses
-- This migration populates the database with professional projector and lens specifications

-- The TRUNCATE statements have been removed to prevent accidental data loss in production.
-- If you need to clear data in a development environment, please do so with a separate script.
-- TRUNCATE TABLE projector_lens_compatibility CASCADE;
-- TRUNCATE TABLE lens_database CASCADE;
-- TRUNCATE TABLE projector_database CASCADE;

-- Insert Barco Projectors
INSERT INTO projector_database (manufacturer, series, model, brightness_ansi, brightness_center, native_resolution, technology_type, lens_mount_system, specifications) VALUES
-- UDX Series (Laser Phosphor, 3-Chip DLP, Current)
('Barco', 'UDX', 'UDX-4K22', 22000, 24000, '4K', 'Laser Phosphor', 'TLD+', '{"weight": 44, "power": 2300, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-W22', 22000, 24000, 'WUXGA', 'Laser Phosphor', 'TLD+', '{"weight": 44, "power": 2300, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-4K26', 26000, 28000, '4K', 'Laser Phosphor', 'TLD+', '{"weight": 44, "power": 2700, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-W26', 26000, 28000, 'WUXGA', 'Laser Phosphor', 'TLD+', '{"weight": 44, "power": 2700, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-4K32', 31000, 33000, '4K', 'Laser Phosphor', 'TLD+', '{"weight": 49, "power": 3200, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-W32', 32000, 34000, 'WUXGA', 'Laser Phosphor', 'TLD+', '{"weight": 49, "power": 3200, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-4K40 FLEX', 37500, 40000, '4K', 'Laser Phosphor', 'TLD+', '{"weight": 49, "power": 3900, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-W40', 40000, 42000, 'WUXGA', 'Laser Phosphor', 'TLD+', '{"weight": 49, "power": 4000, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-U32', 32000, 34000, 'WQXGA', 'Laser Phosphor', 'TLD+', '{"weight": 49, "power": 3200, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-U40', 40000, 42000, 'WQXGA', 'Laser Phosphor', 'TLD+', '{"weight": 49, "power": 4000, "cooling": "liquid"}'),
('Barco', 'UDX', 'UDX-U45LC', 45000, 47000, 'WQXGA', 'Laser Phosphor', 'TLD+', '{"weight": 52, "power": 4500, "cooling": "liquid"}'),

-- UDM Series (Laser Phosphor, 3-Chip DLP, Current)
('Barco', 'UDM', 'UDM-4K15', 15000, 16000, '4K', 'Laser Phosphor', 'TLD+', '{"weight": 40, "power": 1650, "cooling": "air"}'),
('Barco', 'UDM', 'UDM-W15', 15000, 16000, 'WUXGA', 'Laser Phosphor', 'TLD+', '{"weight": 40, "power": 1650, "cooling": "air"}'),
('Barco', 'UDM', 'UDM-W19', 19000, 20000, 'WUXGA', 'Laser Phosphor', 'TLD+', '{"weight": 40, "power": 2000, "cooling": "air"}'),
('Barco', 'UDM', 'UDM-4K22', 21000, 22000, '4K', 'Laser Phosphor', 'TLD+', '{"weight": 40, "power": 2300, "cooling": "air"}'),
('Barco', 'UDM', 'UDM-W22', 22000, 23000, 'WUXGA', 'Laser Phosphor', 'TLD+', '{"weight": 40, "power": 2300, "cooling": "air"}'),
('Barco', 'UDM', 'UDM-4K30', 30000, 31000, '4K', 'Laser Phosphor', 'TLD+', '{"weight": 43, "power": 3100, "cooling": "air"}'),
('Barco', 'UDM', 'UDM-W30', 30000, 31000, 'WUXGA', 'Laser Phosphor', 'TLD+', '{"weight": 43, "power": 3100, "cooling": "air"}'),

-- HDX Series (Xenon Lamp, 3-Chip DLP, Legacy)
('Barco', 'HDX', 'HDX-W12', 12000, 13000, 'WUXGA', 'Xenon Lamp', 'TLD+', '{"weight": 42, "power": 1400, "cooling": "air"}'),
('Barco', 'HDX', 'HDX-W14', 14000, 15000, 'WUXGA', 'Xenon Lamp', 'TLD+', '{"weight": 42, "power": 1600, "cooling": "air"}'),
('Barco', 'HDX', 'HDX-W18', 18000, 19000, 'WUXGA', 'Xenon Lamp', 'TLD+', '{"weight": 44, "power": 2000, "cooling": "air"}'),
('Barco', 'HDX', 'HDX-4K12', 12000, 13000, '4K', 'Xenon Lamp', 'TLD+', '{"weight": 42, "power": 1400, "cooling": "air"}'),
('Barco', 'HDX', 'HDX-4K14', 14000, 15000, '4K', 'Xenon Lamp', 'TLD+', '{"weight": 42, "power": 1600, "cooling": "air"}'),
('Barco', 'HDX', 'HDX-4K20 FLEX', 20000, 21000, '4K', 'Xenon Lamp', 'TLD+', '{"weight": 46, "power": 2200, "cooling": "air"}'),
('Barco', 'HDX', 'HDX-W20 FLEX', 20000, 21000, 'WUXGA', 'Xenon Lamp', 'TLD+', '{"weight": 46, "power": 2200, "cooling": "air"}'),

-- HDF Series (Xenon Lamp, 3-Chip DLP, Legacy)
('Barco', 'HDF', 'HDF-W22', 22000, 23000, 'WUXGA', 'Xenon Lamp', 'TLD+', '{"weight": 54, "power": 2500, "cooling": "liquid"}'),
('Barco', 'HDF', 'HDF-W26', 26000, 27000, 'WUXGA', 'Xenon Lamp', 'TLD+', '{"weight": 54, "power": 2900, "cooling": "liquid"}'),
('Barco', 'HDF', 'HDF-W30LP FLEX', 30000, 31000, 'WUXGA', 'Xenon Lamp', 'TLD+', '{"weight": 58, "power": 3300, "cooling": "liquid"}'),
('Barco', 'HDQ', 'HDQ-2K40', 40000, 41000, '2K', 'Xenon Lamp', 'XLD+', '{"weight": 68, "power": 4400, "cooling": "liquid"}'),

-- G Series (Laser Phosphor, 1-Chip DLP, Current)
('Barco', 'G50', 'G50-W6', 6000, 6500, 'WUXGA', 'Laser Phosphor', 'G', '{"weight": 21, "power": 750, "cooling": "air"}'),
('Barco', 'G50', 'G50-W7', 7000, 7500, 'WUXGA', 'Laser Phosphor', 'G', '{"weight": 21, "power": 850, "cooling": "air"}'),
('Barco', 'G50', 'G50-W8', 8000, 8500, 'WUXGA', 'Laser Phosphor', 'G', '{"weight": 21, "power": 950, "cooling": "air"}'),
('Barco', 'G60', 'G60-W7', 7000, 7500, 'WUXGA', 'Laser Phosphor', 'G', '{"weight": 23, "power": 850, "cooling": "air"}'),
('Barco', 'G62', 'G62-W9', 9000, 9500, 'WUXGA', 'Laser Phosphor', 'G', '{"weight": 23, "power": 1050, "cooling": "air"}'),
('Barco', 'G62', 'G62-W11', 11000, 11500, 'WUXGA', 'Laser Phosphor', 'G', '{"weight": 23, "power": 1250, "cooling": "air"}'),
('Barco', 'G62', 'G62-W14', 14000, 14500, 'WUXGA', 'Laser Phosphor', 'G', '{"weight": 26, "power": 1550, "cooling": "air"}'),
('Barco', 'G100', 'G100-W16', 16000, 16500, 'WUXGA', 'Laser Phosphor', 'GLD', '{"weight": 34, "power": 1750, "cooling": "air"}'),
('Barco', 'G100', 'G100-W19', 19000, 19500, 'WUXGA', 'Laser Phosphor', 'GLD', '{"weight": 34, "power": 2050, "cooling": "air"}'),
('Barco', 'G100', 'G100-W22', 22000, 22500, 'WUXGA', 'Laser Phosphor', 'GLD', '{"weight": 34, "power": 2350, "cooling": "air"}'),

-- Legacy Series (Still in Rental)
('Barco', 'CLM', 'CLM HD8', 8000, 8500, '1080p', 'Xenon Lamp', 'TLD', '{"weight": 38, "power": 1100, "cooling": "air"}'),
('Barco', 'XLM', 'XLM HD30', 30000, 31000, '1080p', 'Xenon Lamp', 'XLD+', '{"weight": 65, "power": 3300, "cooling": "liquid"}'),

-- Christie Digital Projectors
-- Boxer Series (Mercury Lamp, 3-Chip DLP, Legacy)
('Christie', 'Boxer', 'Boxer 4K20', 20000, 21000, '4K', 'Mercury Lamp', 'Manual', '{"weight": 50, "power": 2200, "cooling": "air"}'),
('Christie', 'Boxer', 'Boxer 4K30', 30000, 31000, '4K', 'Mercury Lamp', 'Manual', '{"weight": 65, "power": 3300, "cooling": "liquid"}'),
('Christie', 'Boxer', 'Boxer 30', 30000, 31000, '2K', 'Mercury Lamp', 'Manual', '{"weight": 65, "power": 3300, "cooling": "liquid"}'),
('Christie', 'Boxer', 'Boxer 2K20', 20000, 21000, '2K', 'Mercury Lamp', 'Manual', '{"weight": 50, "power": 2200, "cooling": "air"}'),
('Christie', 'Boxer', 'Boxer 2K25', 25000, 26000, '2K', 'Mercury Lamp', 'Manual', '{"weight": 55, "power": 2700, "cooling": "air"}'),
('Christie', 'Boxer', 'Boxer 2K30', 30000, 31000, '2K', 'Mercury Lamp', 'Manual', '{"weight": 65, "power": 3300, "cooling": "liquid"}'),

-- Crimson Series (Laser Phosphor, 3-Chip DLP, Current)
('Christie', 'Crimson', 'Crimson HD25', 25000, 26000, '1080p', 'Laser Phosphor', 'ILS', '{"weight": 47, "power": 2600, "cooling": "air"}'),
('Christie', 'Crimson', 'Crimson WU25', 25000, 26000, 'WUXGA', 'Laser Phosphor', 'ILS', '{"weight": 47, "power": 2600, "cooling": "air"}'),
('Christie', 'Crimson', 'Crimson HD31', 31000, 32000, '1080p', 'Laser Phosphor', 'ILS', '{"weight": 50, "power": 3200, "cooling": "air"}'),
('Christie', 'Crimson', 'Crimson WU31', 31000, 32000, 'WUXGA', 'Laser Phosphor', 'ILS', '{"weight": 50, "power": 3200, "cooling": "air"}'),

-- M Series (Various Technologies)
('Christie', 'M Series', 'M 4K25 RGB', 25300, 27000, '4K', 'RGB Laser', 'ILS', '{"weight": 65, "power": 3500, "cooling": "liquid"}'),
('Christie', 'Roadster', 'Roadster HD10K-M', 10000, 10500, '1080p', 'Xenon Lamp', 'Manual', '{"weight": 32, "power": 1200, "cooling": "air"}'),
('Christie', 'Roadster', 'Roadster HD14K-M', 14000, 14500, '1080p', 'Xenon Lamp', 'Manual', '{"weight": 35, "power": 1600, "cooling": "air"}'),
('Christie', 'Roadster', 'Roadster S+10K-M', 10000, 10500, 'SXGA+', 'Xenon Lamp', 'Manual', '{"weight": 32, "power": 1200, "cooling": "air"}'),
('Christie', 'Roadster', 'Roadster S+14K-M', 14000, 14500, 'SXGA+', 'Xenon Lamp', 'Manual', '{"weight": 35, "power": 1600, "cooling": "air"}'),

-- J Series (Xenon Lamp, 3-Chip DLP, Legacy)
('Christie', 'Mirage', 'Mirage HD20K-J', 20000, 21000, '1080p', 'Xenon Lamp', 'ILS', '{"weight": 45, "power": 2200, "cooling": "air"}'),
('Christie', 'Roadster', 'Roadster HD20K-J', 20000, 21000, '1080p', 'Xenon Lamp', 'ILS', '{"weight": 45, "power": 2200, "cooling": "air"}'),

-- Roadster Series (Xenon Lamp, 3-Chip DLP, Legacy)
('Christie', 'Roadster', 'Roadster HD18K', 17500, 18000, '1080p', 'Xenon Lamp', 'Manual', '{"weight": 42, "power": 1900, "cooling": "air"}'),
('Christie', 'Roadster', 'Roadster S+20K', 20000, 21000, 'SXGA+', 'Xenon Lamp', 'Manual', '{"weight": 45, "power": 2200, "cooling": "air"}'),

-- Mirage Series (Various Technologies)
('Christie', 'Mirage', 'Mirage 304K', 30000, 31000, '4K', 'Xenon Lamp', 'Manual', '{"weight": 65, "power": 3300, "cooling": "liquid"}'),
('Christie', 'Mirage', 'Mirage HD25', 25000, 26000, '1080p', 'Laser Phosphor', 'ILS', '{"weight": 47, "power": 2600, "cooling": "air"}'),
('Christie', 'Mirage', 'Mirage WU25', 25000, 26000, 'WUXGA', 'Laser Phosphor', 'ILS', '{"weight": 47, "power": 2600, "cooling": "air"}'),
('Christie', 'Mirage', 'Mirage 4K25', 25000, 26000, '4K', 'Xenon Lamp', 'Manual', '{"weight": 55, "power": 2700, "cooling": "air"}'),
('Christie', 'Mirage', 'Mirage 4K35', 35000, 36000, '4K', 'Xenon Lamp', 'Manual', '{"weight": 70, "power": 3800, "cooling": "liquid"}'),
('Christie', 'Mirage', 'Mirage 4K40-RGB', 40000, 41000, '4K', 'RGB Laser', 'ILS', '{"weight": 85, "power": 4200, "cooling": "liquid"}'),
('Christie', 'Mirage', 'Mirage S+4K', 4000, 4200, 'SXGA+', 'Xenon Lamp', 'Manual', '{"weight": 28, "power": 600, "cooling": "air"}'),

-- D4K Series (Various Technologies)
('Christie', 'D4K', 'D4K40-RGB', 45000, 46000, '4K', 'RGB Laser', 'ILS', '{"weight": 95, "power": 4700, "cooling": "liquid"}'),
('Christie', 'D4K', 'D4K2560', 25000, 26000, '4K', 'Xenon Lamp', 'Manual', '{"weight": 55, "power": 2700, "cooling": "air"}'),
('Christie', 'D4K', 'D4K3560', 35000, 36000, '4K', 'Xenon Lamp', 'Manual', '{"weight": 70, "power": 3800, "cooling": "liquid"}'),
('Christie', 'D4K', 'D4K35', 35000, 36000, '4K', 'Xenon Lamp', 'Manual', '{"weight": 70, "power": 3800, "cooling": "liquid"}'),
('Christie', 'D4K', 'D4K25', 25000, 26000, '4K', 'Xenon Lamp', 'Manual', '{"weight": 55, "power": 2700, "cooling": "air"}'),

-- Panasonic Projectors
-- PT-RZ Series (Laser Phosphor, 3-Chip DLP, Current)
('Panasonic', 'PT-RZ', 'PT-RZ6L', 6500, 7000, 'WUXGA', 'Laser Phosphor', 'ET-D3LE', '{"weight": 24, "power": 800, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ7L', 7500, 8000, 'WUXGA', 'Laser Phosphor', 'ET-D3LE', '{"weight": 24, "power": 900, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ12K', 12000, 12500, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 28, "power": 1200, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ14K', 14000, 14500, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 28, "power": 1450, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ17K', 16000, 16500, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 35, "power": 1700, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ21K', 21000, 22000, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 43, "power": 2200, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ24K', 20000, 21000, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 43, "power": 2100, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ31K', 31000, 32000, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 50, "power": 3200, "cooling": "liquid"}'),
('Panasonic', 'PT-RZ', 'PT-RZ34K', 30500, 31500, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 50, "power": 3150, "cooling": "liquid"}'),
('Panasonic', 'PT-RZ', 'PT-RZ34K2', 32000, 33000, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 50, "power": 3300, "cooling": "liquid"}'),
('Panasonic', 'PT-RZ', 'PT-RZ44K', 40000, 41000, 'WUXGA', 'Laser Phosphor', 'ET-D75LE', '{"weight": 62, "power": 4100, "cooling": "liquid"}'),

-- PT-RZ Series (Laser Phosphor, 1-Chip DLP)
('Panasonic', 'PT-RZ', 'PT-RZ120', 12000, 12500, 'WUXGA', 'Laser Phosphor', 'ET-DLE', '{"weight": 18, "power": 1250, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ690', 6000, 6500, 'WUXGA', 'Laser Phosphor', 'ET-DLE', '{"weight": 15, "power": 700, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ790', 7000, 7500, 'WUXGA', 'Laser Phosphor', 'ET-DLE', '{"weight": 15, "power": 800, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ890', 8500, 9000, 'WUXGA', 'Laser Phosphor', 'ET-DLE', '{"weight": 15, "power": 950, "cooling": "air"}'),
('Panasonic', 'PT-RZ', 'PT-RZ990', 9400, 9900, 'WUXGA', 'Laser Phosphor', 'ET-DLE', '{"weight": 15, "power": 1050, "cooling": "air"}'),

-- PT-RQ Series (Laser Phosphor, 3-Chip DLP, Current)
('Panasonic', 'PT-RQ', 'PT-RQ6L', 6500, 7000, '4K', 'Laser Phosphor', 'ET-D3LE', '{"weight": 24, "power": 800, "cooling": "air"}'),
('Panasonic', 'PT-RQ', 'PT-RQ7L', 7500, 8000, '4K', 'Laser Phosphor', 'ET-D3LE', '{"weight": 24, "power": 900, "cooling": "air"}'),
('Panasonic', 'PT-RQ', 'PT-RQ13K', 10000, 10500, '4K+', 'Laser Phosphor', 'ET-D3Q', '{"weight": 28, "power": 1100, "cooling": "air"}'),
('Panasonic', 'PT-RQ', 'PT-RQ18K', 16000, 16500, '4K', 'Laser Phosphor', 'ET-D3Q', '{"weight": 35, "power": 1700, "cooling": "air"}'),
('Panasonic', 'PT-RQ', 'PT-RQ22K', 21000, 22000, '4K+', 'Laser Phosphor', 'ET-D3Q', '{"weight": 43, "power": 2200, "cooling": "air"}'),
('Panasonic', 'PT-RQ', 'PT-RQ25K', 20000, 21000, '4K', 'Laser Phosphor', 'ET-D3Q', '{"weight": 43, "power": 2100, "cooling": "air"}'),
('Panasonic', 'PT-RQ', 'PT-RQ32K', 27000, 28000, '4K+', 'Laser Phosphor', 'ET-D3Q', '{"weight": 50, "power": 2900, "cooling": "liquid"}'),
('Panasonic', 'PT-RQ', 'PT-RQ35K', 30500, 31500, '4K', 'Laser Phosphor', 'ET-D3Q', '{"weight": 50, "power": 3150, "cooling": "liquid"}'),
('Panasonic', 'PT-RQ', 'PT-RQ35K2', 32000, 33000, '4K', 'Laser Phosphor', 'ET-D3Q', '{"weight": 50, "power": 3300, "cooling": "liquid"}'),
('Panasonic', 'PT-RQ', 'PT-RQ45K', 40000, 41000, '4K', 'Laser Phosphor', 'ET-D3Q', '{"weight": 62, "power": 4100, "cooling": "liquid"}'),
('Panasonic', 'PT-RQ', 'PT-RQ50K', 50000, 51000, '4K', 'Laser Phosphor', 'ET-D3Q', '{"weight": 75, "power": 5100, "cooling": "liquid"}'),

-- Legacy PT-DZ Series (UHP/Xenon Lamp, 3-Chip DLP)
('Panasonic', 'PT-DZ', 'PT-DZ10000', 10000, 10500, '1080p', 'Xenon Lamp', 'ET-D', '{"weight": 35, "power": 1200, "cooling": "air"}'),
('Panasonic', 'PT-DZ', 'PT-DZ16K2', 16000, 16500, 'WUXGA', 'Xenon Lamp', 'ET-D', '{"weight": 42, "power": 1800, "cooling": "air"}'),
('Panasonic', 'PT-DZ', 'PT-DZ21K', 21000, 22000, 'WUXGA', 'Xenon Lamp', 'ET-D', '{"weight": 48, "power": 2300, "cooling": "air"}'),
('Panasonic', 'PT-DZ', 'PT-DZ21K2', 21000, 22000, 'WUXGA', 'Xenon Lamp', 'ET-D', '{"weight": 48, "power": 2300, "cooling": "air"}'),

-- Epson Projectors
-- EB-PU Series (3LCD Laser, Current)
('Epson', 'EB-PU', 'EB-PU1006W', 6000, 6500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 18, "power": 700, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU1007B', 7000, 7500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 18, "power": 800, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU1007W', 7000, 7500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 18, "power": 800, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU1008B', 8500, 9000, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 18, "power": 950, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU1008W', 8500, 9000, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 18, "power": 950, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2010B', 10000, 10500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 21, "power": 1100, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2010W', 10000, 10500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 21, "power": 1100, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2113B', 13000, 13500, '4K Enhancement', '3LCD Laser', 'ELPL', '{"weight": 25, "power": 1400, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2113W', 13000, 13500, '4K Enhancement', '3LCD Laser', 'ELPL', '{"weight": 25, "power": 1400, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2116W', 16000, 16500, '4K Enhancement', '3LCD Laser', 'ELPL', '{"weight": 28, "power": 1700, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2120W', 20000, 21000, '4K Enhancement', '3LCD Laser', 'ELPL', '{"weight": 32, "power": 2100, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2213B', 13000, 13500, '4K Enhancement', '3LCD Laser', 'ELPL', '{"weight": 25, "power": 1400, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2216B', 16000, 16500, '3G-SDI', '3LCD Laser', 'ELPL', '{"weight": 28, "power": 1700, "cooling": "air"}'),
('Epson', 'EB-PU', 'EB-PU2220B', 20000, 21000, '4K Enhancement', '3LCD Laser', 'ELPL', '{"weight": 32, "power": 2100, "cooling": "air"}'),

-- Pro L Series (Professional Large Venue Laser)
('Epson', 'Pro L', 'Pro L30000UNL', 30000, 31000, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 70, "power": 3100, "cooling": "liquid"}'),
('Epson', 'Pro L', 'Pro L30002UNL', 30000, 31000, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 70, "power": 3100, "cooling": "liquid"}'),
('Epson', 'Pro L', 'Pro L25000U', 25000, 26000, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 63, "power": 2600, "cooling": "liquid"}'),
('Epson', 'Pro L', 'Pro L20000UNL', 20000, 21000, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 32, "power": 2100, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L20002U', 20000, 21000, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 32, "power": 2100, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1755UNL', 15000, 15500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 28, "power": 1600, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1750UNL', 15000, 15500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 28, "power": 1600, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1750U', 15000, 15500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 28, "power": 1600, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1505UHNL', 12000, 12500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 23, "power": 1100, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1500UHNL', 12000, 12500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 23, "power": 1100, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1500UH', 12000, 12500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 23, "power": 1100, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1500U', 12000, 12500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 23, "power": 1100, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1200U', 12000, 12500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 20, "power": 1100, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1100U', 11000, 11500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 20, "power": 1000, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1070UNL', 7000, 7500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 15, "power": 800, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1070U', 7000, 7500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 15, "power": 800, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1060UNL', 6000, 6500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 13, "power": 700, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L1060U', 6000, 6500, 'WUXGA', '3LCD Laser', 'ELPL', '{"weight": 13, "power": 700, "cooling": "air"}'),
('Epson', 'Pro L', 'Pro L12000Q', 12000, 12500, '4K Enhancement', '3LCD Laser', 'ELPL', '{"weight": 25, "power": 1200, "cooling": "air"}'),

-- Sony Projectors
-- VPL-GTZ Series (4K SXRD Laser, Large Venue)
('Sony', 'VPL-GTZ', 'VPL-GTZ380', 10000, 10500, '4K', 'SXRD Laser', 'VPLL', '{"weight": 49, "power": 1200, "cooling": "liquid"}'),
('Sony', 'VPL-GTZ', 'VPL-GTZ380-P', 10000, 10500, '4K', 'SXRD Laser', 'VPLL', '{"weight": 49, "power": 1200, "cooling": "liquid"}'),
('Sony', 'VPL-GTZ', 'VPL-GTZ240', 2000, 2200, '4K', 'SXRD Laser', 'VPLL', '{"weight": 25, "power": 350, "cooling": "air"}'),
('Sony', 'VPL-GTZ', 'VPL-GTZ1', 2000, 2200, '4K', 'SXRD Laser', 'VPLL', '{"weight": 25, "power": 350, "cooling": "air"}'),

-- SRX Series (Digital Cinema)
('Sony', 'SRX', 'SRX-R815P', 15000, 16000, '4K', 'SXRD Laser', 'Integrated', '{"weight": 110, "power": 2000, "cooling": "liquid"}'),
('Sony', 'SRX', 'SRX-R815DS', 30000, 31000, '4K', 'SXRD Laser', 'Integrated', '{"weight": 220, "power": 4000, "cooling": "liquid"}'),
('Sony', 'SRX', 'SRX-R515P', 15000, 16000, '4K', 'SXRD Lamp', 'Integrated', '{"weight": 95, "power": 1800, "cooling": "liquid"}'),
('Sony', 'SRX', 'SRX-R320', 4000, 4200, '4K', 'SXRD Xenon', 'Integrated', '{"weight": 65, "power": 800, "cooling": "air"}'),
('Sony', 'SRX', 'SRX-R110', 10000, 10500, '4K', 'SXRD Xenon', 'Integrated', '{"weight": 85, "power": 1200, "cooling": "air"}'),

-- VPL-VW Series (Professional/High-End)
('Sony', 'VPL-VW', 'VPL-VW5000ES', 5000, 5200, '4K', 'SXRD Laser', 'VPLL', '{"weight": 35, "power": 700, "cooling": "air"}'),
('Sony', 'VPL-VW', 'VPL-VW995ES', 2200, 2400, '4K', 'SXRD Laser', 'VPLL', '{"weight": 28, "power": 400, "cooling": "air"}'),
('Sony', 'VPL-VW', 'VPL-VW890ES', 2200, 2400, '4K', 'SXRD Laser', 'VPLL', '{"weight": 28, "power": 400, "cooling": "air"}'),
('Sony', 'VPL-VW', 'VPL-VW885ES', 2000, 2200, '4K', 'SXRD Laser', 'VPLL', '{"weight": 25, "power": 350, "cooling": "air"}'),
('Sony', 'VPL-VW', 'VPL-VW695ES', 1800, 2000, '4K', 'SXRD Lamp', 'VPLL', '{"weight": 23, "power": 300, "cooling": "air"}'),
('Sony', 'VPL-VW', 'VPL-VW590ES', 1800, 2000, '4K', 'SXRD Lamp', 'VPLL', '{"weight": 23, "power": 300, "cooling": "air"}'),

-- Additional VPL Models
('Sony', 'VPL-FHZ', 'VPL-FHZ101LB', 10000, 10500, 'WUXGA', '3LCD Laser', 'VPLL', '{"weight": 25, "power": 1100, "cooling": "air"}'),
('Sony', 'VPL-FHZ', 'VPL-FHZ101LW', 10000, 10500, 'WUXGA', '3LCD Laser', 'VPLL', '{"weight": 25, "power": 1100, "cooling": "air"}'),
('Sony', 'VPL-FHZ', 'VPL-FHZ131LB', 13000, 13500, 'WUXGA', '3LCD Laser', 'VPLL', '{"weight": 28, "power": 1400, "cooling": "air"}'),
('Sony', 'VPL-FHZ', 'VPL-FHZ131LW', 13000, 13500, 'WUXGA', '3LCD Laser', 'VPLL', '{"weight": 28, "power": 1400, "cooling": "air"}'),

-- NEC/Sharp NEC Projectors
-- Digital Cinema NC Series
('NEC/Sharp', 'NC', 'NC3541L', 35000, 36000, '4K', 'RB Laser', 'NC', '{"weight": 75, "power": 3800, "cooling": "liquid"}'),
('NEC/Sharp', 'NC', 'NC2443ML', 24000, 25000, '4K', 'Modular', 'NC', '{"weight": 65, "power": 2600, "cooling": "liquid"}'),
('NEC/Sharp', 'NC', 'NC2043ML', 20000, 21000, '2K-4K', 'Modular', 'NC', '{"weight": 55, "power": 2200, "cooling": "air"}'),
('NEC/Sharp', 'NC', 'NC1843ML', 18000, 19000, '4K', 'Modular', 'NC', '{"weight": 50, "power": 2000, "cooling": "air"}'),
('NEC/Sharp', 'NC', 'NC1202L', 12000, 12500, '4K', 'Laser', 'NC', '{"weight": 35, "power": 1300, "cooling": "air"}'),

-- PX Series (Professional Installation)
('NEC/Sharp', 'PX', 'NP-PX2201UL', 22000, 23000, 'WUXGA', 'RB Laser', 'NP', '{"weight": 48, "power": 2400, "cooling": "air"}'),
('NEC/Sharp', 'PX', 'NP-PX2000UL', 20000, 21000, 'WUXGA', 'RB Laser', 'NP', '{"weight": 43, "power": 2100, "cooling": "air"}'),
('NEC/Sharp', 'PX', 'NP-PX1005QL-W', 10000, 10500, '4K', 'RB Laser', 'NP', '{"weight": 28, "power": 1100, "cooling": "air"}'),
('NEC/Sharp', 'PX', 'NP-PX1005QL-B', 10000, 10500, '4K', 'RB Laser', 'NP', '{"weight": 28, "power": 1100, "cooling": "air"}'),
('NEC/Sharp', 'PX', 'NP-PX1004UL-WH', 10000, 10500, 'WUXGA', 'RB Laser', 'NP', '{"weight": 25, "power": 1100, "cooling": "air"}'),
('NEC/Sharp', 'PX', 'NP-PX1004UL-BK', 10000, 10500, 'WUXGA', 'RB Laser', 'NP', '{"weight": 25, "power": 1100, "cooling": "air"}'),

-- PA Series (Professional Advanced)
('NEC/Sharp', 'PA', 'NP-PA1705UL-W', 17000, 18000, 'WUXGA', 'LCD Laser', 'NP', '{"weight": 38, "power": 1800, "cooling": "air"}'),
('NEC/Sharp', 'PA', 'NP-PA1705UL-B', 17000, 18000, 'WUXGA', 'LCD Laser', 'NP', '{"weight": 38, "power": 1800, "cooling": "air"}'),
('NEC/Sharp', 'PA', 'NP-PA1505UL-W', 15000, 15500, 'WUXGA', 'LCD Laser', 'NP', '{"weight": 35, "power": 1600, "cooling": "air"}'),
('NEC/Sharp', 'PA', 'NP-PA1505UL-B', 15000, 15500, 'WUXGA', 'LCD Laser', 'NP', '{"weight": 35, "power": 1600, "cooling": "air"}'),
('NEC/Sharp', 'PA', 'NP-PA1004UL-W', 10000, 10500, 'WUXGA', 'LCD Laser', 'NP', '{"weight": 25, "power": 1100, "cooling": "air"}'),
('NEC/Sharp', 'PA', 'NP-PA1004UL-B', 10000, 10500, 'WUXGA', 'LCD Laser', 'NP', '{"weight": 25, "power": 1100, "cooling": "air"}'),

-- Digital Projection
-- TITAN Series (3-Chip DLP, 26,000-47,000 lumens)
('Digital Projection', 'TITAN', 'Titan 41000 4K-UHD', 37000, 39000, '4K', 'Laser Phosphor', 'High Brightness', '{"weight": 87, "power": 4000, "cooling": "liquid"}'),
('Digital Projection', 'TITAN', 'Titan 47000 WUXGA', 47000, 48000, 'WUXGA', 'Laser Phosphor', 'High Brightness', '{"weight": 95, "power": 4800, "cooling": "liquid"}'),
('Digital Projection', 'TITAN', 'Titan Laser 26000 4K-UHD', 22500, 24000, '4K', 'Laser Phosphor', 'High Brightness', '{"weight": 75, "power": 2600, "cooling": "liquid"}'),
('Digital Projection', 'TITAN', 'Titan Laser 29000 WU', 29000, 30000, 'WUXGA', 'Laser Phosphor', 'High Brightness', '{"weight": 80, "power": 3100, "cooling": "liquid"}'),
('Digital Projection', 'TITAN', 'Titan Laser 33000 4K-UHD', 33000, 34000, '4K', 'Laser Phosphor', 'High Brightness', '{"weight": 85, "power": 3500, "cooling": "liquid"}'),
('Digital Projection', 'TITAN', 'Titan Laser 37000 WU', 37000, 38000, 'WUXGA', 'Laser Phosphor', 'High Brightness', '{"weight": 87, "power": 3900, "cooling": "liquid"}'),

-- INSIGHT Series (Ultra-high resolution)
('Digital Projection', 'INSIGHT', 'INSIGHT LASER 8K Gen I', 25000, 27000, '8K', 'Laser Phosphor', 'High Resolution', '{"weight": 75, "power": 2800, "cooling": "liquid"}'),
('Digital Projection', 'INSIGHT', 'INSIGHT LASER 8K Gen II', 30000, 32000, '8K', 'Laser Phosphor', 'High Resolution', '{"weight": 80, "power": 3300, "cooling": "liquid"}'),
('Digital Projection', 'INSIGHT', 'INSIGHT Satellite MLS', 40000, 41000, '8K', 'Modular Laser', 'High Resolution', '{"weight": 120, "power": 4200, "cooling": "liquid"}'),

-- M-Vision Series (Single-chip DLP, 18,000-30,000 lumens)
('Digital Projection', 'M-Vision', 'M-Vision 23000 WU', 20500, 22000, 'WUXGA', '1-Chip DLP', 'Standard', '{"weight": 45, "power": 2200, "cooling": "air"}'),
('Digital Projection', 'M-Vision', 'M-Vision 27000 WU', 27000, 28000, 'WUXGA', '1-Chip DLP', 'Standard', '{"weight": 55, "power": 2900, "cooling": "liquid"}'),
('Digital Projection', 'M-Vision', 'M-Vision 30000 WU', 30000, 31000, 'WUXGA', '1-Chip DLP', 'Standard', '{"weight": 65, "power": 3200, "cooling": "liquid"}'),
('Digital Projection', 'M-Vision', 'M-Vision Laser 18K', 16000, 17000, 'WUXGA', 'Laser', 'Standard', '{"weight": 38, "power": 1800, "cooling": "air"}'),
('Digital Projection', 'M-Vision', 'M-Vision Laser 21000 WU II', 18600, 19500, 'WUXGA', 'Laser', 'Standard', '{"weight": 42, "power": 2000, "cooling": "air"}'),

-- E-Vision Series (Single-chip DLP, 7,500-16,000 lumens)
('Digital Projection', 'E-Vision', 'E-Vision Laser 6500 II', 6500, 7000, 'WUXGA', 'Laser', 'Standard', '{"weight": 18, "power": 750, "cooling": "air"}'),
('Digital Projection', 'E-Vision', 'E-Vision Laser 4K-UHD HB', 4000, 4200, '4K', 'Laser', 'Standard', '{"weight": 15, "power": 450, "cooling": "air"}'),
('Digital Projection', 'E-Vision', 'E-Vision Laser 11000 4K-UHD', 11000, 11500, '4K', 'Laser', 'Standard', '{"weight": 25, "power": 1200, "cooling": "air"}'),
('Digital Projection', 'E-Vision', 'E-Vision Laser 13000 WU', 13000, 13500, 'WUXGA', 'Laser', 'Standard', '{"weight": 28, "power": 1400, "cooling": "air"}');

-- Insert Professional Lens Database
INSERT INTO lens_database (manufacturer, model, part_number, throw_ratio_min, throw_ratio_max, lens_type, zoom_type, motorized, lens_shift_v_max, lens_shift_h_max, optical_features) VALUES

-- BARCO TLD+ LENS SERIES (UDX, UDM, HDX, HDF, RLM, QDX, XDM series)
-- Ultra Short Throw Models
('Barco', 'TLD+ 0.37:1 UST 90°', 'R9801661', 0.37, 0.37, 'UST', 'Fixed', true, 150, 150, '{"special": "90-degree output", "vertical_shift": "±150%"}'),
('Barco', 'TLD+ 0.39:1', 'TLD+040', 0.38, 0.42, 'UST', 'Fixed', true, 100, 50, '{"throw_ratio_range": "0.38-0.42:1"}'),
('Barco', 'TLD+ 0.65-0.85:1', 'R9862001', 0.65, 0.85, 'UST', 'Zoom', true, 150, 150, '{"zoom_ratio": 1.31, "motorized": "zoom, focus, shift"}'),
('Barco', 'TLD+ 0.67-0.88:1', 'R9862000', 0.67, 0.88, 'UST', 'Zoom', true, 35, 20, '{"zoom_ratio": 1.31, "shift": "±150%"}'),
('Barco', 'TLD+ 0.67:1', 'R9862000_FIXED', 0.67, 0.67, 'UST', 'Fixed', true, 35, 20, '{"horizontal_shift": "±20%", "vertical_shift": "±35%"}'),
('Barco', 'TLD+ 0.8-1.16:1', 'R9801414', 0.8, 1.16, 'Short', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.45, "UST_zoom": true}'),

-- Standard and Long Throw Models
('Barco', 'TLD+ 1.16-1.49:1', 'R9862005', 1.16, 1.49, 'Standard', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.28, "horizontal_shift": "±60%"}'),
('Barco', 'TLD+ 1.25-1.6:1', 'TLD+125-160', 1.25, 1.6, 'Standard', 'Zoom', true, 60, 60, '{"compatibility": "FLM/CLM series"}'),
('Barco', 'TLD+ 1.39-1.87:1', 'R9862010', 1.39, 1.87, 'Standard', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.35}'),
('Barco', 'TLD+ 1.5-2.0:1', 'TLD+150-200', 1.5, 2.0, 'Standard', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.33}'),
('Barco', 'TLD+ 1.87-2.56:1', 'R9862020', 1.87, 2.56, 'Standard', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.37}'),
('Barco', 'TLD+ 2.0-2.8:1', 'TLD+200-280', 2.0, 2.8, 'Standard', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.4}'),
('Barco', 'TLD+ 2.8-4.5:1', 'R9862030', 2.8, 4.5, 'Long', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.61}'),
('Barco', 'TLD+ 4.5-7.5:1', 'R9862040', 4.5, 7.5, 'Long', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.67}'),
('Barco', 'TLD+ 7.5-11.2:1', 'R9829997', 7.5, 11.2, 'Ultra Long', 'Zoom', true, 60, 60, '{"zoom_ratio": 1.49}'),

-- BARCO XLD+ LENS SERIES (XDL, XDX, HDQ, Galaxy, SP4K series)
('Barco', 'XLD 0.38:1 UST 90°', 'XLD-038-UST', 0.38, 0.38, 'UST', 'Fixed', true, 150, 150, '{"special": "90-degree output"}'),
('Barco', 'XLD-HB 0.72:1', 'R9852945', 0.72, 0.72, 'Short', 'Fixed', false, 50, 30, '{"DMD": "1.38 inch"}'),
('Barco', 'XLD-HB 0.75:1', 'XLD-075', 0.75, 1.01, 'Short', 'Fixed', false, 50, 30, '{"throw_ratio_range": "0.75-1.01:1"}'),
('Barco', 'XLD-HB 0.91:1', 'R9852950', 0.91, 0.91, 'Short', 'Fixed', false, 50, 30, '{}'),
('Barco', 'XLD 1.45-1.8:1', 'R9852090', 1.45, 1.8, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.24}'),
('Barco', 'XLD 1.8-2.4:1', 'R9852092', 1.8, 2.4, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.33}'),
('Barco', 'XLD 2.2-3.0:1', 'R9852094', 2.2, 3.0, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.36}'),
('Barco', 'XLD 2.8-5.5:1', 'R9852100', 2.8, 5.5, 'Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.96}'),
('Barco', 'XLD 5.5-8.5:1', 'R9852920', 5.5, 8.5, 'Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.55}'),

-- BARCO FLD+ LENS SERIES (F-series simulation projectors)
('Barco', 'FLD+ 0.28:1 UST', 'R9802232', 0.28, 0.28, 'UST', 'Fixed', true, 100, 100, '{"ultra_short_throw": true}'),
('Barco', 'FLD+ 2.50-4.60:1', 'R9801211', 2.5, 4.6, 'Long', 'Zoom', true, 50, 30, '{"zoom_ratio": 1.84}'),
('Barco', 'FLD 3.8-6.5:1', 'R9801249', 3.8, 6.5, 'Long', 'Zoom', true, 50, 30, '{"zoom_ratio": 1.71}'),

-- BARCO G LENS SERIES (G50, G60, G-series projectors)
('Barco', 'G 0.37-0.4:1 UST 90°', 'G-037-040-UST', 0.37, 0.4, 'UST', 'Fixed', true, 100, 100, '{"special": "90-degree output"}'),
('Barco', 'G 0.65-0.75:1', 'R9802300', 0.65, 0.75, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.15}'),
('Barco', 'G 1.52-2.92:1', 'G-152-292', 1.52, 2.92, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.92}'),

-- CHRISTIE ILS1 LENS SUITE (M 4K RGB Series, Crimson, J Series)
('Christie', 'ILS1 0.37:1 UST', '118-131106-03', 0.37, 0.37, 'UST', 'Fixed', true, 100, 50, '{"intelligent_lens_system": true}'),
('Christie', 'ILS1 0.67:1 UST', 'ILS1-067', 0.67, 0.67, 'UST', 'Fixed', true, 100, 50, '{"intelligent_lens_system": true}'),
('Christie', 'ILS1 1.1:1', 'ILS1-110', 1.1, 1.1, 'Short', 'Fixed', true, 50, 30, '{"intelligent_lens_system": true}'),
('Christie', 'ILS1 1.28-1.87:1 UHC', '163-165103-01', 1.28, 1.87, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.46, "UHC": "Ultra High Contrast"}'),
('Christie', 'ILS1 1.4-1.8:1', 'ILS1-140-180', 1.4, 1.8, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.29, "intelligent_lens_system": true}'),
('Christie', 'ILS1 2.6-4.1:1', '118-100114-04', 2.6, 4.1, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.58, "intelligent_lens_system": true}'),
('Christie', 'ILS1 4.1-6.9:1', '118-100115-01', 4.1, 6.9, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.68, "intelligent_lens_system": true}'),

-- CHRISTIE GRIFFYN SERIES LENSES (4K32-RGB, 4K35-RGB, 4K50-RGB)
-- High Brightness (HB) Lenses
('Christie', 'Griffyn HB 0.72:1', '144-110103-XX', 0.72, 0.72, 'Short', 'Fixed', true, 50, 30, '{"high_brightness": true}'),
('Christie', 'Griffyn HB 0.90:1', '144-111014-XX', 0.90, 0.90, 'Short', 'Fixed', true, 50, 30, '{"high_brightness": true}'),
('Christie', 'Griffyn HB 1.31-1.63:1', '144-104106-01', 1.31, 1.63, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.24, "high_brightness": true}'),
('Christie', 'Griffyn HB 1.99-2.71:1', '144-106108-XX', 1.99, 2.71, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.36, "high_brightness": true}'),
('Christie', 'Griffyn HB 2.71-3.89:1', '144-107109-01', 2.71, 3.89, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.44, "high_brightness": true}'),
('Christie', 'Griffyn HB 3.89-5.43:1', '144-108100-01', 3.89, 5.43, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.40, "high_brightness": true}'),

-- Standard Zoom Lenses
('Christie', 'Griffyn 0.38:1 UST', '144-136101-01', 0.38, 0.38, 'UST', 'Fixed', true, 100, 50, '{"ultra_short_throw": true}'),
('Christie', 'Griffyn 1.13-1.66:1', '144-129103-01', 1.13, 1.66, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.47}'),
('Christie', 'Griffyn 1.95-3.26:1', '144-131106-01', 1.95, 3.26, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.67}'),

-- High Contrast (HC) Lenses
('Christie', 'Griffyn HC 1.13-1.66:1', '163-118101-01', 1.13, 1.66, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.47, "high_contrast": true}'),
('Christie', 'Griffyn HC 1.45-2.17:1', '163-119102-01', 1.45, 2.17, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.50, "high_contrast": true}'),

-- CHRISTIE ROADSTER SERIES LENS OPTIONS
-- HD Roadster Models (HD10K-M, HD14K-M, HD18K, HD20K-J) - 1080p Compatible
('Christie', 'Roadster 0.73:1 UST', '38-809065-51', 0.73, 0.73, 'UST', 'Fixed', false, 50, 30, '{"manual_lens": true}'),
('Christie', 'Roadster 1.2:1', '38-809049-51', 1.2, 1.2, 'Short', 'Fixed', false, 50, 30, '{"manual_lens": true}'),
('Christie', 'Roadster 1.45-1.8:1', '38-809052-51', 1.45, 1.8, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.24, "most_common_rental": true}'),
('Christie', 'Roadster 1.8-2.4:1', '38-809053-51', 1.8, 2.4, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.33}'),
('Christie', 'Roadster 2.2-3.0:1', '38-809054-51', 2.2, 3.0, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.36}'),
('Christie', 'Roadster 3.0-4.3:1', '38-809055-51', 3.0, 4.3, 'Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.43}'),
('Christie', 'Roadster 4.3-6.1:1', '38-809056-51', 4.3, 6.1, 'Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.42}'),
('Christie', 'Roadster 6.1-9.0:1', '38-809057-51', 6.1, 9.0, 'Ultra Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.48}'),

-- Motorized Roadster Options
('Christie', 'Roadster ILS 1.16-1.49:1', '118-100110-01', 1.16, 1.49, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.28, "intelligent_lens_system": true}'),
('Christie', 'Roadster ILS 1.4-1.8:1', '118-100111-01', 1.4, 1.8, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.29, "intelligent_lens_system": true}'),
('Christie', 'Roadster ILS 1.8-2.6:1', '118-100112-01', 1.8, 2.6, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.44, "intelligent_lens_system": true}'),
('Christie', 'Roadster ILS 2.6-4.1:1', '118-100113-01', 2.6, 4.1, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.58, "intelligent_lens_system": true}'),
('Christie', 'Roadster ILS 4.1-6.9:1', '118-100114-04', 4.1, 6.9, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.68, "intelligent_lens_system": true}'),

-- Roadster S+ Models (S+10K-M, S+14K-M, S+20K) - SXGA+ Compatible
('Christie', 'Roadster S+ 0.73:1 UST', '38-809076-51', 0.73, 0.73, 'UST', 'Fixed', false, 50, 30, '{"manual_lens": true, "SXGA_compatible": true}'),
('Christie', 'Roadster S+ 1.2:1', '38-809070-51', 1.2, 1.2, 'Short', 'Fixed', false, 50, 30, '{"manual_lens": true, "SXGA_compatible": true}'),
('Christie', 'Roadster S+ 1.5-2.0:1', '38-809071-51', 1.5, 2.0, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.33, "SXGA_compatible": true}'),
('Christie', 'Roadster S+ 2.0-2.8:1', '38-809072-51', 2.0, 2.8, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.40, "SXGA_compatible": true}'),
('Christie', 'Roadster S+ 2.8-4.5:1', '38-809073-51', 2.8, 4.5, 'Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.61, "SXGA_compatible": true}'),
('Christie', 'Roadster S+ 4.5-7.5:1', '38-809074-51', 4.5, 7.5, 'Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.67, "SXGA_compatible": true}'),
('Christie', 'Roadster S+ 7.5-11.2:1', '38-809075-51', 7.5, 11.2, 'Ultra Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.49, "SXGA_compatible": true}'),

-- Additional S+ Options
('Christie', 'Roadster S+ ILS 1.5-2.0:1', '103-143101-01', 1.5, 2.0, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.33, "intelligent_lens_system": true}'),
('Christie', 'Roadster S+ ILS 2.0-2.8:1', '103-143102-01', 2.0, 2.8, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.40, "intelligent_lens_system": true}'),
('Christie', 'Roadster S+ ILS 2.8-5.0:1', '103-143103-01', 2.8, 5.0, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.79, "intelligent_lens_system": true}'),
('Christie', 'Roadster S+ ILS 5.0-8.0:1', '103-143104-01', 5.0, 8.0, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.60, "intelligent_lens_system": true}'),

-- J-Series Lenses (Roadster/Mirage WU Models) - WUXGA Compatible
('Christie', 'J-Series 0.67:1 UST', '140-102103-01', 0.67, 0.67, 'UST', 'Fixed', true, 100, 50, '{"WUXGA_compatible": true}'),
('Christie', 'J-Series 1.1:1', '140-103104-01', 1.1, 1.1, 'Short', 'Fixed', true, 50, 30, '{"WUXGA_compatible": true}'),
('Christie', 'J-Series 1.16-1.49:1', '140-115117-01', 1.16, 1.49, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.28, "WUXGA_compatible": true}'),
('Christie', 'J-Series 1.4-1.8:1', '140-109111-01', 1.4, 1.8, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.29, "WUXGA_compatible": true}'),
('Christie', 'J-Series 1.8-2.6:1', '140-110112-01', 1.8, 2.6, 'Standard', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.44, "WUXGA_compatible": true}'),
('Christie', 'J-Series 2.6-4.1:1', '140-111113-01', 2.6, 4.1, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.58, "WUXGA_compatible": true}'),
('Christie', 'J-Series 4.1-6.9:1', '140-112114-01', 4.1, 6.9, 'Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.68, "WUXGA_compatible": true}'),
('Christie', 'J-Series 6.9-10.4:1', '140-113115-01', 6.9, 10.4, 'Ultra Long', 'Zoom', true, 60, 40, '{"zoom_ratio": 1.51, "WUXGA_compatible": true}'),

-- PANASONIC LENS DATABASE (Complete ET Series)
-- ET-D3Q Series (for PT-RQ50K Native 4K Projector)
('Panasonic', 'ET-D3QW200', 'ET-D3QW200', 0.548, 0.650, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.19, "native_4K": true}'),
('Panasonic', 'ET-D3QW300', 'ET-D3QW300', 1.11, 1.70, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.53, "native_4K": true}'),
('Panasonic', 'ET-D3QS400', 'ET-D3QS400', 1.43, 2.09, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.46, "native_4K": true}'),
('Panasonic', 'ET-D3QT500', 'ET-D3QT500', 2.00, 3.41, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.71, "native_4K": true}'),
('Panasonic', 'ET-D3QT600', 'ET-D3QT600', 2.69, 3.88, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.44, "native_4K": true}'),
('Panasonic', 'ET-D3QT700', 'ET-D3QT700', 3.89, 5.47, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.41, "native_4K": true}'),
('Panasonic', 'ET-D3QT800', 'ET-D3QT800', 4.97, 7.76, 'Ultra Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.56, "native_4K": true}'),

-- ET-D75LE & ET-D3LE Series (for 3-Chip DLP Laser Projectors)
('Panasonic', 'ET-D75LE95', 'ET-D75LE95', 0.390, 0.390, 'UST', 'Fixed', false, 0, 0, '{"type": "mirror_lens", "legacy": true}'),
('Panasonic', 'ET-D3LEU100', 'ET-D3LEU100', 0.397, 0.397, 'UST', 'Fixed', true, 50, 50, '{"type": "fixed"}'),
('Panasonic', 'ET-D3LEU101', 'ET-D3LEU101', 0.397, 0.397, 'UST', 'Fixed', true, 50, 50, '{"type": "fixed"}'),
('Panasonic', 'ET-D3LEW200', 'ET-D3LEW200', 0.693, 0.913, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.32}'),
('Panasonic', 'ET-D3LEW201', 'ET-D3LEW201', 0.693, 0.913, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.32}'),
('Panasonic', 'ET-D3LEW50', 'ET-D3LEW50', 0.746, 0.746, 'Short', 'Fixed', false, 50, 20, '{}'),
('Panasonic', 'ET-D75LE50', 'ET-D75LE50', 0.746, 0.746, 'Short', 'Fixed', false, 50, 20, '{"legacy": true}'),
('Panasonic', 'ET-D3LEW300', 'ET-D3LEW300', 0.825, 1.00, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.21}'),
('Panasonic', 'ET-D3LEW60', 'ET-D3LEW60', 0.991, 1.18, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.19}'),
('Panasonic', 'ET-D75LE6', 'ET-D75LE6', 0.991, 1.18, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.19, "legacy": true}'),
('Panasonic', 'ET-D3LEW600', 'ET-D3LEW600', 0.993, 1.38, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.39}'),
('Panasonic', 'ET-D3LEW10', 'ET-D3LEW10', 1.35, 1.84, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.36}'),
('Panasonic', 'ET-D75LE10', 'ET-D75LE10', 1.39, 1.79, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.29, "legacy": true}'),
('Panasonic', 'ET-D3LES20', 'ET-D3LES20', 1.79, 2.59, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.45}'),
('Panasonic', 'ET-D75LE20', 'ET-D75LE20', 1.79, 2.59, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.45, "legacy": true}'),
('Panasonic', 'ET-D3LET30', 'ET-D3LET30', 2.57, 5.00, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.95}'),
('Panasonic', 'ET-D75LE30', 'ET-D75LE30', 2.58, 5.00, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.94, "legacy": true}'),
('Panasonic', 'ET-D3LET40', 'ET-D3LET40', 4.94, 7.94, 'Ultra Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.61}'),
('Panasonic', 'ET-D75LE40', 'ET-D75LE40', 4.95, 7.91, 'Ultra Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.60, "legacy": true}'),
('Panasonic', 'ET-D3LET80', 'ET-D3LET80', 7.87, 14.8, 'Ultra Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.88}'),
('Panasonic', 'ET-D75LE8', 'ET-D75LE8', 7.87, 14.8, 'Ultra Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.88, "legacy": true}'),

-- ET-DLE Series (for 1-Chip DLP Projectors)
('Panasonic', 'ET-DLE020', 'ET-DLE020', 0.280, 0.299, 'UST', 'Zoom', true, 50, 50, '{"zoom_ratio": 1.07}'),
('Panasonic', 'ET-DLE020G', 'ET-DLE020G', 0.280, 0.299, 'UST', 'Zoom', true, 50, 50, '{"zoom_ratio": 1.07}'),
('Panasonic', 'ET-DLE035', 'ET-DLE035', 0.380, 0.380, 'UST', 'Fixed', false, 0, 0, '{"type": "mirror_lens"}'),
('Panasonic', 'ET-DLE030', 'ET-DLE030', 0.380, 0.380, 'UST', 'Fixed', false, 0, 0, '{"type": "mirror_lens"}'),
('Panasonic', 'ET-DLE055', 'ET-DLE055', 0.785, 0.785, 'Short', 'Fixed', false, 50, 20, '{}'),
('Panasonic', 'ET-DLE060', 'ET-DLE060', 0.600, 0.801, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.33}'),
('Panasonic', 'ET-DLE085', 'ET-DLE085', 0.782, 0.977, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.25}'),
('Panasonic', 'ET-DLE105', 'ET-DLE105', 0.978, 1.32, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.35}'),
('Panasonic', 'ET-DLE150', 'ET-DLE150', 1.30, 1.89, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.45}'),
('Panasonic', 'ET-DLE170', 'ET-DLE170', 1.71, 2.41, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.41}'),
('Panasonic', 'ET-DLE250', 'ET-DLE250', 2.27, 3.62, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.59}'),
('Panasonic', 'ET-DLE350', 'ET-DLE350', 3.58, 5.45, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.52}'),
('Panasonic', 'ET-DLE450', 'ET-DLE450', 5.36, 8.58, 'Ultra Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.60}'),

-- ET-C1 Series (for Compact 1-Chip DLP)
('Panasonic', 'ET-C1U100', 'ET-C1U100', 0.308, 0.330, 'UST', 'Zoom', true, 50, 23, '{"zoom_ratio": 1.07, "UED_glass": true}'),
('Panasonic', 'ET-C1U200', 'ET-C1U200', 0.380, 0.380, 'UST', 'Fixed', true, 50, 23, '{"UED_glass": true}'),
('Panasonic', 'ET-C1W300', 'ET-C1W300', 0.550, 0.690, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.25, "UED_glass": true}'),
('Panasonic', 'ET-C1W400', 'ET-C1W400', 0.680, 0.950, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.40, "UED_glass": true}'),
('Panasonic', 'ET-C1W500', 'ET-C1W500', 0.940, 1.39, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.48, "UED_glass": true}'),
('Panasonic', 'ET-C1S600', 'ET-C1S600', 1.36, 2.10, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.54, "UED_glass": true}'),
('Panasonic', 'ET-C1T700', 'ET-C1T700', 2.07, 3.38, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.63, "UED_glass": true}'),
('Panasonic', 'ET-C1T800', 'ET-C1T800', 3.30, 6.60, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 2.00, "UED_glass": true}'),

-- ET-EM Series (for PT-MZ LCD Laser Projectors)
('Panasonic', 'ET-EMU100', 'ET-EMU100', 0.330, 0.353, 'UST', 'Zoom', true, 50, 50, '{"zoom_ratio": 1.07, "LCD_laser": true}'),
('Panasonic', 'ET-EMW200', 'ET-EMW200', 0.480, 0.550, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.15, "LCD_laser": true}'),
('Panasonic', 'ET-EMW300', 'ET-EMW300', 0.550, 0.690, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.25, "LCD_laser": true}'),
('Panasonic', 'ET-EMW400', 'ET-EMW400', 0.690, 0.950, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.38, "LCD_laser": true}'),
('Panasonic', 'ET-EMW500', 'ET-EMW500', 0.950, 1.36, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.43, "LCD_laser": true}'),
('Panasonic', 'ET-EMS600', 'ET-EMS600', 1.35, 2.10, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.56, "LCD_laser": true}'),
('Panasonic', 'ET-EMT700', 'ET-EMT700', 2.10, 4.14, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.97, "LCD_laser": true}'),
('Panasonic', 'ET-EMT800', 'ET-EMT800', 4.14, 7.40, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.79, "LCD_laser": true}'),

-- Specialty Lenses
('Panasonic', 'ET-D3LEF70', 'ET-D3LEF70', 0.10, 0.15, 'Fisheye', 'Fixed', false, 0, 0, '{"special": "91.6° max angle fisheye for dome projection"}'),

-- EPSON COMPREHENSIVE LENS DATABASE
-- ELPLX Series - Ultra Short Throw
('Epson', 'ELPLX01', 'V12H004X01', 0.35, 0.35, 'UST', 'Fixed', false, 0, 0, '{"zero_offset": true, "max_lumens": 8500}'),
('Epson', 'ELPLX01S', 'V12H004X0A', 0.35, 0.35, 'UST', 'Fixed', false, 0, 0, '{"zero_offset": true, "camera_mount": true, "max_lumens": 8500}'),
('Epson', 'ELPLX02', 'V12H004X02', 0.35, 0.35, 'UST', 'Fixed', false, 0, 0, '{"zero_offset": true, "max_lumens": 9000}'),
('Epson', 'ELPLX02S', 'V12H004X0B', 0.35, 0.35, 'UST', 'Fixed', false, 0, 0, '{"zero_offset": true, "camera_mount": true, "max_lumens": 20000}'),
('Epson', 'ELPLX03', 'V12H004X03', 0.35, 0.35, 'UST', 'Fixed', false, 0, 0, '{"zero_offset": true, "Pro_L25000_L30000": true}'),

-- ELPLU Series - Short Throw
('Epson', 'ELPLU03', 'V12H004U03', 0.65, 0.78, 'Short', 'Zoom', true, 67, 30, '{"zoom_ratio": 1.20, "discontinued": true}'),
('Epson', 'ELPLU03S', 'V12H004UA3', 0.65, 0.78, 'Short', 'Zoom', true, 67, 30, '{"zoom_ratio": 1.20, "max_lumens": 20000}'),
('Epson', 'ELPLU04', 'V12H004U04', 0.87, 1.05, 'Short', 'Zoom', true, 67, 30, '{"zoom_ratio": 1.21, "max_lumens": 20000}'),
('Epson', 'ELPLU05', 'V12H004U05', 0.91, 1.09, 'Short', 'Zoom', true, 67, 30, '{"zoom_ratio": 1.20, "Pro_L25000": true}'),

-- ELPLW Series - Wide Throw
('Epson', 'ELPLW05', 'V12H004W05', 1.04, 1.46, 'Standard', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.40, "max_lumens": 13000}'),
('Epson', 'ELPLW06', 'V12H004W06', 1.62, 2.22, 'Standard', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.37, "max_lumens": 15000}'),
('Epson', 'ELPLW07', 'V12H004W07', 1.18, 1.66, 'Standard', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.41, "Pro_L25000": true}'),
('Epson', 'ELPLW08', 'V12H004W08', 1.18, 1.66, 'Standard', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.41, "max_lumens": 20000}'),

-- ELPLM Series - Middle Throw
('Epson', 'ELPLM08', 'V12H004M08', 1.42, 2.28, 'Standard', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.61, "max_lumens": 8500}'),
('Epson', 'ELPLM09', 'V12H004M09', 2.16, 3.49, 'Long', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.62, "max_lumens": 12000}'),
('Epson', 'ELPLM10', 'V12H004M0A', 1.74, 2.35, 'Standard', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.35, "Pro_L25000": true}'),
('Epson', 'ELPLM11', 'V12H004M0B', 4.85, 7.38, 'Long', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.52, "max_lumens": 20000}'),
('Epson', 'ELPLM12', 'V12H004M0C', 1.74, 2.35, 'Standard', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.35, "Pro_L25000": true}'),
('Epson', 'ELPLM13', 'V12H004M0D', 2.30, 3.46, 'Long', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.50, "Pro_L25000": true}'),
('Epson', 'ELPLM14', 'V12H004M0E', 3.41, 5.11, 'Long', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.50, "Pro_L25000": true}'),
('Epson', 'ELPLM15', 'V12H004M0F', 2.16, 3.48, 'Long', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.61, "newer_Pro_series": true}'),

-- ELPLL Series - Long Throw
('Epson', 'ELPLL08', 'V12H004L08', 7.21, 10.11, 'Ultra Long', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.40, "max_lumens": 20000}'),
('Epson', 'ELPLL09', 'V12H004L09', 7.5, 11.0, 'Ultra Long', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.47, "Pro_L25000": true}'),
('Epson', 'ELPLL10', 'V12H004L0A', 8.0, 12.0, 'Ultra Long', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.50, "Pro_L25000": true}'),

-- ELPLR Series - Rear Projection
('Epson', 'ELPLR04', 'V12H004R04', 1.19, 1.19, 'Rear', 'Fixed', false, 0, 0, '{"discontinued": true}'),
('Epson', 'ELPLR05', 'V12H004R05', 1.3, 2.0, 'Rear', 'Zoom', true, 60, 18, '{"zoom_ratio": 1.54, "Pro_L25000": true}'),

-- SONY COMPREHENSIVE LENS DATABASE
-- Ultra Short Throw Fixed
('Sony', 'VPLL-3003', 'VPLL-3003', 0.33, 0.33, 'UST', 'Fixed', false, 0, 0, '{"VPL_FHZ_series": true}'),
('Sony', 'VPLL-3007', 'VPLL-3007', 0.65, 0.65, 'Short', 'Fixed', false, 50, 31, '{"VPL_FHZ_series": true}'),
('Sony', 'VPLL-4008', 'VPLL-4008', 1.0, 1.0, 'Short', 'Fixed', false, 50, 31, '{"rear_projection": true}'),

-- Short-Throw Zoom
('Sony', 'VPLL-Z4107', 'VPLL-Z4107', 0.75, 0.94, 'Short', 'Zoom', true, 50, 35, '{"zoom_ratio": 1.25, "VPL_F_series": true}'),
('Sony', 'VPLL-Z3009', 'VPLL-Z3009', 0.85, 1.0, 'Short', 'Zoom', true, 70, 35, '{"zoom_ratio": 1.18}'),

-- Standard Zoom
('Sony', 'VPLL-Z3010', 'VPLL-Z3010', 1.0, 1.39, 'Standard', 'Zoom', true, 70, 35, '{"zoom_ratio": 1.39, "VPL_F_series": true}'),
('Sony', 'VPLL-Z4011', 'VPLL-Z4011', 1.38, 2.06, 'Standard', 'Zoom', true, 110, 57, '{"zoom_ratio": 1.49, "VPL_F_series": true}'),
('Sony', 'VPLL-Z4015', 'VPLL-Z4015', 1.85, 2.44, 'Standard', 'Zoom', true, 98, 51, '{"zoom_ratio": 1.32, "VPL_F_series": true}'),

-- Long Throw Zoom
('Sony', 'VPLL-Z3024', 'VPLL-Z3024', 2.34, 3.19, 'Long', 'Zoom', true, 60, 32, '{"zoom_ratio": 1.36, "VPL_F_series": true}'),
('Sony', 'VPLL-Z4025', 'VPLL-Z4025', 3.5, 5.5, 'Long', 'Zoom', true, 70, 35, '{"zoom_ratio": 1.57, "VPL_F_series": true}'),
('Sony', 'VPLL-Z4045', 'VPLL-Z4045', 5.0, 8.0, 'Ultra Long', 'Zoom', true, 70, 35, '{"zoom_ratio": 1.60}'),

-- VPL-FHZ Installation Series
('Sony', 'VPLL-Z4111', 'VPLL-Z4111', 1.30, 1.96, 'Standard', 'Zoom', true, 70, 35, '{"zoom_ratio": 1.51, "VPL_FHZ120_FHZ90": true}'),

-- VPL-GTZ Series (4K SXRD Laser)
('Sony', 'VPLL-Z8014', 'VPLL-Z8014', 1.40, 2.73, 'Standard', 'Zoom', true, 80, 31, '{"zoom_ratio": 1.95, "VPL_GTZ380": true, "ARC_F_technology": true}'),
('Sony', 'VPLL-Z8008', 'VPLL-Z8008', 0.80, 1.02, 'Short', 'Zoom', true, 50, 18, '{"zoom_ratio": 1.28, "VPL_GTZ380": true, "ARC_F_technology": true}'),

-- NEC/SHARP COMPREHENSIVE LENS DATABASE
-- Fixed Lenses
('NEC/Sharp', 'NP11FL', 'NP11FL', 0.8, 0.8, 'Short', 'Fixed', false, 0, 0, '{}'),
('NEC/Sharp', 'NP39ML', 'NP39ML', 0.38, 0.38, 'UST', 'Fixed', false, 0, 0, '{}'),
('NEC/Sharp', 'NP44ML', 'NP44ML', 0.32, 0.32, 'UST', 'Fixed', false, 0, 0, '{}'),

-- Zoom Lenses
('NEC/Sharp', 'NP12ZL', 'NP12ZL', 1.19, 1.56, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.31}'),
('NEC/Sharp', 'NP13ZL', 'NP13ZL', 1.5, 3.0, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 2.0}'),
('NEC/Sharp', 'NP14ZL', 'NP14ZL', 2.97, 4.79, 'Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.61}'),
('NEC/Sharp', 'NP15ZL', 'NP15ZL', 4.70, 7.02, 'Ultra Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.49}'),
('NEC/Sharp', 'NP18ZL', 'NP18ZL', 1.73, 2.27, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.31, "PX_series": true}'),
('NEC/Sharp', 'NP30ZL', 'NP30ZL', 0.79, 1.04, 'Short', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.32}'),
('NEC/Sharp', 'NP40ZL', 'NP40ZL', 0.79, 1.14, 'Short', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.44}'),
('NEC/Sharp', 'NP41ZL', 'NP41ZL', 1.30, 3.08, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 2.37}'),
('NEC/Sharp', 'NP43ZL', 'NP43ZL', 3.0, 6.0, 'Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 2.0}'),

-- 4K PX Series Lenses (PX1005QL)
('NEC/Sharp', 'NP16FL-4K', 'NP16FL-4K', 0.6, 0.6, 'Short', 'Fixed', false, 50, 20, '{"4K_compatible": true}'),
('NEC/Sharp', 'NP17ZL-4K', 'NP17ZL-4K', 0.8, 1.2, 'Short', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.5, "4K_compatible": true}'),
('NEC/Sharp', 'NP18ZL-4K', 'NP18ZL-4K', 1.71, 2.25, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.32, "4K_compatible": true}'),
('NEC/Sharp', 'NP19ZL-4K', 'NP19ZL-4K', 2.2, 3.5, 'Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.59, "4K_compatible": true}'),
('NEC/Sharp', 'NP20ZL-4K', 'NP20ZL-4K', 3.4, 5.4, 'Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.59, "4K_compatible": true}'),
('NEC/Sharp', 'NP21ZL-4K', 'NP21ZL-4K', 5.3, 8.5, 'Ultra Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.60, "4K_compatible": true}'),
('NEC/Sharp', 'NP31ZL-4K', 'NP31ZL-4K', 0.79, 1.04, 'Short', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.32, "4K_compatible": true}'),
('NEC/Sharp', 'NP39ML-4K', 'NP39ML-4K', 0.38, 0.38, 'UST', 'Fixed', false, 0, 0, '{"4K_compatible": true}'),

-- High-Brightness PX Series (PX2000UL, PX2201UL)
('NEC/Sharp', 'NP45ZL', 'NP45ZL', 0.8, 1.2, 'Short', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.5, "high_brightness": true}'),
('NEC/Sharp', 'NP46ZL', 'NP46ZL', 1.2, 1.56, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.30, "high_brightness": true}'),
('NEC/Sharp', 'NP47ZL', 'NP47ZL', 1.5, 2.4, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.60, "high_brightness": true}'),
('NEC/Sharp', 'NP48ZL', 'NP48ZL', 2.0, 4.0, 'Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 2.0, "high_brightness": true}'),
('NEC/Sharp', 'NP49ZL', 'NP49ZL', 3.8, 7.6, 'Ultra Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 2.0, "high_brightness": true}'),

-- PA1500/1700 Series Lenses
('NEC/Sharp', 'NP52ZL', 'NP52ZL', 0.8, 1.1, 'Short', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.38, "PA_series": true}'),
('NEC/Sharp', 'NP53ZL', 'NP53ZL', 0.86, 1.25, 'Short', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.45, "PA_series": true}'),
('NEC/Sharp', 'NP54ZL', 'NP54ZL', 1.24, 2.01, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.62, "PA_series": true}'),
('NEC/Sharp', 'NP55ZL', 'NP55ZL', 1.9, 3.8, 'Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 2.0, "PA_series": true}'),
('NEC/Sharp', 'NP56ZL', 'NP56ZL', 3.7, 7.0, 'Ultra Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.89, "PA_series": true}'),

-- NC Series Cinema Lenses (NC2043ML)
('NEC/Sharp', 'NC-60LS12Z', 'NC-60LS12Z', 1.2, 1.81, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.51, "cinema": true}'),
('NEC/Sharp', 'NC-60LS14Z', 'NC-60LS14Z', 1.4, 2.05, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.46, "cinema": true}'),
('NEC/Sharp', 'NC-60LS16Z', 'NC-60LS16Z', 1.59, 2.53, 'Standard', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.59, "cinema": true}'),
('NEC/Sharp', 'NC-60LS19Z', 'NC-60LS19Z', 1.9, 3.25, 'Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.71, "cinema": true}'),
('NEC/Sharp', 'NC-60LS24Z', 'NC-60LS24Z', 2.4, 3.9, 'Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.63, "cinema": true}'),
('NEC/Sharp', 'NC-60LS39Z', 'NC-60LS39Z', 3.9, 6.52, 'Ultra Long', 'Zoom', true, 50, 20, '{"zoom_ratio": 1.67, "cinema": true}'),

-- DIGITAL PROJECTION COMPREHENSIVE LENS DATABASE
-- INSIGHT Series (4K/8K)
('Digital Projection', 'INSIGHT 1.13-1.66:1', '116-044', 1.13, 1.66, 'Standard', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.47, "INSIGHT_series": true}'),
('Digital Projection', 'INSIGHT 1.3-1.85:1', '116-045', 1.30, 1.85, 'Standard', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.42, "INSIGHT_series": true}'),
('Digital Projection', 'INSIGHT 1.45-2.17:1', '116-046', 1.45, 2.17, 'Standard', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.50, "INSIGHT_series": true}'),
('Digital Projection', 'INSIGHT 1.63-2.71:1', '116-047', 1.63, 2.71, 'Long', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.66, "INSIGHT_series": true}'),
('Digital Projection', 'INSIGHT 1.95-3.26:1', '116-048', 1.95, 3.26, 'Long', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.67, "INSIGHT_series": true}'),

-- E-Vision Series
('Digital Projection', 'E-Vision UST 0.38:1', '117-341', 0.38, 0.38, 'UST', 'Fixed', false, 0, 0, '{"E_Vision_series": true}'),
('Digital Projection', 'E-Vision 0.75-0.93:1', '117-342', 0.75, 0.93, 'Short', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.24, "curved_screen_focus": true}'),
('Digital Projection', 'E-Vision 1.54-1.93:1', '117-343', 1.54, 1.93, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.25, "manual_focus_zoom": true}'),

-- M-Vision Series
('Digital Projection', 'M-Vision 1.2-2.0:1', 'M-120-200', 1.2, 2.0, 'Standard', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.67, "M_Vision_series": true}'),
('Digital Projection', 'M-Vision 2.0-3.5:1', 'M-200-350', 2.0, 3.5, 'Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.75, "M_Vision_series": true}'),
('Digital Projection', 'M-Vision 3.5-6.0:1', 'M-350-600', 3.5, 6.0, 'Long', 'Zoom', false, 50, 30, '{"zoom_ratio": 1.71, "M_Vision_series": true}'),

-- TITAN Series
('Digital Projection', 'TITAN 2.0x Zoom', '120-627', 1.4, 2.8, 'Standard', 'Zoom', true, 120, 70, '{"zoom_ratio": 2.0, "powered_lens": true, "TITAN_series": true}'),

-- HIGHlite Series
('Digital Projection', 'HIGHlite UST 0.77:1', 'HL-077', 0.77, 0.77, 'Short', 'Fixed', true, 50, 30, '{"HIGHlite_series": true}'),
('Digital Projection', 'HIGHlite 1.16:1', 'HL-116', 1.16, 1.16, 'Standard', 'Fixed', true, 50, 30, '{"HIGHlite_series": true}'),
('Digital Projection', 'HIGHlite 1.45-1.74:1', 'HL-145-174', 1.45, 1.74, 'Standard', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.20, "HIGHlite_series": true}'),
('Digital Projection', 'HIGHlite 1.74-2.17:1', 'HL-174-217', 1.74, 2.17, 'Standard', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.25, "HIGHlite_series": true}'),
('Digital Projection', 'HIGHlite 2.17-2.90:1', 'HL-217-290', 2.17, 2.90, 'Long', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.34, "HIGHlite_series": true}'),
('Digital Projection', 'HIGHlite 2.90-4.34:1', 'HL-290-434', 2.90, 4.34, 'Long', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.50, "HIGHlite_series": true}'),
('Digital Projection', 'HIGHlite 4.34-6.76:1', 'HL-434-676', 4.34, 6.76, 'Ultra Long', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.56, "HIGHlite_series": true}'),

-- SECONDARY PROFESSIONAL BRANDS
-- BenQ LU/LH/LX Series
('BenQ', 'UST 0.8:1', 'PX9210-UST', 0.8, 0.8, 'UST', 'Fixed', false, 50, 30, '{"PX9210_compatible": true}'),
('BenQ', 'UST 0.77:1', 'PU9220-UST', 0.77, 0.77, 'UST', 'Fixed', false, 50, 30, '{"PU9220_compatible": true}'),
('BenQ', 'Short Zoom 1.14-1.34:1', 'LS2ST1', 1.14, 1.34, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.18}'),
('BenQ', 'Standard 2.0-3.0:1', 'LS2ST2', 2.0, 3.0, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.5}'),
('BenQ', 'Long Throw 3.11-5.18:1', 'LS2LT1', 3.11, 5.18, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.67}'),
('BenQ', 'Wide Zoom', 'LS2LS1', 1.2, 2.0, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.67, "multiple_models": true}'),

-- Optoma ZU Series
('Optoma', 'UST 0.36:1', 'BX-CTA16', 0.36, 0.36, 'UST', 'Fixed', true, 100, 50, '{"ZU_series": true}'),
('Optoma', 'Short 0.65-0.75:1', 'BX-CTA17', 0.65, 0.75, 'Short', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.15, "motorized": true}'),
('Optoma', 'Standard 1.5-2.5:1', 'BX-CTA18', 1.5, 2.5, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.67, "motorized": true}'),
('Optoma', 'Long 4.85-8.66:1', 'Navitar 578MCZ500', 4.85, 8.66, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.79}'),
('Optoma', 'Ultra Long 9.15-15.24:1', 'Navitar 578MCZ087', 9.15, 15.24, 'Ultra Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.67}'),
('Optoma', 'Dome 360°', 'BX-CTADOME', 0.1, 0.2, 'Fisheye', 'Fixed', false, 0, 0, '{"special": "360-degree dome projection"}'),

-- Canon REALiS/XEED Series
('Canon', 'Standard Zoom 1.34-2.35:1', 'RS-SL07RST', 1.34, 2.35, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.75, "4K_optimized": true}'),
('Canon', 'Standard Zoom 1.49-2.24:1', 'RS-SL08ST', 1.49, 2.24, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.50}'),
('Canon', 'Long Zoom 2.19-3.74:1', 'RS-SL09LZ', 2.19, 3.74, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.71}'),
('Canon', 'Wide Fixed 0.8:1', 'RS-SL10WF', 0.8, 0.8, 'Short', 'Fixed', false, 50, 30, '{}'),
('Canon', 'Ultra-Long Zoom 3.55-6.94:1', 'RS-SL11ULZ', 3.55, 6.94, 'Ultra Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.95}'),
('Canon', 'Wide-Zoom 1.0-1.5:1', 'RS-SL12WZ', 1.0, 1.5, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.5}'),
('Canon', 'Ultra-Wide Fixed 0.54:1', 'RS-SL13UWF', 0.54, 0.54, 'Short', 'Fixed', false, 50, 30, '{}'),

-- JVC DLA Series Professional
('JVC', '8K Zoom', 'GL-MS8016SZ', 1.4, 2.8, 'Standard', 'Zoom', true, 80, 34, '{"zoom_ratio": 2.0, "8K_resolution": true}'),
('JVC', 'Standard Zoom', 'GL-MS4015SZG', 1.5, 2.4, 'Standard', 'Zoom', true, 80, 34, '{"zoom_ratio": 1.6}'),
('JVC', 'Short Distance Zoom', 'GL-MS4016SZG', 0.8, 1.25, 'Short', 'Zoom', true, 80, 34, '{"zoom_ratio": 1.56}'),
('JVC', 'Short Distance Fixed', 'GL-MS4011SG', 1.0, 1.0, 'Standard', 'Fixed', false, 50, 30, '{}'),
('JVC', 'Standard Zoom', 'GL-MZ4014SZW', 1.27, 2.54, 'Standard', 'Zoom', true, 80, 34, '{"zoom_ratio": 2.0}'),
('JVC', 'Short Throw Zoom', 'GL-MZ4009SZW', 0.94, 1.30, 'Short', 'Zoom', true, 80, 34, '{"zoom_ratio": 1.38}'),
('JVC', 'Fixed Focal 0.99:1', 'VSL2010', 0.99, 0.99, 'Standard', 'Fixed', false, 50, 30, '{}'),
('JVC', 'Fixed Focal 1.18:1', 'VSL2012', 1.18, 1.18, 'Standard', 'Fixed', false, 50, 30, '{}'),

-- Vivitek DU/DX/DW Series
('Vivitek', 'Standard Zoom 1.72-2.27:1', 'D88-ST001', 1.72, 2.27, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.32}'),
('Vivitek', 'Fixed Wide 0.76:1', '3797745100-SVK', 0.76, 0.76, 'Short', 'Fixed', false, 50, 30, '{}'),
('Vivitek', 'Long Zoom 2.22-3.67:1', 'D88-LOZ101', 2.22, 3.67, 'Long', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.65}'),
('Vivitek', 'Ultra Short Zoom', 'D88-UWZ01', 0.4, 0.6, 'UST', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.5}'),
('Vivitek', 'Wide Throw DU9000', 'D98-1215', 1.2, 1.8, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.5, "DU9000_compatible": true}'),
('Vivitek', 'Wide Zoom 1.25-1.60:1', '5811122743-SVV', 1.25, 1.60, 'Standard', 'Zoom', true, 60, 30, '{"zoom_ratio": 1.28}'),
('Digital Projection', 'Long 2.90-4.34:1', '116-049', 2.9, 4.34, 'Long', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.5}'),
('Digital Projection', 'Ultra Long 4.34-6.76:1', '116-050', 4.34, 6.76, 'Ultra Long', 'Zoom', true, 120, 70, '{"zoom_ratio": 1.56}');

-- Create compatibility matrix
-- This is a simplified version - in reality, you'd need to verify each combination
-- For now, we'll create sensible defaults based on lens mount systems

-- Barco projectors with TLD+ lenses (only TLD+ lenses, not G or XLD lenses)
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native TLD+ compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'TLD+' AND l.manufacturer = 'Barco' AND l.model LIKE 'TLD+%';

-- Barco projectors with G lenses (legacy mount system)
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native G lens compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'G' AND l.manufacturer = 'Barco' AND l.model LIKE 'G %';

-- Barco GLD series projectors (G100 series)
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native G/GLD compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'GLD' AND l.manufacturer = 'Barco' AND l.model LIKE 'G %';

-- Barco projectors with XLD+ lenses (fixed pattern matching)
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native XLD+ compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'XLD+' AND l.manufacturer = 'Barco' AND l.model LIKE 'XLD%';

-- Christie projectors with ILS lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ILS compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'ILS' AND l.manufacturer = 'Christie';

-- Christie Roadster manual lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Roadster manual lens compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'Manual'
  AND p.manufacturer = 'Christie'
  AND p.series LIKE 'Roadster%'
  AND l.manufacturer = 'Christie'
  AND (l.model LIKE 'Roadster %' OR (l.optical_features->>'manual_lens')::boolean IS TRUE);

-- Panasonic projectors with ET lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ET-D75LE compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'ET-D75LE' AND l.manufacturer = 'Panasonic' AND l.model LIKE 'ET-D75LE%';

INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ET-D3Q compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'ET-D3Q' AND l.manufacturer = 'Panasonic' AND l.model LIKE 'ET-D3%';

-- Panasonic projectors with ET-D3LE lenses (missing mapping added)
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ET-D3LE compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'ET-D3LE' AND l.manufacturer = 'Panasonic' AND l.model LIKE 'ET-D3LE%';

-- Epson projectors with ELPL lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native ELPL compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'ELPL' AND l.manufacturer = 'Epson';

-- Sony projectors with VPLL lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native VPLL compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'VPLL' AND l.manufacturer = 'Sony';

-- NEC/Sharp projectors with NP lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native NP compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'NP' AND l.manufacturer = 'NEC/Sharp';

-- Digital Projection compatibility
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.manufacturer = 'Digital Projection' AND l.manufacturer = 'Digital Projection';

-- BenQ projectors with BenQ lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native BenQ compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.manufacturer = 'BenQ' AND l.manufacturer = 'BenQ';

-- Optoma projectors with Optoma lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native Optoma compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.manufacturer = 'Optoma' AND l.manufacturer = 'Optoma';

-- Canon projectors with Canon lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native Canon compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.manufacturer = 'Canon' AND l.manufacturer = 'Canon';

-- JVC projectors with JVC lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native JVC compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.manufacturer = 'JVC' AND l.manufacturer = 'JVC';

-- Vivitek projectors with Vivitek lenses
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'Native Vivitek compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.manufacturer = 'Vivitek' AND l.manufacturer = 'Vivitek';

-- Cross-compatibility: Some standard mount systems
-- Panasonic ET-DLE series with older Panasonic projectors
INSERT INTO projector_lens_compatibility (projector_id, lens_id, compatibility_notes)
SELECT p.id, l.id, 'ET-DLE backward compatibility'
FROM projector_database p
CROSS JOIN lens_database l
WHERE p.lens_mount_system = 'ET-DLE' AND l.manufacturer = 'Panasonic' AND l.model LIKE 'ET-DLE%';

-- Removed dangerous universal DLP cross-brand compatibility rule
-- This was causing wrong lens recommendations across different manufacturers