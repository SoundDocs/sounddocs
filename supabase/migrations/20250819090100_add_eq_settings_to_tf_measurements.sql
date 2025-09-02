alter table tf_measurements
add column if not exists eq_settings jsonb;
