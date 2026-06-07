-- Freeze the "on-site?" geofence reference at clock-in time so moving an office/site
-- later does not rewrite historical compliance. NULL on legacy rows → today-map falls
-- back to live computation (no behaviour change for existing data).
ALTER TABLE clock_sessions ADD COLUMN IF NOT EXISTS geofence_source   varchar(10);
ALTER TABLE clock_sessions ADD COLUMN IF NOT EXISTS geofence_lat      double precision;
ALTER TABLE clock_sessions ADD COLUMN IF NOT EXISTS geofence_lng      double precision;
ALTER TABLE clock_sessions ADD COLUMN IF NOT EXISTS geofence_radius_m integer;
ALTER TABLE clock_sessions ADD COLUMN IF NOT EXISTS distance_in_m     double precision;
ALTER TABLE clock_sessions ADD COLUMN IF NOT EXISTS on_site_in        boolean;
