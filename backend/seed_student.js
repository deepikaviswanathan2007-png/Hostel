const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function seed() {
  try {
    const hash = await bcrypt.hash('password', 10);
    const email = 'student@baithotel.edu';
    
    // Insert User
    await pool.query('INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Test Student', email, hash, 'student']);
    const [uRows] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (!uRows.length) return console.log('User not found');
    const userId = uRows[0].id;

    // Insert Student
    await pool.query('INSERT IGNORE INTO students (user_id, name, register_no, department, year, email) VALUES (?, ?, ?, ?, ?, ?)', [userId, 'Test Student', '22CS001', 'CSE', 3, email]);
    console.log('Test student created successfully. Login with student@baithotel.edu / password');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
seed();
