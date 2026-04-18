-- ============================================================
--  Bannari Amman Institute of Technology
--  Hostel Management System – Complete Database Schema
--  Compatible with MySQL 5.7+ / 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS hostel_mgmt
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hostel_mgmt;

SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS wardens;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS hostel_applications;
DROP TABLE IF EXISTS mess_menu;
DROP TABLE IF EXISTS leaves;
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS warden_messages;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS security_incidents;
DROP TABLE IF EXISTS blocked_ips;
DROP TABLE IF EXISTS allocations;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS floor_warden_assignments;
DROP TABLE IF EXISTS hostels;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ── HOSTELS TABLE ──
CREATE TABLE IF NOT EXISTS hostels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  block_code VARCHAR(20),
  gender ENUM('MALE','FEMALE') DEFAULT 'MALE',
  total_rooms INT DEFAULT 0,
  warden_id INT DEFAULT NULL,
  capacity INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hostels_block_code (block_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── USERS TABLE ──
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  password    VARCHAR(255) NULL,
  google_id   VARCHAR(255) DEFAULT NULL,
  role        ENUM('admin','caretaker','warden','student') DEFAULT 'student',
  specialty   VARCHAR(60) DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_google_id (google_id),
  INDEX idx_users_specialty (specialty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW wardens AS
  SELECT id, name, email FROM users WHERE role = 'warden';

-- ── ROOMS TABLE ──
CREATE TABLE IF NOT EXISTS rooms (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  room_number  VARCHAR(20) NOT NULL UNIQUE,
  hostel_id    INT DEFAULT NULL,
  block        ENUM('A','B','C','D') NOT NULL,
  floor        TINYINT NOT NULL DEFAULT 1,
  wing         ENUM('left','right') DEFAULT NULL,
  capacity     TINYINT NOT NULL DEFAULT 4,
  occupied     TINYINT NOT NULL DEFAULT 0,
  room_type    ENUM('single','double','triple','quad') DEFAULT 'single',
  status       ENUM('available','occupied','maintenance','reserved') DEFAULT 'available',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL,
  INDEX idx_rooms_hostel_id (hostel_id),
  INDEX idx_rooms_block (block),
  INDEX idx_rooms_status (status),
  INDEX idx_rooms_room_number (room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── FLOOR WARDEN ASSIGNMENTS TABLE ──
CREATE TABLE IF NOT EXISTS floor_warden_assignments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  block        ENUM('A','B','C','D') NOT NULL,
  floor        TINYINT NOT NULL,
  wing         ENUM('left','right') NOT NULL,
  warden_id    INT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_floor_wing (block, floor, wing),
  UNIQUE KEY uniq_floor_warden (block, floor, warden_id),
  INDEX idx_floor_lookup (block, floor),
  FOREIGN KEY (warden_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── STUDENTS TABLE ──
CREATE TABLE IF NOT EXISTS students (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT DEFAULT NULL,
  name         VARCHAR(120) NOT NULL,
  register_no  VARCHAR(30) NOT NULL UNIQUE,
  department   VARCHAR(60) NOT NULL,
  year         TINYINT NOT NULL,
  phone        VARCHAR(15),
  email        VARCHAR(120),
  address      TEXT,
  room_id      INT DEFAULT NULL,
  floor        TINYINT NULL DEFAULT NULL,
  wing         ENUM('left','right') DEFAULT NULL,
  joined_date  DATE,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  CONSTRAINT chk_year CHECK (year BETWEEN 1 AND 4),
  INDEX idx_students_register_no (register_no),
  INDEX idx_students_email (email),
  INDEX idx_students_room_id (room_id),
  INDEX idx_students_user_id (user_id),
  INDEX idx_students_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ALLOCATIONS TABLE ──
CREATE TABLE IF NOT EXISTS allocations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  room_id      INT NOT NULL,
  allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  vacated_at   DATETIME DEFAULT NULL,
  is_active    TINYINT(1) DEFAULT 1,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_alloc_student_id (student_id),
  INDEX idx_alloc_room_id (room_id),
  INDEX idx_alloc_is_active (is_active),
  INDEX idx_alloc_allocated_at (allocated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── COMPLAINTS TABLE ──
CREATE TABLE IF NOT EXISTS complaints (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT DEFAULT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     ENUM('plumbing','electrical','carpentry','housekeeping','network','mess','other') DEFAULT 'other',
  status       ENUM('pending','in_progress','resolved') DEFAULT 'pending',
  priority     ENUM('low','medium','high') DEFAULT 'medium',
  assigned_to  INT DEFAULT NULL,
  admin_note   TEXT,
  attachment_url VARCHAR(500) DEFAULT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_comp_student_id (student_id),
  INDEX idx_comp_status (status),
  INDEX idx_comp_category (category),
  INDEX idx_comp_priority (priority),
  INDEX idx_comp_assigned_to (assigned_to),
  INDEX idx_comp_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── NOTICES TABLE ──
CREATE TABLE IF NOT EXISTS notices (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  content     TEXT,
  category    ENUM('general','urgent','maintenance','accounts','events') DEFAULT 'general',
  target      ENUM('all','block_a','block_b','block_c','block_d') DEFAULT 'all',
  posted_by   INT DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notices_category (category),
  INDEX idx_notices_target (target),
  INDEX idx_notices_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── WARDEN MESSAGES (admin ↔ warden) ──
CREATE TABLE IF NOT EXISTS warden_messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  sender_id       INT NOT NULL,
  receiver_id     INT DEFAULT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  priority        ENUM('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  status          ENUM('SENT','SEEN','RESOLVED') DEFAULT 'SENT',
  is_to_all_wardens TINYINT(1) DEFAULT 0,
  admin_reply     TEXT DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_wm_sender (sender_id),
  INDEX idx_wm_receiver (receiver_id),
  INDEX idx_wm_status (status),
  INDEX idx_wm_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── VISITORS TABLE ──
CREATE TABLE IF NOT EXISTS visitors (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  visitor_name VARCHAR(120) NOT NULL,
  relation     VARCHAR(50),
  phone        VARCHAR(15),
  id_proof     VARCHAR(50),
  student_id   INT DEFAULT NULL,
  in_time      DATETIME DEFAULT CURRENT_TIMESTAMP,
  out_time     DATETIME DEFAULT NULL,
  status       ENUM('inside','exited') DEFAULT 'inside',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  INDEX idx_visitors_student_id (student_id),
  INDEX idx_visitors_status (status),
  INDEX idx_visitors_in_time (in_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LEAVES TABLE ──
CREATE TABLE IF NOT EXISTS leaves (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  from_date    DATE NOT NULL,
  to_date      DATE NOT NULL,
  reason       TEXT NOT NULL,
  status       ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by  INT DEFAULT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_leaves_student_id (student_id),
  INDEX idx_leaves_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── MESS MENU TABLE ──
CREATE TABLE IF NOT EXISTS mess_menu (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  day_of_week  ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  meal_type    ENUM('Breakfast','Lunch','Snacks','Dinner') NOT NULL,
  items        TEXT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_meal (day_of_week, meal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── HOSTEL APPLICATIONS TABLE ──
CREATE TABLE IF NOT EXISTS hostel_applications (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  student_id          INT NOT NULL,
  academic_year       VARCHAR(20) NOT NULL,
  semester            TINYINT NOT NULL,
  preferred_block     ENUM('A','B','C','D') DEFAULT NULL,
  preferred_room_type ENUM('single','double','triple','quad') DEFAULT NULL,
  reason              TEXT,
  status              ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by         INT DEFAULT NULL,
  review_note         TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hostel_app_student (student_id),
  INDEX idx_hostel_app_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── REQUESTS TABLE ──
CREATE TABLE IF NOT EXISTS requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  request_type    ENUM('room_change','other') DEFAULT 'other',
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by     INT DEFAULT NULL,
  review_note     TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_req_student (student_id),
  INDEX idx_req_status (status),
  INDEX idx_req_type (request_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ATTENDANCE TABLE ──
CREATE TABLE IF NOT EXISTS attendance (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  check_type      ENUM('morning','evening','manual') DEFAULT 'manual',
  checked_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  method          ENUM('biometric','manual','qr') DEFAULT 'manual',
  marked_by       INT DEFAULT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_att_student (student_id),
  INDEX idx_att_date (checked_at),
  INDEX idx_att_type (check_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SECURITY INCIDENTS TABLE ──
CREATE TABLE IF NOT EXISTS security_incidents (
  id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type         VARCHAR(80) NOT NULL,
  severity           ENUM('low','medium','high','critical') DEFAULT 'medium',
  status             ENUM('open','resolved','blocked','ignored') DEFAULT 'open',
  actor_user_id      INT DEFAULT NULL,
  actor_email        VARCHAR(160) DEFAULT NULL,
  actor_role         VARCHAR(50) DEFAULT NULL,
  target_user_id     INT DEFAULT NULL,
  target_user_name   VARCHAR(160) DEFAULT NULL,
  target_user_meta   VARCHAR(120) DEFAULT NULL,
  request_method     VARCHAR(12) DEFAULT NULL,
  endpoint           VARCHAR(500) DEFAULT NULL,
  source_ip          VARCHAR(64) DEFAULT NULL,
  user_agent         VARCHAR(1000) DEFAULT NULL,
  browser            VARCHAR(120) DEFAULT NULL,
  operating_system   VARCHAR(120) DEFAULT NULL,
  device_type        VARCHAR(60) DEFAULT NULL,
  message            TEXT,
  raw_context        JSON DEFAULT NULL,
  reviewed_by        INT DEFAULT NULL,
  reviewed_at        DATETIME DEFAULT NULL,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sec_event_type (event_type),
  INDEX idx_sec_severity (severity),
  INDEX idx_sec_status (status),
  INDEX idx_sec_source_ip (source_ip),
  INDEX idx_sec_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── BLOCKED IPs TABLE ──
CREATE TABLE IF NOT EXISTS blocked_ips (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  ip_address         VARCHAR(64) NOT NULL UNIQUE,
  reason             VARCHAR(255) DEFAULT NULL,
  blocked_by_user_id INT DEFAULT NULL,
  expires_at         DATETIME DEFAULT NULL,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (blocked_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_blocked_ips_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX idx_students_created_at ON students(created_at);
CREATE INDEX idx_comp_updated_at ON complaints(updated_at);
CREATE INDEX idx_rooms_block_status ON rooms(block, status);
CREATE INDEX idx_alloc_student_room ON allocations(student_id, room_id);

-- ============================================================
-- END OF SCHEMA
-- ============================================================