const { pool } = require('../config/database');
const { ensureTable } = require('./floorWardenController');
const { normalizeWing } = require('../utils/studentList');

const assign = async (req, res) => {
  const { warden_id, block, floor, wing } = req.body;
  if (!warden_id || !block || floor == null || !wing) {
    return res.status(400).json({
      success: false,
      message: 'warden_id, block, floor, and wing are required.',
    });
  }
  const normalizedWing = normalizeWing(wing);
  if (!normalizedWing) {
    return res.status(400).json({ success: false, message: 'wing must be left or right (case-insensitive).' });
  }

  try {
    await ensureTable();
    const [users] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'warden'", [Number(warden_id)]);
    if (!users.length) {
      return res.status(400).json({ success: false, message: 'Invalid warden_id or user is not a warden.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        'DELETE FROM floor_warden_assignments WHERE block = ? AND floor = ? AND warden_id = ?',
        [block, Number(floor), Number(warden_id)]
      );
      await conn.query(
        'DELETE FROM floor_warden_assignments WHERE block = ? AND floor = ? AND wing = ?',
        [block, Number(floor), normalizedWing]
      );
      await conn.query(
        'INSERT INTO floor_warden_assignments (block, floor, wing, warden_id) VALUES (?, ?, ?, ?)',
        [block, Number(floor), normalizedWing, Number(warden_id)]
      );
      await conn.commit();
      res.json({ success: true, message: 'Warden assigned to wing.' });
    } catch (e) {
      await conn.rollback();
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Assignment conflicts with an existing floor warden rule.',
        });
      }
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { assign };
