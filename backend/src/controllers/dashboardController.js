const { pool } = require('../config/database');

const getStats = async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) as totalStudents FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE u.role = 'student' OR s.user_id IS NULL");
    const [[{ totalRooms }]]    = await pool.query('SELECT COUNT(*) as totalRooms FROM rooms');
    const [[{ availableRooms }]]= await pool.query("SELECT COUNT(*) as availableRooms FROM rooms WHERE status='available'");
    const [[{ occupiedRooms }]] = await pool.query("SELECT COUNT(*) as occupiedRooms FROM rooms WHERE status='occupied'");
    const [[{ pendingComplaints }]] = await pool.query("SELECT COUNT(*) as pendingComplaints FROM complaints WHERE status='pending'");
    const [[{ resolvedComplaints }]] = await pool.query("SELECT COUNT(*) as resolvedComplaints FROM complaints WHERE status='resolved'");

    const [blockStats] = await pool.query(
      "SELECT block, SUM(capacity) as capacity, SUM(occupied) as occupied FROM rooms GROUP BY block ORDER BY block"
    );
    const [recentStudents] = await pool.query(
      'SELECT name,register_no,department,year,created_at FROM students ORDER BY created_at DESC LIMIT 5'
    );
    const [recentComplaints] = await pool.query(
      "SELECT c.title,c.status,c.category,c.created_at,s.name as student_name FROM complaints c LEFT JOIN students s ON c.student_id=s.id ORDER BY c.created_at DESC LIMIT 5"
    );

    res.json({
      success: true,
      stats: { totalStudents, totalRooms, availableRooms, occupiedRooms, pendingComplaints, resolvedComplaints },
      blockStats,
      recentStudents,
      recentComplaints,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getStats };
