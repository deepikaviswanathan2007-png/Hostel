-- Account-based authentication hardening migration

ALTER TABLE users
  ADD COLUMN status ENUM('active','blocked','suspended') NOT NULL DEFAULT 'active',
  ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN last_failed_attempt DATETIME DEFAULT NULL,
  ADD COLUMN lock_until DATETIME DEFAULT NULL;

CREATE INDEX idx_users_block_state ON users(status, lock_until, failed_attempts);

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

CREATE TABLE IF NOT EXISTS audit_logs (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT DEFAULT NULL,
  action         VARCHAR(120) NOT NULL,
  ip             VARCHAR(64) DEFAULT NULL,
  user_agent     VARCHAR(1000) DEFAULT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_user_created (user_id, created_at),
  INDEX idx_audit_action_created (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
