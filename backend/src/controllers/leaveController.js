const { pool } = require('../config/database');

const getLinkedStudentId = async (user) => {
  let [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
  if (!studentRows.length) {
    [studentRows] = await pool.query('SELECT id FROM students WHERE email = ?', [user.email]);
  }
  return studentRows[0]?.id || null;
};

const getAll = async (req, res) => {
  try {
    const { status, student_id, page = 1, limit = 20 } = req.query;
    let where = '1=1';
    const params = [];

    if (status) {
      where += ' AND l.status = ?';
      params.push(status);
    }
    if (student_id) {
      where += ' AND l.student_id = ?';
      params.push(student_id);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Join with students to get name/reg no
    const [rows] = await pool.query(
      `SELECT l.*, s.name as student_name, s.register_no as student_reg, u.name as approved_by_name
       FROM leaves l 
       LEFT JOIN students s ON l.student_id = s.id
       LEFT JOIN users u ON l.approved_by = u.id
       WHERE ${where} 
       ORDER BY l.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM leaves l WHERE ${where}`, 
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
    console.error('Get Leaves Error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving leaves.' });
  }
};

const create = async (req, res) => {
  const { student_id, from_date, to_date, reason } = req.body;
  
  if (!student_id || !from_date || !to_date || !reason) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO leaves (student_id, from_date, to_date, reason) VALUES (?, ?, ?, ?)`,
      [student_id, from_date, to_date, reason]
    );
    res.status(201).json({ success: true, message: 'Leave request submitted.', id: result.insertId });
  } catch (err) {
    console.error('Create Leave Error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting leave.' });
  }
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE leaves SET status = ?, approved_by = ? WHERE id = ?`,
      [status, req.user.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    res.json({ success: true, message: `Leave request ${status}.` });
  } catch (err) {
    console.error('Update Leave Status Error:', err);
    res.status(500).json({ success: false, message: 'Server error updating leave.' });
  }
};

const remove = async (req, res) => {
  try {
    let result;

    if (['admin', 'warden'].includes(req.user.role)) {
      [result] = await pool.query('DELETE FROM leaves WHERE id = ?', [req.params.id]);
    } else if (req.user.role === 'student') {
      const studentId = await getLinkedStudentId(req.user);
      if (!studentId) {
        return res.status(404).json({ success: false, message: 'Student profile not linked.' });
      }

      [result] = await pool.query(
        'DELETE FROM leaves WHERE id = ? AND status = "pending" AND student_id = ?',
        [req.params.id, studentId]
      );
    } else {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Leave not found or cannot be deleted.' });
    }
    res.json({ success: true, message: 'Leave request deleted.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAll, create, updateStatus, remove };
