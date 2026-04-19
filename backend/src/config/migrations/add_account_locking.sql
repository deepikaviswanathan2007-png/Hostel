-- Account-based blocking and login lockout migration

ALTER TABLE users
  ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN status ENUM('active','blocked','suspended') NOT NULL DEFAULT 'active',
  ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN last_failed_login DATETIME DEFAULT NULL,
  ADD COLUMN lock_until DATETIME DEFAULT NULL;

CREATE INDEX idx_users_block_state ON users(is_blocked, status, lock_until);

CREATE TABLE IF NOT EXISTS login_attempts (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(120) NOT NULL,
  user_id        INT DEFAULT NULL,
  ip_address     VARCHAR(64) DEFAULT NULL,
  user_agent     VARCHAR(1000) DEFAULT NULL,
  success        TINYINT(1) NOT NULL DEFAULT 0,
  failure_reason VARCHAR(160) DEFAULT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_login_attempts_email_created (email, created_at),
  INDEX idx_login_attempts_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
