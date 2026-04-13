const { pool } = require('../config/database');

/**
 * Smart Routing Engine
 * Maps complaint categories to staff specialties and auto-assigns
 * to the staff member with the fewest open complaints (load-balanced).
 */

const CATEGORY_TO_SPECIALTY = {
  electrical:    'electrician',
  plumbing:      'plumber',
  carpentry:     'carpenter',
  housekeeping:  'cleaner',
  network:       'network_admin',
  mess:          null, // general caretaker
  other:         null, // general caretaker
};

/**
 * Given a complaint category, find the best staff member to assign.
 * Returns the user ID of the assigned staff, or null if none found.
 */
const findBestStaff = async (category) => {
  const specialty = CATEGORY_TO_SPECIALTY[category];

  let query;
  let params;

  if (specialty) {
    // Find caretaker/staff with matching specialty, least open complaints
    query = `
      SELECT u.id, u.name, u.specialty,
        (SELECT COUNT(*) FROM complaints c WHERE c.assigned_to = u.id AND c.status != 'resolved') AS open_count
      FROM users u
      WHERE u.role = 'caretaker' AND u.specialty = ?
      ORDER BY open_count ASC, u.id ASC
      LIMIT 1
    `;
    params = [specialty];
  } else {
    // Find any caretaker with least open complaints
    query = `
      SELECT u.id, u.name, u.specialty,
        (SELECT COUNT(*) FROM complaints c WHERE c.assigned_to = u.id AND c.status != 'resolved') AS open_count
      FROM users u
      WHERE u.role = 'caretaker'
      ORDER BY open_count ASC, u.id ASC
      LIMIT 1
    `;
    params = [];
  }

  try {
    const [rows] = await pool.query(query, params);
    if (rows.length > 0) {
      return { id: rows[0].id, name: rows[0].name, specialty: rows[0].specialty };
    }

    // Fallback: if no specialty match, try any caretaker
    if (specialty) {
      const [fallback] = await pool.query(`
        SELECT u.id, u.name, u.specialty,
          (SELECT COUNT(*) FROM complaints c WHERE c.assigned_to = u.id AND c.status != 'resolved') AS open_count
        FROM users u
        WHERE u.role = 'caretaker'
        ORDER BY open_count ASC, u.id ASC
        LIMIT 1
      `);
      if (fallback.length > 0) {
        return { id: fallback[0].id, name: fallback[0].name, specialty: fallback[0].specialty };
      }
    }

    return null;
  } catch (err) {
    console.error('Smart Router Error:', err);
    return null;
  }
};

module.exports = { findBestStaff, CATEGORY_TO_SPECIALTY };
