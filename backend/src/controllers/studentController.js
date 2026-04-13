const { pool } = require('../config/database');
const { Parser } = require('json2csv');
const bcrypt = require('bcryptjs');
const { listStudents } = require('../utils/studentList');

const getAll = async (req, res) => {
  try {
    const mode = req.user.role === 'warden' ? 'warden' : 'admin';
    const wardenScopes = mode === 'warden' ? req.wardenScopes : null;
    const { rows, total, page, limit } = await listStudents({
      mode,
      wardenScopes,
      query: req.query,
    });
    res.json({ success: true, data: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT s.*, r.room_number, r.block FROM students s LEFT JOIN rooms r ON s.room_id=r.id WHERE s.id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const create = async (req, res) => {
  const { name, register_no, department, year, phone, email, address, joined_date } = req.body;
  if (!name || !register_no || !department || !year || !email)
    return res.status(400).json({ success: false, message: 'Name, register no, department, year, and email are required.' });
  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      // 1. Create a User so student can log in
      const defaultPassword = await bcrypt.hash('student123', 10);
      const [userResult] = await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, defaultPassword, 'student']
      );
      const userId = userResult.insertId;

      // 2. Create the Student linked to user
      const [result] = await conn.query(
        'INSERT INTO students (user_id, name, register_no, department, year, phone, email, address, joined_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, name, register_no, department, year, phone || null, email, address || null, joined_date || new Date()]
      );

      await conn.commit();
      res.status(201).json({ success: true, message: 'Student created.', id: result.insertId });
    } catch (insertError) {
      await conn.rollback();
      throw insertError;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Register number or email already exists.' });
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const update = async (req, res) => {
  const { name, department, year, phone, email, address, joined_date, floor, wing } = req.body;
  if (!name || !department || !year) {
    return res.status(400).json({ success: false, message: 'Name, department and year are required.' });
  }
  try {
    let sql =
      'UPDATE students SET name=?,department=?,year=?,phone=?,email=?,address=?,joined_date=?';
    const vals = [name, department, year, phone, email, address, joined_date || null];
    if (Object.prototype.hasOwnProperty.call(req.body, 'floor')) {
      const floorVal = floor === undefined || floor === '' ? null : Number(floor);
      sql += ',floor=?';
      vals.push(Number.isFinite(floorVal) ? floorVal : null);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'wing')) {
      const w = wing === undefined || wing === '' ? null : String(wing).toLowerCase();
      const wingVal = w === 'right' ? 'right' : w === 'left' ? 'left' : null;
      sql += ',wing=?';
      vals.push(wingVal);
    }
    sql += ' WHERE id=?';
    vals.push(req.params.id);
    await pool.query(sql, vals);
    res.json({ success: true, message: 'Student updated.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const remove = async (req, res) => {
  try {
    const [s] = await pool.query('SELECT room_id FROM students WHERE id=?', [req.params.id]);
    if (s.length && s[0].room_id) {
      await pool.query('UPDATE rooms SET occupied=occupied-1 WHERE id=? AND occupied>0', [s[0].room_id]);
      await pool.query('UPDATE rooms SET status=IF(occupied>=capacity,"occupied","available") WHERE id=?', [s[0].room_id]);
    }
    await pool.query('DELETE FROM students WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Student deleted.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const exportCSV = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.name,s.register_no,s.department,s.year,s.phone,s.email,r.room_number,r.block 
       FROM students s 
       LEFT JOIN rooms r ON s.room_id=r.id 
       LEFT JOIN users u ON s.user_id=u.id
       WHERE u.role='student' OR s.user_id IS NULL
       ORDER BY s.name`
    );
    const parser = new Parser({ fields: ['name','register_no','department','year','phone','email','room_number','block'] });
    const csv = parser.parse(rows);
    res.header('Content-Type','text/csv');
    res.attachment('students.csv');
    res.send(csv);
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Export failed.' }); }
};

module.exports = { getAll, getOne, create, update, remove, exportCSV };
