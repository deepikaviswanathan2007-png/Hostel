const { pool } = require('../config/database');
const { findBestStaff } = require('../services/smartRouter');

const getAll = async (req, res) => {
  try {
    const { status, category, priority, page=1, limit=20 } = req.query;
    let where = '1=1'; const params = [];
    if (status)   { where += ' AND c.status=?';   params.push(status); }
    if (category) { where += ' AND c.category=?'; params.push(category); }
    if (priority) { where += ' AND c.priority=?'; params.push(priority); }
    const offset = (parseInt(page)-1)*parseInt(limit);
    const [rows] = await pool.query(
      `SELECT c.*,s.name as student_name,s.register_no,r.room_number,
              u.name as assigned_to_name, u.specialty as assigned_specialty
       FROM complaints c
       LEFT JOIN students s ON c.student_id=s.id
       LEFT JOIN rooms r ON s.room_id=r.id
       LEFT JOIN users u ON c.assigned_to=u.id
       WHERE ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params,parseInt(limit),offset]
    );
    const [[{total}]] = await pool.query(`SELECT COUNT(*) as total FROM complaints c WHERE ${where}`, params);
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) { console.error('Error in ' + __filename + ':', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const create = async (req, res) => {
  const { student_id, title, description, category, priority } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title required.' });
  try {
    // Smart route: auto-assign to appropriate staff
    const cat = category || 'other';
    const staff = await findBestStaff(cat);
    const assignedTo = staff ? staff.id : null;

    const [result] = await pool.query(
      'INSERT INTO complaints (student_id,title,description,category,priority,assigned_to) VALUES (?,?,?,?,?,?)',
      [student_id||null,title,description,cat,priority||'medium',assignedTo]
    );
    res.status(201).json({
      success: true,
      message: staff ? `Complaint filed and auto-assigned to ${staff.name}.` : 'Complaint filed.',
      id: result.insertId,
      assigned_to: staff,
    });
  } catch (err) { console.error('Error in ' + __filename + ':', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateStatus = async (req, res) => {
  const { status, admin_note, assigned_to } = req.body;
  if (!['pending','in_progress','resolved'].includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  try {
    const fields = ['status=?', 'admin_note=?'];
    const params = [status, admin_note];
    if (assigned_to !== undefined) {
      fields.push('assigned_to=?');
      params.push(assigned_to || null);
    }
    params.push(req.params.id);
    await pool.query(`UPDATE complaints SET ${fields.join(',')} WHERE id=?`, params);
    res.json({ success: true, message: 'Complaint updated.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM complaints WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Complaint deleted.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getAll, create, updateStatus, remove };
