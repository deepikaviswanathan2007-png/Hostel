const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { status, request_type, page = 1, limit = 20 } = req.query;
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND r.status=?'; params.push(status); }
    if (request_type) { where += ' AND r.request_type=?'; params.push(request_type); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT r.*, s.name as student_name, s.register_no, s.department, s.year,
              rm.room_number, rm.block,
              u.name as reviewed_by_name
       FROM requests r
       LEFT JOIN students s ON r.student_id = s.id
       LEFT JOIN rooms rm ON s.room_id = rm.id
       LEFT JOIN users u ON r.reviewed_by = u.id
       WHERE ${where}
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM requests r WHERE ${where}`, params
    );
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) {
    console.error('Get Requests Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const studentId = await getLinkedStudentId(req.user);
    if (!studentId) return res.status(404).json({ success: false, message: 'Student profile not linked.' });

    const [rows] = await pool.query(
      `SELECT r.*, u.name as reviewed_by_name
       FROM requests r
       LEFT JOIN users u ON r.reviewed_by = u.id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`,
      [studentId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get My Requests Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const create = async (req, res) => {
  try {
    const studentId = await getLinkedStudentId(req.user);
    if (!studentId) return res.status(404).json({ success: false, message: 'Student profile not linked.' });

    const { request_type, title, description } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO requests (student_id, request_type, title, description)
       VALUES (?, ?, ?, ?)`,
      [studentId, request_type || 'other', title, description || null]
    );
    res.status(201).json({ success: true, message: 'Request submitted.', id: result.insertId });
  } catch (err) {
    console.error('Create Request Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const review = async (req, res) => {
  try {
    const { status, review_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const [result] = await pool.query(
      `UPDATE requests SET status = ?, reviewed_by = ?, review_note = ? WHERE id = ?`,
      [status, req.user.id, review_note || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    res.json({ success: true, message: `Request ${status}.` });
  } catch (err) {
    console.error('Review Request Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getLinkedStudentId = async (user) => {
  let [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
  if (!rows.length) {
    [rows] = await pool.query('SELECT id FROM students WHERE email = ?', [user.email]);
  }
  return rows[0]?.id || null;
};

module.exports = { getAll, getMyRequests, create, review };
