const { pool } = require('../config/database');
const { ensureTable } = require('../controllers/floorWardenController');

async function loadWardenScopes(wardenUserId) {
  await ensureTable();
  const [rows] = await pool.query(
    'SELECT block, floor, wing FROM floor_warden_assignments WHERE warden_id = ? ORDER BY block ASC, floor ASC, wing ASC',
    [wardenUserId]
  );
  return rows;
}

/**
 * Allows admin or warden to call GET /students. Sets req.wardenScopes for wardens (loaded from DB).
 */
const studentsListAccess = async (req, res, next) => {
  const role = req.user?.role;
  if (role === 'admin') {
    req.wardenScopes = null;
    return next();
  }
  if (role === 'warden') {
    try {
      req.wardenScopes = await loadWardenScopes(req.user.id);
      return next();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
  return res.status(403).json({ success: false, message: 'Access denied.' });
};

module.exports = { loadWardenScopes, studentsListAccess };
