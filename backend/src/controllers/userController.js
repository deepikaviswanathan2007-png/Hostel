const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    let where = "role != 'student'";
    const params = [];
    if (role) { where += ' AND role=?'; params.push(role); }
    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT id, name, email, role, specialty, google_id IS NOT NULL as has_google, created_at, updated_at
       FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM users WHERE ${where}`, params
    );
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) {
    console.error('Get Users Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, specialty, google_id IS NOT NULL as has_google, created_at FROM users WHERE id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, password, role, specialty } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
    }

    // Check duplicate email
    const [[existing]] = await pool.query('SELECT id FROM users WHERE email=?', [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, specialty) VALUES (?, ?, ?, ?, ?)',
      [name, normalizedEmail, hashedPassword, role, specialty || null]
    );
    res.status(201).json({ success: true, message: 'User created.', id: result.insertId });
  } catch (err) {
    console.error('Create User Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const update = async (req, res) => {
  try {
    const { name, email, role, specialty, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const fields = [];
    const params = [];

    if (name) { fields.push('name=?'); params.push(name); }
    if (email) { fields.push('email=?'); params.push(normalizedEmail); }
    if (role) { fields.push('role=?'); params.push(role); }
    if (specialty !== undefined) { fields.push('specialty=?'); params.push(specialty || null); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password=?');
      params.push(hashed);
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    params.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id=?`, params
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'User updated.' });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const remove = async (req, res) => {
  try {
    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }
    const [result] = await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAll, getOne, create, update, remove };
