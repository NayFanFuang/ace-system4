-- Optional room photo for the meeting-room catalog (served from /photos/meeting_rooms/).
ALTER TABLE meeting_rooms ADD COLUMN IF NOT EXISTS image_url VARCHAR(300);
