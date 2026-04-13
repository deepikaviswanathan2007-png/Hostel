require('dotenv').config({ path: '../../.env' });
const { pool } = require('./database');

async function migrate() {
  try {
    await pool.query(`
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
    `);
    console.log("Leaves table created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
migrate();
