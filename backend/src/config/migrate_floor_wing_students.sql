-- Floor / wing on rooms & students + wardens view
-- Run against existing DB (MySQL 5.7+ / 8.0+). If a statement fails because the column exists, skip that line.

USE hostel_mgmt;

-- Wing per room (nullable until populated)
ALTER TABLE rooms
  ADD COLUMN wing ENUM('left','right') NULL DEFAULT NULL AFTER floor;

-- Student floor/wing (nullable; floor backfilled from room)
ALTER TABLE students
  ADD COLUMN floor TINYINT NULL DEFAULT NULL AFTER room_id,
  ADD COLUMN wing ENUM('left','right') NULL DEFAULT NULL AFTER floor;

UPDATE students s
INNER JOIN rooms r ON s.room_id = r.id
SET s.floor = r.floor
WHERE s.floor IS NULL;

UPDATE students s
INNER JOIN rooms r ON s.room_id = r.id
SET s.wing = r.wing
WHERE s.wing IS NULL AND r.wing IS NOT NULL;

-- View over warden users (no duplicate physical table)
DROP VIEW IF EXISTS wardens;
CREATE VIEW wardens AS
  SELECT id, name, email
  FROM users
  WHERE role = 'warden';
