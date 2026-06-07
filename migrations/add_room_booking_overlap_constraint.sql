-- DB-level guard against double-booking (race-condition safe).
-- A generated int4range of [start_minute, end_minute) per booking, plus a GiST
-- exclusion constraint so two ACTIVE bookings on the same room/date cannot overlap.
-- int4range is half-open [) so adjacent meetings (10:00–11:00 / 11:00–12:00) are OK.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS time_range int4range
  GENERATED ALWAYS AS (
    int4range(
      split_part(start_time, ':', 1)::int * 60 + split_part(start_time, ':', 2)::int,
      split_part(end_time,   ':', 1)::int * 60 + split_part(end_time,   ':', 2)::int
    )
  ) STORED;

ALTER TABLE room_bookings DROP CONSTRAINT IF EXISTS no_room_overlap;
ALTER TABLE room_bookings ADD CONSTRAINT no_room_overlap
  EXCLUDE USING gist (room_id WITH =, booking_date WITH =, time_range WITH &&)
  WHERE (status = 'ACTIVE');
