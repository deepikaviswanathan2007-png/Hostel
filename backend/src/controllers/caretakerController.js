const { pool } = require('../config/database');

const getStats = async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) as totalStudents FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE u.role = 'student' OR s.user_id IS NULL");
    const [[{ totalRooms }]] = await pool.query('SELECT COUNT(*) as totalRooms FROM rooms');
    const [[{ occupiedRooms }]] = await pool.query("SELECT COUNT(*) as occupiedRooms FROM rooms WHERE status='occupied'");
    const [[{ pendingComplaints }]] = await pool.query("SELECT COUNT(*) as pendingComplaints FROM complaints WHERE status='pending'");
    const [[{ inProgressComplaints }]] = await pool.query("SELECT COUNT(*) as inProgressComplaints FROM complaints WHERE status='in_progress'");

    const [recentComplaints] = await pool.query(
      "SELECT c.id, c.title, c.status, c.priority, c.category, c.created_at, s.name as student_name FROM complaints c LEFT JOIN students s ON c.student_id=s.id ORDER BY c.created_at DESC LIMIT 10"
    );

    res.json({
      success: true,
      stats: { totalStudents, totalRooms, occupiedRooms, pendingComplaints, inProgressComplaints },
      recentComplaints,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getComplaints = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND c.status=?'; params.push(status); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT c.*, s.name as student_name, s.register_no, r.room_number FROM complaints c
       LEFT JOIN students s ON c.student_id=s.id
       LEFT JOIN rooms r ON s.room_id=r.id
       WHERE ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM complaints c WHERE ${where}`,
      params
    );
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { status, assigned_to } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });

    await pool.query(
      'UPDATE complaints SET status=?, assigned_to=?, updated_at=NOW() WHERE id=?',
      [status, assigned_to || null, req.params.id]
    );
    res.json({ success: true, message: 'Complaint status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getStats, getComplaints, updateComplaintStatus };
