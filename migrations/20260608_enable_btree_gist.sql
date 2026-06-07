-- Required by room_bookings.no_room_overlap ExcludeConstraint (GiST on int4range
-- + scalar equality on room_id/booking_date). Without btree_gist the table DDL
-- emitted by Base.metadata.create_all fails and the backend cannot boot.
CREATE EXTENSION IF NOT EXISTS btree_gist;
