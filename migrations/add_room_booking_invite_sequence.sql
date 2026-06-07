-- iCalendar SEQUENCE counter — bumped on every edit/cancel so Outlook treats
-- a re-sent invite (same UID) as an update rather than a duplicate.
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS invite_sequence INTEGER NOT NULL DEFAULT 0;
