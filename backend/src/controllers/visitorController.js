const { pool } = require('../config/database');

const findStudentByUser = async (userId) => {
  const [byUserId] = await pool.query(
    'SELECT id, name, register_no, room_id FROM students WHERE user_id = ? LIMIT 1',
    [userId]
  );
  if (byUserId.length) return byUserId[0];

  const [users] = await pool.query('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!users.length) return null;

  const [byEmail] = await pool.query(
    'SELECT id, name, register_no, room_id FROM students WHERE email = ? LIMIT 1',
    [users[0].email]
  );
  return byEmail[0] || null;
};

const getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let where = '1=1';
    const params = [];

    if (search) {
      where += ' AND (v.visitor_name LIKE ? OR v.phone LIKE ? OR s.name LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (status) {
      where += ' AND v.status = ?';
      params.push(status);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch visitors with student details
    const [rows] = await pool.query(
      `SELECT v.*, s.name as student_name, s.register_no as student_reg, r.room_number 
       FROM visitors v 
       LEFT JOIN students s ON v.student_id = s.id
       LEFT JOIN rooms r ON s.room_id = r.id
       WHERE ${where} 
       ORDER BY v.in_time DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM visitors v
       LEFT JOIN students s ON v.student_id = s.id
       WHERE ${where}`, 
      params
    );

    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get Visitors Error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving visitors.' });
  }
};

const create = async (req, res) => {
  const { visitor_name, relation, phone, id_proof, student_id } = req.body;
  
  if (!visitor_name || !relation || !phone || !student_id) {
    return res.status(400).json({ success: false, message: 'Visitor name, relation, phone, and student are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO visitors (visitor_name, relation, phone, id_proof, student_id, in_time, status) 
       VALUES (?, ?, ?, ?, ?, NOW(), 'inside')`,
      [visitor_name, relation, phone, id_proof, student_id]
    );

    res.status(201).json({ success: true, message: 'Visitor logged successfully.', id: result.insertId });
  } catch (err) {
    console.error('Create Visitor Error:', err);
    res.status(500).json({ success: false, message: 'Server error logging visitor.' });
  }
};

const markExit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      `UPDATE visitors SET status = 'exited', out_time = NOW() WHERE id = ? AND status = 'inside'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Visitor not found or already exited.' });
    }

    res.json({ success: true, message: 'Visitor marked as exited.' });
  } catch (err) {
    console.error('Mark Exit Error:', err);
    res.status(500).json({ success: false, message: 'Server error updating visitor status.' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM visitors WHERE id = ?', [id]);
    res.json({ success: true, message: 'Visitor record deleted.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMine = async (req, res) => {
  try {
    const student = await findStudentByUser(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Profile not linked. Contact hostel admin.' });
    }

    const [rows] = await pool.query(
      `SELECT v.*, s.name AS student_name, s.register_no AS student_reg, r.room_number
       FROM visitors v
       LEFT JOIN students s ON v.student_id = s.id
       LEFT JOIN rooms r ON s.room_id = r.id
       WHERE v.student_id = ?
       ORDER BY v.in_time DESC`,
      [student.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get My Visitors Error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving visitors.' });
  }
};

const createForStudent = async (req, res) => {
  try {
    const student = await findStudentByUser(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Profile not linked. Contact hostel admin.' });
    }

    const { visitor_name, relation, phone, id_proof } = req.body;
    if (!visitor_name || !relation || !phone) {
      return res.status(400).json({ success: false, message: 'Visitor name, relation, and phone are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO visitors (visitor_name, relation, phone, id_proof, student_id, in_time, status)
       VALUES (?, ?, ?, ?, ?, NOW(), 'inside')`,
      [visitor_name, relation, phone, id_proof || null, student.id]
    );

    res.status(201).json({ success: true, message: 'Visitor request submitted successfully.', id: result.insertId });
  } catch (err) {
    console.error('Create Student Visitor Error:', err);
    res.status(500).json({ success: false, message: 'Server error logging visitor.' });
  }
};

module.exports = { getAll, create, markExit, remove, getMine, createForStudent };
