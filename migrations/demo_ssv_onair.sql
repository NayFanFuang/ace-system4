-- Demo: spread project_sites.full_on_air across 14-day window
-- Today = 2026-05-20, window = 2026-05-10 (Day -10, Pos 1) to 2026-05-23 (Day +3, Pos 14)
-- Today is Pos 11 (the 11th of 14 bars).

UPDATE project_sites SET full_on_air = NULL WHERE full_on_air BETWEEN '2026-05-10' AND '2026-05-23';

-- Spread sites across the window with a peak around today
-- Day -10 (May 10): 2 sites
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 2)
UPDATE project_sites SET full_on_air='2026-05-10' FROM ids WHERE project_sites.id=ids.id;

-- Day -9 (May 11): 3
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 3)
UPDATE project_sites SET full_on_air='2026-05-11' FROM ids WHERE project_sites.id=ids.id;

-- Day -8 (May 12): 5
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 5)
UPDATE project_sites SET full_on_air='2026-05-12' FROM ids WHERE project_sites.id=ids.id;

-- Day -7 (May 13): 4
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 4)
UPDATE project_sites SET full_on_air='2026-05-13' FROM ids WHERE project_sites.id=ids.id;

-- Day -6 (May 14): 6
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 6)
UPDATE project_sites SET full_on_air='2026-05-14' FROM ids WHERE project_sites.id=ids.id;

-- Day -5 (May 15): 8
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 8)
UPDATE project_sites SET full_on_air='2026-05-15' FROM ids WHERE project_sites.id=ids.id;

-- Day -4 (May 16): 7
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 7)
UPDATE project_sites SET full_on_air='2026-05-16' FROM ids WHERE project_sites.id=ids.id;

-- Day -3 (May 17): 10
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 10)
UPDATE project_sites SET full_on_air='2026-05-17' FROM ids WHERE project_sites.id=ids.id;

-- Day -2 (May 18): 12
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 12)
UPDATE project_sites SET full_on_air='2026-05-18' FROM ids WHERE project_sites.id=ids.id;

-- Day -1 (May 19): 14
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 14)
UPDATE project_sites SET full_on_air='2026-05-19' FROM ids WHERE project_sites.id=ids.id;

-- Day 0 (May 20 TODAY, Pos 11): 18 sites (peak)
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 18)
UPDATE project_sites SET full_on_air='2026-05-20' FROM ids WHERE project_sites.id=ids.id;

-- Day +1 (May 21): 11
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 11)
UPDATE project_sites SET full_on_air='2026-05-21' FROM ids WHERE project_sites.id=ids.id;

-- Day +2 (May 22): 7
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 7)
UPDATE project_sites SET full_on_air='2026-05-22' FROM ids WHERE project_sites.id=ids.id;

-- Day +3 (May 23): 4
WITH ids AS (SELECT id FROM project_sites WHERE full_on_air IS NULL ORDER BY id LIMIT 4)
UPDATE project_sites SET full_on_air='2026-05-23' FROM ids WHERE project_sites.id=ids.id;

SELECT full_on_air, COUNT(*) FROM project_sites
WHERE full_on_air BETWEEN '2026-05-10' AND '2026-05-23'
GROUP BY 1 ORDER BY 1;
