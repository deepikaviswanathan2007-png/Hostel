-- ============================================================
--  New Features Migration: Messages, Payments, Hostels
--  Run once against your existing hostel_mgmt database
-- ============================================================

USE hostel_mgmt;

-- ── WARDEN MESSAGES TABLE ────────────────────────────────────
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

-- ── PAYMENTS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  payment_date    DATE NOT NULL,
  mode            ENUM('CASH','UPI','CARD','BANK_TRANSFER') DEFAULT 'UPI',
  status          ENUM('PENDING','PAID','FAILED') DEFAULT 'PENDING',
  transaction_id  VARCHAR(100) DEFAULT NULL,
  note            TEXT DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_payments_student_id (student_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── HOSTELS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL UNIQUE,
  block_code      VARCHAR(20) DEFAULT NULL,
  gender          ENUM('MALE','FEMALE') DEFAULT 'MALE',
  total_rooms     INT DEFAULT 0,
  warden_id       INT DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warden_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_hostels_gender (gender),
  INDEX idx_hostels_warden_id (warden_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
