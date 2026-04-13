const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    let where = '1=1';
    const params = [];
    if (category) { where += ' AND n.category=?'; params.push(category); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT n.*, u.name as posted_by_name FROM notices n
       LEFT JOIN users u ON n.posted_by=u.id
       WHERE ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM notices n WHERE ${where}`,
      params
    );
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const create = async (req, res) => {
  const { title, content, category, target } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO notices (title, content, category, target, posted_by) VALUES (?,?,?,?,?)',
      [title, content, category || 'general', target || 'all', req.user.id]
    );
    res.status(201).json({ success: true, message: 'Notice posted.', id: result.insertId });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM notices WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Notice deleted.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAll, create, remove };
