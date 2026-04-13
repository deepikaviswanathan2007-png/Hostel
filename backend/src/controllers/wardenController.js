const { pool } = require('../config/database');
const { listStudents } = require('../utils/studentList');
const { loadWardenScopes } = require('../middleware/wardenScope');

const getMyScope = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({ success: true, assignments: [] });
    }
    if (req.user.role !== 'warden') {
      return res.status(403).json({ success: false, message: 'Warden or admin access required.' });
    }
    const assignments = await loadWardenScopes(req.user.id);
    res.json({ success: true, assignments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getStats = async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) as totalStudents FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE u.role = 'student' OR s.user_id IS NULL");
    const [[{ totalRooms }]] = await pool.query('SELECT COUNT(*) as totalRooms FROM rooms');
    const [[{ availableRooms }]] = await pool.query("SELECT COUNT(*) as availableRooms FROM rooms WHERE status='available'");
    const [[{ occupiedRooms }]] = await pool.query("SELECT COUNT(*) as occupiedRooms FROM rooms WHERE status='occupied'");
    const [[{ totalComplaints }]] = await pool.query("SELECT COUNT(*) as totalComplaints FROM complaints");

    const [blockStats] = await pool.query(
      "SELECT block, SUM(capacity) as capacity, SUM(occupied) as occupied FROM rooms GROUP BY block ORDER BY block"
    );

    const [recentStudents] = await pool.query(
      'SELECT id, name, register_no, department, year, created_at FROM students ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      success: true,
      stats: { totalStudents, totalRooms, availableRooms, occupiedRooms, totalComplaints },
      blockStats,
      recentStudents,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getStudents = async (req, res) => {
  try {
    let mode = 'admin';
    let wardenScopes = null;
    if (req.user.role === 'warden') {
      mode = 'warden';
      wardenScopes = await loadWardenScopes(req.user.id);
    }
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

module.exports = { getStats, getStudents, getComplaints, getMyScope };
