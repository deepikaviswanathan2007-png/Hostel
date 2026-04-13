const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, role, specialty, created_at
       FROM users
       WHERE role IN ('admin', 'warden', 'caretaker')
       ORDER BY FIELD(role, 'admin', 'warden', 'caretaker'), name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get Staff Directory Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAll };
