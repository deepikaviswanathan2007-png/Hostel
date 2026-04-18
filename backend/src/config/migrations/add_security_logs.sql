CREATE TABLE IF NOT EXISTS security_logs (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(160) DEFAULT NULL,
  ip_address  VARCHAR(64) NOT NULL,
  status      VARCHAR(64) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_logs_ip_created (ip_address, created_at),
  INDEX idx_security_logs_email (email),
  INDEX idx_security_logs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
