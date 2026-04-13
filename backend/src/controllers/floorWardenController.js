const { pool } = require('../config/database');

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS floor_warden_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      block ENUM('A','B','C','D') NOT NULL,
      floor TINYINT NOT NULL,
      wing ENUM('left','right') NOT NULL,
      warden_id INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_floor_wing (block, floor, wing),
      UNIQUE KEY uniq_floor_warden (block, floor, warden_id),
      INDEX idx_floor_lookup (block, floor),
      CONSTRAINT fk_floor_warden_user FOREIGN KEY (warden_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    ALTER TABLE floor_warden_assignments
    ADD COLUMN IF NOT EXISTS wing ENUM('left','right') NOT NULL DEFAULT 'left' AFTER floor
  `).catch(() => {});
};

const getWardens = async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'warden' ORDER BY name ASC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getAssignments = async (req, res) => {
  try {
    await ensureTable();
    const { block, floor } = req.query;
    let where = '1=1';
    const params = [];

    if (block) {
      where += ' AND fwa.block = ?';
      params.push(block);
    }
    if (floor) {
      where += ' AND fwa.floor = ?';
      params.push(Number(floor));
    }

    const [rows] = await pool.query(
      `SELECT fwa.block, fwa.floor, fwa.wing, fwa.warden_id, u.name AS warden_name, u.email AS warden_email
       FROM floor_warden_assignments fwa
       INNER JOIN users u ON u.id = fwa.warden_id
       WHERE ${where}
       ORDER BY fwa.block ASC, fwa.floor ASC, FIELD(fwa.wing, 'left', 'right') ASC, u.name ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const setAssignments = async (req, res) => {
  const { block, floor, assignments } = req.body;

  if (!block || !floor) {
    return res.status(400).json({ success: false, message: 'Block and floor are required.' });
  }

  const normalizedAssignments = ['left', 'right']
    .map(wing => ({
      wing,
      warden_id: Number(assignments?.[wing] || 0) || null,
    }))
    .filter(item => item.warden_id);

  const uniqueIds = [...new Set(normalizedAssignments.map(item => item.warden_id))];
  if (uniqueIds.length !== normalizedAssignments.length) {
    return res.status(400).json({ success: false, message: 'Left wing and right wing must have different wardens.' });
  }

  const connection = await pool.getConnection();
  try {
    await ensureTable();
    await connection.beginTransaction();

    if (uniqueIds.length > 0) {
      const placeholders = uniqueIds.map(() => '?').join(',');
      const [wardenRows] = await connection.query(
        `SELECT id FROM users WHERE role = 'warden' AND id IN (${placeholders})`,
        uniqueIds
      );

      if (wardenRows.length !== uniqueIds.length) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'One or more selected users are not valid wardens.' });
      }
    }

    await connection.query(
      'DELETE FROM floor_warden_assignments WHERE block = ? AND floor = ?',
      [block, Number(floor)]
    );

    if (normalizedAssignments.length > 0) {
      const values = normalizedAssignments.map(item => [block, Number(floor), item.wing, item.warden_id]);
      await connection.query(
        'INSERT INTO floor_warden_assignments (block, floor, wing, warden_id) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Floor wardens updated successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    connection.release();
  }
};

module.exports = { getWardens, getAssignments, setAssignments, ensureTable };
