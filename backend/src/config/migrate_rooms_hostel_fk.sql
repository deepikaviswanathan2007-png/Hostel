-- Add hostel_id to rooms and backfill from existing block/block_code mapping
-- Run once against existing hostel_mgmt database

USE hostel_mgmt;

ALTER TABLE rooms
  ADD COLUMN hostel_id INT NULL AFTER room_number;

-- Backfill using the legacy block_code mapping logic
UPDATE rooms r
LEFT JOIN hostels h
  ON UPPER(TRIM(REPLACE(h.block_code, 'BLOCK_', ''))) = UPPER(TRIM(REPLACE(r.block, 'BLOCK_', '')))
SET r.hostel_id = h.id
WHERE r.hostel_id IS NULL;

ALTER TABLE rooms
  ADD INDEX idx_rooms_hostel_id (hostel_id);

ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_hostel_id
  FOREIGN KEY (hostel_id) REFERENCES hostels(id)
  ON DELETE SET NULL;
