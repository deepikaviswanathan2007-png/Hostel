const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM mess_menu ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), FIELD(meal_type, 'Breakfast', 'Lunch', 'Snacks', 'Dinner')`);
    
    // Group by day for easier frontend parsing
    const menuByDay = rows.reduce((acc, row) => {
      if (!acc[row.day_of_week]) acc[row.day_of_week] = {};
      acc[row.day_of_week][row.meal_type] = row;
      return acc;
    }, {});

    res.json({ success: true, data: menuByDay, raw: rows });
  } catch (err) {
    console.error('Get Mess Menu Error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving menu.' });
  }
};

const update = async (req, res) => {
  const { entries } = req.body; // Array of { day_of_week, meal_type, items }
  console.log('Mess Menu Update payload:', entries);
  
  if (!Array.isArray(entries)) {
    return res.status(400).json({ success: false, message: 'Entries array required.' });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const entry of entries) {
        if (entry.day_of_week && entry.meal_type && entry.items !== undefined) {
          await connection.query(
            `INSERT INTO mess_menu (day_of_week, meal_type, items)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE items = ?`,
            [entry.day_of_week, entry.meal_type, entry.items, entry.items]
          );
        }
      }
      await connection.commit();
      res.json({ success: true, message: 'Menu updated successfully.' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Update Mess Menu Error:', err);
    res.status(500).json({ success: false, message: 'Server error updating menu.' });
  }
};

module.exports = { getAll, update };
