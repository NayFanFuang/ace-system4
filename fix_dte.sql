-- Move Drive Test Analysis Engineer (and TL variant) back to office DAILY
UPDATE auth_users SET
  work_lat           = 13.759246791410696,
  work_lng           = 100.56849680127857,
  work_location_name = 'ACE Head Office',
  allowed_radius_m   = 300,
  clock_type         = 'DAILY',
  gps_required       = false,
  photo_required     = false
WHERE position_name ILIKE 'Drive Test Analysis%';

-- Keep only exact "Drive Test Engineer" as PER_SITE
UPDATE auth_users SET
  clock_type         = 'PER_SITE',
  gps_required       = true,
  photo_required     = true,
  work_lat           = NULL,
  work_lng           = NULL,
  work_location_name = NULL
WHERE position_name = 'Drive Test Engineer';

-- Summary
SELECT position_name, clock_type, gps_required, COUNT(*) as cnt
FROM auth_users
WHERE position_name ILIKE '%Drive Test%'
GROUP BY position_name, clock_type, gps_required
ORDER BY position_name;
