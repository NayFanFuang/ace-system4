-- Track when an employee taps "Share" on the clock summary (intent to send to LINE).
-- Used as the auto signal for the "Send to Line" daily-compliance check.
ALTER TABLE clock_sessions ADD COLUMN IF NOT EXISTS shared_at timestamptz;
