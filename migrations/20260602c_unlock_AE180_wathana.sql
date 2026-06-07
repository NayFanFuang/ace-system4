-- Unlock AE180 (Wathana Lamoon) — login is stuck in rate_limited loop.
--
-- Background: she failed 2 password attempts at 10:42, which tripped the
-- 5-failure / 15-min rate limit. Every subsequent attempt logged as
-- 'rate_limited' (success=false), which itself counts toward the same window,
-- so the lockout self-perpetuates. /api/auth/send-welcome at 10:47 reset her
-- password to ACE1234 but did NOT clear auth_login_logs, so she stays blocked.
--
-- This migration:
--   1) Deletes her failed login attempts from the last 30 minutes (clears rate limit)
--   2) Resets password to ACE1234 with bcrypt hash from app's hasher
--   3) Sets must_change_password=true (forces change on first login)
--   4) Clears failed_login_count, locked_until, bumps token_version

-- 1) Wipe recent failed attempts so _is_rate_limited counts 0
DELETE FROM auth_login_logs
WHERE identifier = 'wattana@airconnect-e.com'
  AND success = false
  AND created_at >= NOW() - INTERVAL '30 minutes';

-- 2-4) Reset auth_user state
UPDATE auth_users
SET password_hash         = '$2b$12$OaIkBB9lPf05n1gXHIIWQ.o2HSxDGCEVNrGBFQILfmKBM1QzKUY82', -- bcrypt of 'ACE1234'
    must_change_password  = true,
    password_changed_at   = NOW(),
    token_version         = token_version + 1,
    failed_login_count    = 0,
    locked_until          = NULL
WHERE employee_code = 'AE180';

-- Sanity check
SELECT employee_code, email, must_change_password, failed_login_count,
       locked_until, token_version, password_changed_at
FROM auth_users WHERE employee_code = 'AE180';

SELECT 'recent_failures' AS metric, COUNT(*) AS n
FROM auth_login_logs
WHERE identifier = 'wattana@airconnect-e.com'
  AND success = false
  AND created_at >= NOW() - INTERVAL '15 minutes';
