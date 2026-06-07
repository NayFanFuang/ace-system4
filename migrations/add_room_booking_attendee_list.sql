-- Link meeting attendees from the Employees directory.
-- Stores a JSON array of {"code": <employee_code>, "name": <full_name>}.
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS attendee_list JSON;
