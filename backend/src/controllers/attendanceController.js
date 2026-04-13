const { pool } = require('../config/database');

const getLinkedStudentId = async (user) => {
  let [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
  if (!rows.length) {
    [rows] = await pool.query('SELECT id FROM students WHERE email = ?', [user.email]);
  }
  return rows[0]?.id || null;
};

const getAll = async (req, res) => {
  try {
    const { student_id, date, check_type, page = 1, limit = 50 } = req.query;
    let where = '1=1';
    const params = [];

    if (student_id) { where += ' AND a.student_id=?'; params.push(student_id); }
    if (check_type) { where += ' AND a.check_type=?'; params.push(check_type); }
    if (date) { where += ' AND DATE(a.checked_at)=?'; params.push(date); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT a.*, s.name as student_name, s.register_no, s.department, s.year,
              r.room_number, r.block,
              u.name as marked_by_name
       FROM attendance a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN rooms r ON s.room_id = r.id
       LEFT JOIN users u ON a.marked_by = u.id
       WHERE ${where}
       ORDER BY a.checked_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM attendance a WHERE ${where}`, params
    );
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) {
    console.error('Get Attendance Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const studentId = await getLinkedStudentId(req.user);
    if (!studentId) return res.status(404).json({ success: false, message: 'Student profile not linked.' });

    const { month, year } = req.query;
    let where = 'a.student_id = ?';
    const params = [studentId];

    if (month && year) {
      where += ' AND MONTH(a.checked_at) = ? AND YEAR(a.checked_at) = ?';
      params.push(parseInt(month), parseInt(year));
    }

    const [rows] = await pool.query(
      `SELECT a.*, u.name as marked_by_name
       FROM attendance a
       LEFT JOIN users u ON a.marked_by = u.id
       WHERE ${where}
       ORDER BY a.checked_at DESC`,
      params
    );

    // Summary stats
    const [[stats]] = await pool.query(
      `SELECT
         COUNT(*) as total_checkins,
         SUM(check_type='morning') as morning_count,
         SUM(check_type='evening') as evening_count,
         COUNT(DISTINCT DATE(checked_at)) as days_present
       FROM attendance a WHERE a.student_id = ?`,
      [studentId]
    );

    res.json({ success: true, data: rows, stats });
  } catch (err) {
    console.error('Get My Attendance Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { student_id, check_type, method } = req.body;
    if (!student_id || !check_type) {
      return res.status(400).json({ success: false, message: 'Student ID and check type are required.' });
    }

    // Check for duplicate check-in on same day
    const [[existing]] = await pool.query(
      `SELECT id FROM attendance
       WHERE student_id = ? AND check_type = ? AND DATE(checked_at) = CURDATE()`,
      [student_id, check_type]
    );
    if (existing) {
      return res.status(400).json({ success: false, message: `Already checked in for ${check_type} today.` });
    }

    const [result] = await pool.query(
      `INSERT INTO attendance (student_id, check_type, method, marked_by) VALUES (?, ?, ?, ?)`,
      [student_id, check_type, method || 'manual', req.user.id]
    );
    res.status(201).json({ success: true, message: 'Attendance marked.', id: result.insertId });
  } catch (err) {
    console.error('Mark Attendance Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const bulkMark = async (req, res) => {
  try {
    const { student_ids, check_type, method } = req.body;
    if (!Array.isArray(student_ids) || !student_ids.length || !check_type) {
      return res.status(400).json({ success: false, message: 'Student IDs array and check type required.' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();
    let marked = 0;
    let skipped = 0;

    try {
      for (const sid of student_ids) {
        const [[existing]] = await connection.query(
          `SELECT id FROM attendance WHERE student_id = ? AND check_type = ? AND DATE(checked_at) = CURDATE()`,
          [sid, check_type]
        );
        if (!existing) {
          await connection.query(
            `INSERT INTO attendance (student_id, check_type, method, marked_by) VALUES (?, ?, ?, ?)`,
            [sid, check_type, method || 'manual', req.user.id]
          );
          marked++;
        } else {
          skipped++;
        }
      }
      await connection.commit();
      res.json({ success: true, message: `Attendance marked for ${marked} students. ${skipped} skipped (already marked).` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Bulk Mark Attendance Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// getLinkedStudentId moved to top of file

module.exports = { getAll, getMyAttendance, markAttendance, bulkMark };
