const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hostel_mgmt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});



const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function testConnectionWithRetry() {
  const maxAttempts = Number(process.env.DB_CONNECT_RETRIES || 20);
  const delayMs = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 1500);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const conn = await pool.getConnection();
      console.log('âœ… MySQL connected successfully');
      conn.release();
      return;
    } catch (err) {
      console.error(
        `âŒ MySQL connection failed (attempt ${attempt}/${maxAttempts}):`,
        err.message
      );
      if (attempt === maxAttempts) process.exit(1);
      await sleep(delayMs);
    }
  }
}

module.exports = { pool, testConnection: testConnectionWithRetry };
