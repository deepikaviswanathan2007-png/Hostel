const { pool } = require('../config/database');
const { findBestStaff } = require('../services/smartRouter');
const path = require('path');
const fs = require('fs');

const getFloorWardens = async (block, floor) => {
  if (!block || !floor) return [];
  try {
    const [rows] = await pool.query(
      `SELECT fwa.wing, u.name
       FROM floor_warden_assignments fwa
       INNER JOIN users u ON u.id = fwa.warden_id
       WHERE fwa.block = ? AND fwa.floor = ?
       ORDER BY FIELD(fwa.wing, 'left', 'right') ASC, u.name ASC`,
      [block, floor]
    );
    return rows.map(row => `${row.wing === 'left' ? 'Left Wing' : 'Right Wing'}: ${row.name}`);
  } catch (error) {
    console.error('Error fetching wardens:', error);
    return [];
  }
};

const findStudentByUser = async (userId) => {
  const [byUserId] = await pool.query(
    `SELECT s.*, r.room_number, r.block, r.floor, r.room_type
     FROM students s LEFT JOIN rooms r ON s.room_id=r.id
     WHERE s.user_id=?`,
    [userId]
  );
  if (byUserId.length) {
    const student = byUserId[0];
    const wardens = await getFloorWardens(student.block, student.floor);
    student.warden_names = wardens;
    student.warden_name = wardens.join(', ');
    return student;
  }

  const [users] = await pool.query('SELECT email FROM users WHERE id=?', [userId]);
  if (!users.length) return null;
  const [byEmail] = await pool.query(
    `SELECT s.*, r.room_number, r.block, r.floor, r.room_type
     FROM students s LEFT JOIN rooms r ON s.room_id=r.id
     WHERE s.email=?`,
    [users[0].email]
  );
  if (!byEmail.length) return null;
  const student = byEmail[0];
  const wardens = await getFloorWardens(student.block, student.floor);
  student.warden_names = wardens;
  student.warden_name = wardens.join(', ');
  return student;
};

const getMyProfile = async (req, res) => {
  try {
    const student = await findStudentByUser(req.user.id);
    if (!student)
      return res.status(404).json({ success: false, message: 'Profile not linked. Contact hostel admin.' });
    res.json({ success: true, data: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyDashboard = async (req, res) => {
  try {
    const student = await findStudentByUser(req.user.id);
    const dashData = { student: null, roommates: [], complaintStats: {}, recentNotices: [] };

    if (student) {
      dashData.student = student;
      if (student.room_id) {
        const [roommates] = await pool.query(
          'SELECT name, register_no, department, year FROM students WHERE room_id=? AND id!=?',
          [student.room_id, student.id]
        );
        dashData.roommates = roommates;
      }
      const [[stats]] = await pool.query(
        `SELECT COUNT(*) as total, SUM(status='pending') as pending,
                SUM(status='in_progress') as in_progress, SUM(status='resolved') as resolved
         FROM complaints WHERE student_id=?`,
        [student.id]
      );
      dashData.complaintStats = stats;
    }

    const [notices] = await pool.query(
      'SELECT id, title, content, category, created_at FROM notices ORDER BY created_at DESC LIMIT 5'
    );
    dashData.recentNotices = notices;
    res.json({ success: true, data: dashData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const student = await findStudentByUser(req.user.id);
    if (!student)
      return res.status(404).json({ success: false, message: 'Profile not linked.' });

    const { status, page = 1, limit = 20 } = req.query;
    let where = 'c.student_id=?';
    const params = [student.id];
    if (status) { where += ' AND c.status=?'; params.push(status); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT c.*, r.room_number FROM complaints c
       LEFT JOIN students s ON c.student_id=s.id
       LEFT JOIN rooms r ON s.room_id=r.id
       WHERE ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM complaints c WHERE ${where}`, params
    );
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const fileComplaint = async (req, res) => {
  try {
    const student = await findStudentByUser(req.user.id);
    if (!student)
      return res.status(404).json({ success: false, message: 'Profile not linked.' });

    const { title, description, category, priority } = req.body;
    if (!title)
      return res.status(400).json({ success: false, message: 'Title is required.' });

    const cat = category || 'other';
    const staff = await findBestStaff(cat);
    const assignedTo = staff ? staff.id : null;

    // Handle file attachment (optional)
    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/complaints/${req.file.filename}`;
    }

    const [result] = await pool.query(
      'INSERT INTO complaints (student_id, title, description, category, priority, assigned_to, attachment_url) VALUES (?,?,?,?,?,?,?)',
      [student.id, title, description, cat, priority || 'medium', assignedTo, attachmentUrl]
    );
    res.status(201).json({
      success: true,
      message: staff ? `Complaint filed and auto-assigned to ${staff.name}.` : 'Complaint filed.',
      id: result.insertId,
      assigned_to: staff,
      attachment_url: attachmentUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateMyComplaint = async (req, res) => {
  try {
    const student = await findStudentByUser(req.user.id);
    if (!student)
      return res.status(404).json({ success: false, message: 'Profile not linked.' });

    const [[complaint]] = await pool.query(
      'SELECT id, status, attachment_url FROM complaints WHERE id=? AND student_id=?',
      [req.params.id, student.id]
    );
    if (!complaint)
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Only pending complaints can be edited.' });

    const { title, description, category, priority } = req.body;
    if (!title)
      return res.status(400).json({ success: false, message: 'Title is required.' });

    // Handle file attachment replacement
    let attachmentUrl = undefined; // undefined = don't update
    if (req.file) {
      attachmentUrl = `/uploads/complaints/${req.file.filename}`;
      // Clean up old attachment if it exists
      if (complaint.attachment_url) {
        const oldPath = path.join(__dirname, '..', '..', complaint.attachment_url);
        fs.unlink(oldPath, () => {}); // fire-and-forget
      }
    }

    // Fetch current attachment_url for the update
    const fields = ['title=?', 'description=?', 'category=?', 'priority=?'];
    const params = [title, description || null, category || 'other', priority || 'medium'];
    if (attachmentUrl !== undefined) {
      fields.push('attachment_url=?');
      params.push(attachmentUrl);
    }
    params.push(req.params.id);

    await pool.query(
      `UPDATE complaints SET ${fields.join(', ')} WHERE id=?`,
      params
    );
    res.json({ success: true, message: 'Complaint updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const resolveMyComplaint = async (req, res) => {
  try {
    const student = await findStudentByUser(req.user.id);
    if (!student)
      return res.status(404).json({ success: false, message: 'Profile not linked.' });

    const [[complaint]] = await pool.query(
      'SELECT id, status FROM complaints WHERE id=? AND student_id=?',
      [req.params.id, student.id]
    );
    if (!complaint)
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.status === 'resolved')
      return res.json({ success: true, message: 'Complaint already marked as resolved.' });

    await pool.query('UPDATE complaints SET status=? WHERE id=?', ['resolved', req.params.id]);
    res.json({ success: true, message: 'Complaint marked as resolved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getMyProfile,
  getMyDashboard,
  getMyComplaints,
  fileComplaint,
  updateMyComplaint,
  resolveMyComplaint,
};
