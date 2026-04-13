const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND ha.status=?'; params.push(status); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT ha.*, s.name as student_name, s.register_no, s.department, s.year,
              u.name as reviewed_by_name
       FROM hostel_applications ha
       LEFT JOIN students s ON ha.student_id = s.id
       LEFT JOIN users u ON ha.reviewed_by = u.id
       WHERE ${where}
       ORDER BY ha.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM hostel_applications ha WHERE ${where}`, params
    );
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) {
    console.error('Get Applications Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const studentId = await getLinkedStudentId(req.user);
    if (!studentId) return res.status(404).json({ success: false, message: 'Student profile not linked.' });

    const [rows] = await pool.query(
      `SELECT ha.*, u.name as reviewed_by_name
       FROM hostel_applications ha
       LEFT JOIN users u ON ha.reviewed_by = u.id
       WHERE ha.student_id = ?
       ORDER BY ha.created_at DESC`,
      [studentId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get My Applications Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const create = async (req, res) => {
  try {
    const studentId = await getLinkedStudentId(req.user);
    if (!studentId) return res.status(404).json({ success: false, message: 'Student profile not linked.' });

    const { academic_year, semester, preferred_block, preferred_room_type, reason } = req.body;
    if (!academic_year || !semester) {
      return res.status(400).json({ success: false, message: 'Academic year and semester are required.' });
    }

    // Check for existing pending application
    const [[existing]] = await pool.query(
      'SELECT id FROM hostel_applications WHERE student_id = ? AND status = "pending"',
      [studentId]
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending application.' });
    }

    const [result] = await pool.query(
      `INSERT INTO hostel_applications (student_id, academic_year, semester, preferred_block, preferred_room_type, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, academic_year, semester, preferred_block || null, preferred_room_type || null, reason || null]
    );
    res.status(201).json({ success: true, message: 'Hostel application submitted.', id: result.insertId });
  } catch (err) {
    console.error('Create Application Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const review = async (req, res) => {
  try {
    const { status, review_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be approved or rejected.' });
    }

    const [result] = await pool.query(
      `UPDATE hostel_applications SET status = ?, reviewed_by = ?, review_note = ? WHERE id = ?`,
      [status, req.user.id, review_note || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    res.json({ success: true, message: `Application ${status}.` });
  } catch (err) {
    console.error('Review Application Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Helper
async function getLinkedStudentId(user) {
  let [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
  if (!rows.length) {
    [rows] = await pool.query('SELECT id FROM students WHERE email = ?', [user.email]);
  }
  return rows[0]?.id || null;
}

module.exports = { getAll, getMyApplications, create, review };
